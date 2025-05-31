import fs from 'fs'
import path from 'path'
import os from 'os'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { encoding_for_model } from 'tiktoken'

// Detect OS-specific Cursor storage base path
const getCursorWorkspaceStorageDir = () => {
  const home = os.homedir()
  switch (process.platform) {
    case 'darwin': // macOS
      return path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'workspaceStorage')
    case 'win32': // Windows
      return path.join(process.env.APPDATA || '', 'Cursor', 'User', 'workspaceStorage')
    case 'linux': // Linux
    default:
      return path.join(home, '.config', 'Cursor', 'User', 'workspaceStorage')
  }
}

const getTargetWorkspaceId = (workspaceDir: string) => {
  const storageDir = getCursorWorkspaceStorageDir()
  
  for (const entry of fs.readdirSync(storageDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue

    const workspaceJsonPath = path.join(storageDir, entry.name, 'workspace.json')
    if (!fs.existsSync(workspaceJsonPath)) continue

    try {
      const workspaceJson = JSON.parse(fs.readFileSync(workspaceJsonPath, 'utf-8'))
      const workspaceFolder = workspaceJson.folder?.replace('file://', '')
      
      if (workspaceFolder && path.normalize(workspaceFolder) === path.normalize(workspaceDir)) {
        return entry.name
      }
    } catch (error) {
      console.error(`[ERROR] Failed to parse workspace.json: ${error}`)
      continue
    }
  }

  throw new Error(`Workspace not found for directory: ${workspaceDir}`)
}

interface ChatEntry {
  timestamp: Date;
  type: string;
  input?: string;
  inputTokens?: number;
}

/**
 * Calculate tokens for a given text using tiktoken
 */
function calculateTokens(text: string): number {
  if (!text) return 0
  // NOTE: The actual token count may differ from this calculation depending on the model selected by Cursor
  const encoder = encoding_for_model('gpt-4')
  return encoder.encode(text).length
}

/**
 * Count chat bubbles between start and end timestamps across all workspaces.
 */
export async function getChatLogs(
  workspaceDir: string,
  start: Date,
  end: Date
): Promise<{ total: number; entries: ChatEntry[]; tokens: number }> {
  const storageDir = getCursorWorkspaceStorageDir()
  const targetWorkspaceId = getTargetWorkspaceId(workspaceDir)
  const targetWorkspaceDbPath = path.join(storageDir, targetWorkspaceId, 'state.vscdb')

  if (!fs.existsSync(targetWorkspaceDbPath)) return { total: 0, entries: [], tokens: 0 }

  let total = 0
  let tokenCount = 0
  const entries: ChatEntry[] = []
  

  const db = await open({ filename: targetWorkspaceDbPath, driver: sqlite3.Database })
  
  const possibleKeys = [
    'aiService.generations',
    'aiService.prompts',
    'workbench.panel.chatSidebar',
    'workbench.panel.chat'
  ]

  let chatData = null
  for (const key of possibleKeys) {
    const row: any = await db.get(
      `SELECT value FROM ItemTable WHERE [key] = ?`,
      [key]
    )
    if (row?.value) {        
      if (row.value === '[]' || row.value.includes('"collapsed"')) {
        continue
      }
      
      chatData = row.value
      break
    }
  }
  await db.close()

  if (!chatData) return { total: 0, entries: [], tokens: 0 }

  try {
    const generations = JSON.parse(chatData)
    if (!Array.isArray(generations)) {
      return { total: 0, entries: [], tokens: 0 }
    }

    const filteredEntries = generations
      .map((gen: { 
        unixMs: number; 
        textDescription?: string; 
        type?: string;
        inputTokens?: number;
      }) => {
        const date = new Date(gen.unixMs)
        const isInRange = start <= date && date <= end
        
        if (isInRange) {          
          const inputTokens = gen.inputTokens || calculateTokens(gen.textDescription || '')
          
          const entry: ChatEntry = {
            timestamp: date,
            type: gen.type || 'unknown',
            input: gen.textDescription,
            inputTokens,
          }
          entries.push(entry)
          
          tokenCount += inputTokens
        }
        
        return date
      })
      .filter((t: Date) => start <= t && t <= end)
    
    total += filteredEntries.length
  } catch (error) {
    console.error(`[ERROR] Failed to process chat data: ${error}`)
    return { total: 0, entries: [], tokens: 0 }
  }

  return { 
    total, 
    entries, 
    tokens: tokenCount
  }
}