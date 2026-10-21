require 'yaml'
require 'json'
require 'base64'
require 'open3'
require 'optparse'
require 'fileutils'

REPO = 'processmission/mission-forge'.freeze
TEMPLATES = %w[01-task.yml 02-bug.yml 03-improvement.yml 04-question.yml].freeze

def api(path)
  output, error, status = Open3.capture3('gh', 'api', path)
  raise "GitHub read failed: #{error.strip}" unless status.success?
  JSON.parse(output)
end

def source_file(path, commit)
  result = api("repos/#{REPO}/contents/#{path}?ref=#{commit}")
  raise "Unsupported encoding: #{path}" unless result['encoding'] == 'base64'
  [Base64.decode64(result.fetch('content')).force_encoding('UTF-8'), result.fetch('sha')]
end

def prepare(options)
  template = options.fetch(:template)
  raise 'Choose a supported template' unless TEMPLATES.include?(template)
  repo = api("repos/#{REPO}")
  branch = repo.fetch('default_branch')
  require 'uri'
  commit = api("repos/#{REPO}/commits/#{URI.encode_www_form_component(branch)}").fetch('sha')
  path = ".github/ISSUE_TEMPLATE/#{template}"
  raw, form_sha = source_file(path, commit)
  labels_raw, labels_sha = source_file('.github/labels.json', commit)
  form = YAML.safe_load(raw, permitted_classes: [], permitted_symbols: [], aliases: false)
  raise 'Invalid form' unless form.is_a?(Hash) && form['body'].is_a?(Array)
  fields = form.fetch('body').reject { |field| field['type'] == 'markdown' }
  ids = fields.map { |field| field.fetch('id') }
  raise 'Duplicate field IDs' unless ids.uniq == ids
  fields.each do |field|
    raise "Unsupported field type: #{field['type']}" unless %w[input textarea dropdown].include?(field['type'])
    raise 'Unsupported rendered field; inspect the current template' if field.fetch('attributes').key?('render')
    field.fetch('attributes').fetch('label')
  end
  if options[:inspect]
    puts JSON.pretty_generate({repo: REPO, commit: commit, template: form})
    return
  end
  answers = JSON.parse(File.read(options.fetch(:answers)))
  raise 'Answers must be an object keyed by field ID' unless answers.is_a?(Hash)
  unknown = answers.keys - ids
  raise "Unknown fields: #{unknown.join(', ')}" unless unknown.empty?
  sections = fields.map do |field|
    id = field.fetch('id')
    attributes = field.fetch('attributes')
    value = answers[id]
    empty = value.nil? || (value.is_a?(String) && value.strip.empty?) || value == []
    raise "Missing required field: #{id}" if empty && field.fetch('validations', {})['required']
    answer = if empty
      '_No response_'
    elsif field['type'] == 'dropdown'
      choices = attributes.fetch('options')
      if attributes['multiple']
        raise "Expected an array: #{id}" unless value.is_a?(Array) && value.all? { |item| item.is_a?(String) }
        raise "Duplicate selections: #{id}" unless value.uniq == value
        raise "Invalid selection: #{id}" unless (value - choices).empty?
        value.join(', ')
      else
        raise "Invalid selection: #{id}" unless value.is_a?(String) && choices.include?(value)
        value
      end
    else
      raise "Expected text: #{id}" unless value.is_a?(String)
      raise "Input must be one line: #{id}" if field['type'] == 'input' && value.match?(/[\r\n]/)
      value.strip
    end
    "### #{attributes.fetch('label')}\n\n#{answer}"
  end
  title = options.fetch(:title).strip
  prefix = form.fetch('title')
  title = prefix + title unless title.start_with?(prefix)
  raise 'Provide a specific single-line title' if title.delete_prefix(prefix).strip.empty? || title.match?(/[\r\n]/)
  raise 'Title exceeds 256 characters' if title.length > 256
  labels = form.fetch('labels')
  raise 'Expected a label array' unless labels.is_a?(Array)
  catalog = JSON.parse(labels_raw).map { |label| label.fetch('name') }
  raise 'Template uses labels outside the catalog' unless (labels - catalog).empty?
  labels.each do |label|
    api("repos/#{REPO}/labels/#{URI.encode_www_form_component(label)}")
  end
  body = sections.join("\n\n") + "\n"
  raise 'Body exceeds GitHub limit' if body.length > 65_536
  output = File.expand_path(options.fetch(:output))
  raise 'Output directory already exists; choose a new directory' if File.exist?(output)
  FileUtils.mkdir_p(output)
  File.write(File.join(output, 'body.md'), body)
  File.write(File.join(output, 'issue.json'), JSON.pretty_generate({title: title, body: body, labels: labels}) + "\n")
  File.write(File.join(output, 'source.json'), JSON.pretty_generate({repo: REPO,
    branch: branch, commit: commit, template: path, template_sha: form_sha,
    labels_sha: labels_sha}) + "\n")
  puts "Validated draft: #{output}"
end

options = {}
parser = OptionParser.new do |p|
  p.banner = 'Usage: ruby prepare.rb --template FILE --inspect | --answers FILE --title TEXT --output DIR'
  p.on('--template FILE') { |v| options[:template] = v }
  p.on('--inspect') { options[:inspect] = true }
  p.on('--answers FILE') { |v| options[:answers] = v }
  p.on('--title TEXT') { |v| options[:title] = v }
  p.on('--output DIR') { |v| options[:output] = v }
end
begin
  parser.parse!
  raise 'Unexpected positional arguments' unless ARGV.empty?
  prepare(options)
rescue StandardError => e
  warn e.message
  exit 1
end
