import fs from 'fs'
import path from 'path'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { encoding_for_model } from 'tiktoken'
import { 
  getCursorWorkspaceStorageDir,
  getCursorGlobalStorageDir,
  getTargetWorkspaceId
} from './cursorWorkspace'

interface ChatEntry {
  type: string;
  text: string;
  code: string[];
}

type getChatLogParams = {
  workspaceDir: string,
  start: Date,
  end: Date,
}

// Accepted
type ChatLogResult = {
  chatCount: {
    input: number,
    output: number,
  },
  entries: ChatEntry[],
  tokens: {
    input: number,
    output: number,
  },
  usageAmount: number,
  proposedCodeCount: number,
  adoptionRate: number,
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

const getComposerIds = async (params: getChatLogParams) =>{
  const { workspaceDir, start, end } = params
  const storageDir = getCursorWorkspaceStorageDir()
  const targetWorkspaceId = getTargetWorkspaceId(workspaceDir)
  const targetWorkspaceDbPath = path.join(storageDir, targetWorkspaceId, 'state.vscdb')

  if (!fs.existsSync(targetWorkspaceDbPath)) return []
  const workspacedb = await open({ filename: targetWorkspaceDbPath, driver: sqlite3.Database })
  const composerDatas = await workspacedb.get(
    `SELECT value FROM ItemTable WHERE [key] = ?`,
    ['composer.composerData']
  )

  if (!composerDatas) return []

  const composerDatasJson = JSON.parse(composerDatas.value)
  const composerIds = composerDatasJson.allComposers.map((composer: any) => composer.composerId)
  return composerIds.filter((composerId: string) => {
    const composerData = composerDatasJson.allComposers.find((composer: any) => composer.composerId === composerId)
    const lastUpdatedAt = new Date(composerData.lastUpdatedAt)
    return start <= lastUpdatedAt && lastUpdatedAt <= end
  })
}

const defaultChatLogResult: ChatLogResult = {
  chatCount: {
    input: 0,
    output: 0,
  },
  entries: [],
  tokens: {
    input: 0,
    output: 0,
  },
  usageAmount: 0,
  proposedCodeCount: 0,
  adoptionRate: 0,
}

/**
 * Count chat bubbles between start and end timestamps across all workspaces.
 */
export async function getChatLogs(
  params: getChatLogParams
): Promise<ChatLogResult> {
  const composerIds = await getComposerIds(params)
  if (composerIds.length === 0) return defaultChatLogResult;

  const globalStorageDir = getCursorGlobalStorageDir()
  const globalDbPath = path.join(globalStorageDir, 'state.vscdb')
  const globalDb = await open({ filename: globalDbPath, driver: sqlite3.Database })
  
  const composerDataRows = await globalDb.all(
    `SELECT value FROM cursorDiskKV WHERE [key] IN (${composerIds.map((id: string) => `'composerData:${id}'`).join(',')})`,
  )
  
  const composerDataJsons = composerDataRows.map((row: any) => JSON.parse(row.value))
  const usageAmount = composerDataJsons.reduce((acc: number, composerData: any) => {
    return acc + composerData.usageData.default.amount
  }, 0)

  const bubbleIds = composerDataJsons.map((composerData: any) => {
    return composerData.fullConversationHeadersOnly.map((header: any) => {
      return `bubbleId:${composerData.composerId}:${header.bubbleId}`
    })
  }).flat()

  const bubbles = await globalDb.all(
    `SELECT value FROM cursorDiskKV WHERE [key] IN (${bubbleIds.map((id: string) => `'${id}'`).join(',')})`,
  )
  const bubblesJson = bubbles.map((bubble: any) => JSON.parse(bubble.value))

  const tokens = bubblesJson.reduce((acc: { input: number, output: number }, bubble: any) => {
    return {
      input: acc.input + bubble.tokenCount.inputTokens,
      output: acc.output + bubble.tokenCount.outputTokens,
    }
  }, { input: 0, output: 0 })

  const chatCount = {
    input: bubblesJson.filter((bubble: any) => bubble.type === 1).length,
    output: bubblesJson.filter((bubble: any) => bubble.type === 2).length,
  }

  // Chat entry
  const entries = bubblesJson.map((bubble: any) => {
    return {
      bubbleId: bubble.bubbleId,
      type: bubble.type,
      text: bubble.text,
      code: bubble.codeBlocks?.map((codeBlock: any) => codeBlock.content) || []
    }
  })
  const sortedEntries = composerDataJsons.map((composerData: any) => {
    return composerData.fullConversationHeadersOnly.map((header: any) => {
      // entriesからbubbleIdが一致するものを取得
      const entry = entries.find((entry: any) => entry.bubbleId === header.bubbleId)
      if (!entry) return null
      return {
        type: entry.type,
        text: entry.text,
        code: entry.code,
      }
    })
  })

  // Code block
  const codeBlockData = composerDataJsons.flatMap((composerData: any) =>
    Object.values(composerData.codeBlockData).flat()
  );
  const proposedCodeCount = codeBlockData.length
  const codeChangeAccepted = codeBlockData.filter((codeBlock: any) => codeBlock.status === 'accepted').length
  const adoptionRate = proposedCodeCount > 0 ? codeChangeAccepted / proposedCodeCount : 0

  return { 
    chatCount,
    entries: sortedEntries,
    tokens,
    usageAmount,
    proposedCodeCount,
    adoptionRate
  }
}