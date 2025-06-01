# cursor-efficiency

A CLI tool to report token usage, chat count, lines changed, and adoption rate for Cursor IDE.

## Installation

### Global Installation

```bash
# Install the package globally
npm install -g cursor-efficiency

# Make the package executable (if needed)
npm link cursor-efficiency
```

### Local Installation

```bash
# Install locally in your project
npm install cursor-efficiency

# Add to your package.json scripts
{
  "scripts": {
    "cursor-efficiency": "cursor-efficiency"
  }
}
```

Then you can run it using:
```bash
npm run cursor-efficiency start
# or
npm run cursor-efficiency end
```

## Usage

The tool provides two main commands:

### Start Measurement

```bash
cursor-efficiency start
```

This command begins the measurement process. It will:
- Record the current git branch and commit SHA
- Create a configuration file in your project directory

### End Measurement

```bash
cursor-efficiency end
```

This command ends the measurement and outputs a report. It supports the following options:

- `-c, --include-chat-entries`: Include detailed chat entries in the output

## Output Format

The tool outputs a JSON object with the following fields:

```json
{
  "branch": "string",
  "startTime": "string (ISO format)",
  "endTime": "string (ISO format)",
  "usedTokens": {
    "input": "number",
    "output": "number"
  },
  "usageRequestAmount": "number",
  "chatCount": {
    "input": "number",
    "output": "number"
  },
  "linesChanged": "number",
  "codeChangeCount": "number",
  "adoptionRate": "number",
  "chatEntries": "array (optional)"
}
```

### Field Descriptions

- `branch`: The name of the current Git branch during measurement
- `startTime`: The timestamp when measurement started (ISO format)
- `endTime`: The timestamp when measurement ended (ISO format)
- `usedTokens`: Token usage statistics
  - `input`: Number of tokens used in user inputs
  - `output`: Number of tokens used in AI responses
- `usageRequestAmount`: The calculated cost of API usage
- `chatCount`: Number of chat interactions
  - `input`: Number of user messages
  - `output`: Number of AI responses
- `linesChanged`: Total number of lines modified in the codebase
- `codeChangeCount`: Number of code changes made
- `adoptionRate`: Percentage of suggested changes that were adopted
- `chatEntries`: Detailed chat history (only included when using `--include-chat-entries` option)

## Important Notes

1. The tool requires a git repository to be initialized in your project directory
2. Make sure you have the necessary permissions to access Cursor's workspace storage
3. The token count calculation is based on GPT-4's tokenizer and may differ from actual usage depending on the model selected by Cursor
