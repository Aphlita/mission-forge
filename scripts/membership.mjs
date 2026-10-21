// SPDX-FileCopyrightText: Copyright (c) 2026 Process Mission
// SPDX-License-Identifier: MIT
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export function participantPath(login) {
  if (typeof login !== 'string' || !/^[a-z0-9-]{1,39}$/i.test(login)) {
    throw new Error('Invalid GitHub username.');
  }
  return `participants/${login.toLowerCase()}.json`;
}

export function validateRegistration(record, author, filename) {
  if (!record || Array.isArray(record) || typeof record !== 'object' ||
      Object.keys(record).sort().join(',') !== 'github_id,github_login') {
    throw new Error('Registration must contain only github_id and github_login.');
  }
  if (!Number.isSafeInteger(record.github_id) || record.github_id <= 0 ||
      typeof record.github_login !== 'string' ||
      record.github_id !== author.id ||
      record.github_login.toLowerCase() !== author.login.toLowerCase() ||
      filename !== participantPath(author.login) || author.type !== 'User') {
    throw new Error('Registration must match the PR author and lowercase username filename.');
  }
  return record;
}

export function createClient(token, repository = 'processmission/mission-forge') {
  if (repository !== 'processmission/mission-forge') throw new Error('Unexpected repository.');
  if (!token) throw new Error('GITHUB_TOKEN is required.');
  async function request(path, method = 'GET', body) {
    const response = await fetch(`https://api.github.com/${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      const error = new Error(`GitHub ${method} ${path}: ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  }
  const root = `repos/${repository}`;
  async function list(path) {
    const result = [];
    for (let page = 1; ; page++) {
      const items = await request(`${path}?per_page=100&page=${page}`);
      result.push(...items);
      if (items.length < 100) return result;
    }
  }
  async function registered(user) {
    if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new Error('Invalid user ID.');
    if (user.type !== 'User') return false;
    let file;
    try {
      file = await request(`${root}/contents/${participantPath(user.login)}`);
    } catch (error) {
      if (error.status === 404) return false;
      throw error;
    }
    if (file.type !== 'file' || file.encoding !== 'base64') throw new Error('Invalid registration file.');
    const record = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
    if (!record || Array.isArray(record) || typeof record !== 'object' ||
        Object.keys(record).sort().join(',') !== 'github_id,github_login' ||
        !Number.isSafeInteger(record.github_id) || typeof record.github_login !== 'string') {
      throw new Error('Malformed registration; moderation stopped.');
    }
    return record.github_id === user.id && record.github_login.toLowerCase() === user.login.toLowerCase();
  }
  return {request, list, registered, root};
}

export async function validatePullRequest(client, number) {
  const pr = await client.request(`${client.root}/pulls/${number}`);
  const repo = await client.request(client.root);
  const files = await client.list(`${client.root}/pulls/${number}/files`);
  if (files.length !== pr.changed_files) throw new Error('Incomplete PR file list.');
  const registrations = files.filter(file =>
    (file.filename.startsWith('participants/') && file.filename !== 'participants/README.md') ||
    (file.previous_filename?.startsWith('participants/') && file.previous_filename !== 'participants/README.md'));
  if (!registrations.length) return 'No registration changes.';
  if (files.length === registrations.length && registrations.every(file =>
    file.status === 'removed' && /^participants\/[a-z0-9-]{1,39}\.json$/.test(file.filename))) {
    const access = await client.request(`${client.root}/collaborators/${encodeURIComponent(pr.user.login)}/permission`);
    if (!['admin', 'maintain', 'write'].includes(access.permission)) {
      throw new Error('Registration removal requires a repository maintainer.');
    }
    if (pr.base.ref !== repo.default_branch) throw new Error('Removal must target the default branch.');
    return 'Maintainer registration removal; human review is required.';
  }
  if (pr.base.ref !== repo.default_branch || !pr.head.repo?.fork || pr.head.repo.full_name === repo.full_name) {
    throw new Error('Registration must come from a fork and target the default branch.');
  }
  const target = registrations.find(file => file.filename === participantPath(pr.user.login) &&
    ['added', 'modified', 'renamed'].includes(file.status));
  const removed = registrations.filter(file => file.status === 'removed');
  if (!target || files.length !== 1 + removed.length || removed.length > 1 ||
      (removed.length && target.status !== 'added')) {
    throw new Error('A registration PR must only add, update or rename its author’s username JSON file.');
  }
  const previous = target.previous_filename || removed[0]?.filename;
  if (previous) {
    if (!/^participants\/[a-z0-9-]{1,39}\.json$/.test(previous)) throw new Error('Invalid previous registration path.');
    const oldFile = await client.request(`${client.root}/contents/${previous}?ref=${pr.base.sha}`);
    if (oldFile.type !== 'file' || oldFile.encoding !== 'base64') throw new Error('Invalid previous registration.');
    const oldRecord = JSON.parse(Buffer.from(oldFile.content, 'base64').toString('utf8'));
    if (oldRecord.github_id !== pr.user.id) throw new Error('Cannot rename another participant’s registration.');
  }
  const blob = await client.request(`${client.root}/git/blobs/${target.sha}`);
  if (blob.encoding !== 'base64' || blob.size > 4096) throw new Error('Invalid registration content.');
  const record = JSON.parse(Buffer.from(blob.content, 'base64').toString('utf8'));
  validateRegistration(record, pr.user, target.filename);
  const user = await client.request(`users/${encodeURIComponent(record.github_login)}`);
  validateRegistration(record, user, target.filename);
  return 'Registration identity verified. Maintainer review and merge are required.';
}

export async function moderate(client, event, eventName) {
  if (event.repository?.full_name !== 'processmission/mission-forge') throw new Error('Unexpected event repository.');
  if (event.issue?.pull_request) return 'PR discussions remain open.';
  if (eventName === 'issues' && ['opened', 'reopened'].includes(event.action)) {
    const issue = await client.request(`${client.root}/issues/${event.issue.number}`);
    if (issue.pull_request || issue.state !== 'open') return 'No open issue to process.';
    if (await client.registered(issue.user)) return 'Registered issue author.';
    await client.request(`${client.root}/issues/${issue.number}`, 'PATCH',
      {state: 'closed', state_reason: 'not_planned'});
    return `Closed unregistered issue #${issue.number}.`;
  }
  if (eventName === 'issue_comment' && ['created', 'edited'].includes(event.action)) {
    let comment;
    try {
      comment = await client.request(`${client.root}/issues/comments/${event.comment.id}`);
    } catch (error) {
      if (error.status === 404) return 'Comment already removed.';
      throw error;
    }
    const issue = await client.request(`${client.root}/issues/${event.issue.number}`);
    if (issue.pull_request) return 'PR discussions remain open.';
    if (await client.registered(comment.user)) return 'Registered comment author.';
    try {
      await client.request(`${client.root}/issues/comments/${comment.id}`, 'DELETE');
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    return `Removed unregistered comment ${comment.id}.`;
  }
  throw new Error('Unsupported moderation event.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = createClient(process.env.GITHUB_TOKEN, process.env.GITHUB_REPOSITORY);
  const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  if (event.repository?.full_name !== 'processmission/mission-forge') throw new Error('Unexpected event repository.');
  const result = process.argv[2] === 'registration'
    ? await validatePullRequest(client, event.pull_request.number)
    : await moderate(client, event, process.env.GITHUB_EVENT_NAME);
  console.log(result);
}
