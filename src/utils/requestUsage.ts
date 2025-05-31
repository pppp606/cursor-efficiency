import path from 'path'
import os from 'os'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'

// Detect OS-specific Cursor storage base path
const getCursorGlobalStorageDir = () => {
  const home = os.homedir()
  switch (process.platform) {
    case 'darwin': // macOS
      return path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'globalStorage')
    case 'win32': // Windows
      return path.join(process.env.APPDATA || '', 'Cursor', 'User', 'globalStorage')
    case 'linux': // Linux
    default:
      return path.join(home, '.config', 'Cursor', 'User', 'globalStorage')
  }
}

const getCursorAuthRefreshToken = async () => {
  const storageDir = getCursorGlobalStorageDir()
  const db = await open({ filename: path.join(storageDir, 'state.vscdb'), driver: sqlite3.Database })
  const token = await db.get('SELECT value FROM ItemTable WHERE [key] = ?', ['cursorAuth/refreshToken'])
  await db.close()
  return token
}

type usageType = {  
  numRequests: number
  numRequestsTotal: number
  numTokens: number
}

// Example response
// {
//   "gpt-4":{
//     "numRequests":127,
//     "numRequestsTotal":127,
//     "numTokens":1523440,
//     "maxRequestUsage":500,
//     "maxTokenUsage":null
//   },
//   "gpt-3.5-turbo":{
//     "numRequests":0,
//     "numRequestsTotal":0,
//     "numTokens":0,
//     "maxRequestUsage":null,
//     "maxTokenUsage":null
//     },
//   "gpt-4-32k":{
//     "numRequests":0,
//     "numRequestsTotal":0,
//     "numTokens":0,
//     "maxRequestUsage":50,
//     "maxTokenUsage":null
//   },
//   "startOfMonth":"2025-05-24T12:35:02.000Z"
// }
type usageResponse = {
  [key: string]: usageType | string
}

export const getRequestUsageCount = async () => {
  const token = await getCursorAuthRefreshToken()
  if (!token) {
    return 0
  }

  const response = await fetch('https://api2.cursor.sh/auth/usage', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token.value}`,
    },
  })
  const data: usageResponse = await response.json()
  const totalRequests = Object.values(data).reduce((acc, model) => {
    if (typeof model === 'object' && model !== null && 'numRequests' in model) {
      return acc + (model as usageType).numRequests
    }
    return acc
  }, 0)
  return totalRequests
}
