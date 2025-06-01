import fs from 'fs'
import path from 'path'
import os from 'os'

// Detect OS-specific Cursor storage base path
const getCursorStorageBasePath = () => {
  const home = os.homedir()
  switch (process.platform) {
    case 'darwin': // macOS
      return path.join(home, 'Library', 'Application Support', 'Cursor', 'User')
    case 'win32': // Windows
      return path.join(process.env.APPDATA || '', 'Cursor', 'User')
    case 'linux': // Linux
    default:
      return path.join(home, '.config', 'Cursor', 'User')
  }
}

export const getCursorWorkspaceStorageDir = () => {
  const basePath = getCursorStorageBasePath()
  return path.join(basePath, 'workspaceStorage')
}

export const getCursorGlobalStorageDir = () => {
  const basePath = getCursorStorageBasePath()
  return path.join(basePath, 'globalStorage')
}

export const getTargetWorkspaceId = (workspaceDir: string) => {
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

