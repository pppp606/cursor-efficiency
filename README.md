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
  "proposedCodeCount": "number",
  "adoptionRate": "number",
  "chatEntries": "array (optional)"
}
```

### Field Descriptions

- `startTime`: The timestamp when measurement started (ISO format)
- `endTime`: The timestamp when measurement ended (ISO format)
- `usedTokens`: Token usage statistics
  - `input`: Number of tokens used in user inputs
  - `output`: Number of tokens used in AI responses
- `usageRequestAmount`: The calculated cost of API usage
- `chatCount`: Number of chat interactions
  - `input`: Number of user messages
  - `output`: Number of AI responses
- `git`
  - `branch`: The name of the current Git branch during measurement
  - `linesChanged`: Total number of lines changed in git commits between start and end time. This counts the actual committed changes, not just proposed changes. (only included when using `--include-chat-entries` option)
  - `diff`: diff code (only included when using `--include-chat-entries` option)
- `proposedCodeCount`: Number of code suggestions made by Cursor's AI
- `adoptionRate`: Percentage of AI-suggested changes that were adopted
- `chatEntries`: Detailed chat history (only included when using `--include-chat-entries` option)

## Usage Scenario

The tool is designed to measure your coding efficiency with Cursor IDE. Here's a typical workflow:

1. Start measurement before beginning your coding session:
   ```bash
   cursor-efficiency start
   ```

2. Work on your code using Cursor IDE, making commits as you go

3. End measurement after completing your work and making final commits:
   ```bash
   cursor-efficiency end
   ```

This will give you insights into:
- How much code you've actually committed
- Your interaction with Cursor's AI
- The efficiency of your coding process

## Important Notes

1. The tool requires a git repository to be initialized in your project directory
2. Make sure you have the necessary permissions to access Cursor's workspace storage

## Examples of Using Logs

Below are two examples of how to utilize the generated logs.

### 1. Passing Logs to an LLM for Individual Improvement

Use the JSON-formatted log output from Cursor-efficiency as-is and feed it to an LLM to receive feedback on your coding process and AI interactions. Prepare a prompt like the following:

```text
You are an AI coach whose role is to analyze “Cursor-efficiency” agent interaction logs and propose improvements for future sessions.
**Goals:**

* Increase adoptionRate (the rate at which suggested code is accepted)
* Reduce chatCount (the number of back-and-forth messages)
* Reduce usageRequestAmount (the number of AI requests per session)

**Tasks:**

1. Based on the indicators in the logs (token usage, adoptionRate, chat counts, diff line counts, etc.), identify areas where inefficiency or room for improvement exists.
2. Provide concrete advice on how to interact more effectively with the agent (e.g., prompt structure, response format) to achieve those goals.
3. List the top-priority points to address in the next session, in bullet form.

**Constraints:**

* All observations must be grounded in quantitative evidence; avoid vague statements.
* Advice should be specific and actionable, including concrete ways to reduce back-and-forth messages and token consumption.

### Logs
{
  "startTime": "2025-06-01T09:00:00.000Z",
  "endTime": "2025-06-01T10:30:00.000Z",
  "usedTokens": {
    "input": 1200,
    "output": 980
  },
  ...
}
```

### 2. Collecting and Analyzing Team-wide Logs via Git Hooks

Have every team member use Cursor-efficiency, and automatically collect logs at git push time to a central server or shared storage. This allows you to understand team-wide trends. One example workflow is as follows:

#### 1. Add a Hook in the Local Repository
Place a script like the following in your project’s `.git/hooks/pre-push` (or in your CI pipeline):

```bash
#!/bin/bash
# Example pre-push hook (make sure this file is executable)

# 1. Determine current branch and short commit SHA
BRANCH=$(git rev-parse --abbrev-ref HEAD)
SHA=$(git rev-parse --short HEAD)
LOG_FILE="cursor_log_${BRANCH}_${SHA}.json"

# 2. End the Cursor-efficiency measurement (capture the log just before pushing)
cursor-efficiency end -c > "$LOG_FILE"

# 3. Send the log to a shared storage or central server (e.g., internal server or S3)
#    Use curl as an example; adjust as needed.
curl -X POST \
  -H "Content-Type: application/json" \
  -d @"$LOG_FILE" \
  https://example.com/api/team-logs/upload

# 4. If the upload succeeds, proceed with the push; otherwise, abort.
if [ $? -ne 0 ]; then
  echo "Failed to upload log. Aborting push."
  exit 1
fi

exit 0
````

#### 2. Aggregate and Analyze Logs on the Server

- Import each member’s log file (e.g., cursor_log_feature-add-new-api_ab12cd.json) into a centralized database (e.g., BigQuery, Elasticsearch).
- Create dashboards to visualize metrics such as:
  - Average token usage, average chat count, average adoption rate
  - Trends by model or by project
  - Time-series analysis (e.g., monthly adoption rate changes)
- This makes it easy to share insights like “Project X achieved a 60% adoption rate” or “Model Y yielded high efficiency,” helping the entire team learn best practices.

#### 3. **Establish a Regular Feedback Loop**

- Based on the analysis, share reports in internal chat or meetings, such as “Adoption rate improved from 50% to 65% last month” or “Model Z had the best token-to-output efficiency.”
- Team members can review these logs and reflect on their own prompt design and AI interaction patterns, continuously improving overall development efficiency.
