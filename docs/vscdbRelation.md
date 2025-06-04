# Cursor Local Storage Data Structure (v0.50.5)

This document describes the structure and relationships of local SQLite databases used by the **Cursor** application.

All information is based on analysis of **Cursor version 0.50.5 (Universal)**.  
Future versions may introduce changes in the schema, file layout, or key structure.

This document focuses on the parts relevant to:
- Chat history (`bubbleId`)
- Code suggestions (`codeBlockData`)
- Usage metrics (`usageData`)
- Code diffs (`codeBlockDiff`)

---

## 📁 Storage Structure

All data is stored under an OS-specific base directory for the Cursor app.

### Base Path by Platform

| OS      | Base Directory Path |
|---------|---------------------|
| macOS   | `~/Library/Application Support/Cursor/User` |
| Windows | `%APPDATA%/Cursor/User` |
| Linux   | `~/.config/Cursor/User` |

From the base path, two key subdirectories are used:

- `workspaceStorage/{workspaceId}/state.vscdb`
  Local database specific to each workspace.

- `globalStorage/state.vscdb`
  Shared database across all workspaces.

---

## 🗃️ Key Tables and Relationships

### `ItemTable` (in workspace DB)

- Key: `'composer.composerData'`
- Value: JSON containing metadata for all composers.

```json
{
  "allComposers": [
    {
      "composerId": "abc123",
      "lastUpdatedAt": "2025-06-01T00:00:00.000Z"
    },
  ]
}
````

Each `composerId` acts as the link to global chat and code data.

---

### `cursorDiskKV` (in global DB)

#### 1. Composer Data

* Key: `composerData:{composerId}`
* Value: JSON with:

  * `fullConversationHeadersOnly[]`: holds `bubbleId` values
  * `codeBlockData`: stores code suggestions
  * `usageData`: token/cost usage summary

##### Example JSON

This is a simplified excerpt of the full `composerData:{composerId}` JSON structure, focusing only on the parts relevant to chat logs, code suggestions, and usage data.

```json
{
  "fullConversationHeadersOnly": [
    {
      "bubbleId": "d1cb0b8d-cc82-43da-af6d-6ba6c8cc741f",
      "type": 1
    },
    {
      "bubbleId": "bdce7a48-0d30-4fb3-8c9a-fb5ca602bca8",
      "type": 2,
      "serverBubbleId": "377cb721-d158-4e2c-bc9b-cadcff902500"
    },
    {
      "bubbleId": "7dd300cc-6205-47ab-913e-fc921e68cef9",
      "type": 2
    }
  ],
  "codeBlockData": {
    "file:///path/to/project/docs/api/openapi.yaml": [
      {
        "_v": 2,
        "bubbleId": "7dd300cc-6205-47ab-913e-fc921e68cef9",
        "codeBlockIdx": 0,
        "uri": {
          "fsPath": "/path/to/project/docs/api/openapi.yaml",
          "scheme": "file"
        },
        "version": 0,
        "status": "rejected",
        "languageId": "yaml",
        "diffId": "9f62fe4e-309a-452f-9c88-a52def13acbc",
        "lastDiffId": "e6629b12-2942-42d1-9f0b-45aed26bd704",
        "isNoOp": false
      },
      {
        "_v": 2,
        "bubbleId": "b2117c61-794c-4843-910a-967e4b698177",
        "codeBlockIdx": 0,
        "version": 1,
        "status": "accepted",
        "diffId": "6049226b-2fcb-4cfb-8a34-e2dff9b2d5f7",
        "lastDiffId": "e2a06dbe-461f-4b9f-bb43-625325bbd4d9",
        "isNoOp": false
      }
    ]
  },
  "usageData": {
    "default": {
      "costInCents": 8,
      "amount": 2
    }
  }
}
```

#### 2. Chat Bubbles

* Key: `bubbleId:{composerId}:{bubbleId}`
* Value: JSON with:

  * `type`: 1 = user, 2 = assistant
  * `text`: chat message
  * `tokenCount`: `{ inputTokens, outputTokens }`
  * `codeBlocks[]`: optional embedded code

#### 3. Code Diffs

* Each code block may have a `diffId`.
* Key: `codeBlockDiff:{composerId}:{diffId}`
* Value: JSON representing the diff (e.g. `git diff`-like structure)

---

## 🔗 Relationship Diagram

```text
ItemTable ('composer.composerData')
  └── allComposers[].composerId
       └── composerData:{composerId}
             ├── fullConversationHeadersOnly[].bubbleId
             │     └── bubbleId:{composerId}:{bubbleId}
             └── codeBlockData[filePath][].diffId
                   └── codeBlockDiff:{composerId}:{diffId}
```

---

## 💡 Notes

* `codeBlockData` is grouped by file path, with each file containing an array of code suggestions.
* `status` of each code block indicates if it was accepted (`"accepted"`).
* Token usage is summarized in the `usageData.default.amount` field per composer.
* All keys are stored in a key-value format (`cursorDiskKV`) with string keys and JSON values.

