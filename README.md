# cursor-efficiency

A CLI tool to report token usage, chat count, lines changed, and adoption rate for Cursor IDE.

## Installation

```bash
# Install the package globally
npm install -g cursor-efficiency

# Or install locally in your project
npm install cursor-efficiency
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
cursor-efficiency end [branch]
```

This command ends the measurement and outputs a report. It supports the following options:

- `[branch]`: Optional branch name to verify against the starting branch
- `-c, --include-chat-entries`: Include detailed chat entries in the output

## Output Format

The tool outputs a JSON object with the following fields:

```json
{
  "branch": "string",          // Git branch name
  "startTime": "string",       // ISO timestamp of measurement start
  "endTime": "string",         // ISO timestamp of measurement end
  "promptTokensUsed": number,  // Total number of tokens used in chats
  "requestUsageCount": number, // Total number of Usage Premium models  
  "chatCount": number,         // Total number of chat interactions
  "linesChanged": number,      // Total number of lines changed in git
  "chatEntries": array         // Optional: Detailed chat entries (if -c flag is used)
}
```

## Important Notes

1. The tool requires a git repository to be initialized in your project directory
2. Make sure you have the necessary permissions to access Cursor's workspace storage
3. The token count calculation is based on GPT-4's tokenizer and may differ from actual usage depending on the model selected by Cursor
4. The configuration file (`.cursor-efficiency.json`) is created in your project directory and should be added to `.gitignore`

## Supported Platforms

- macOS
- Windows
- Linux