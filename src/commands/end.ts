import fs from 'fs';
import path from 'path';
import { getSha, countLines } from '../utils/git';
import { getChatLogs } from '../utils/chatLogs';

// TODO: implement adoption logic later
interface OutputData {
  branch: string;
  startTime: string;
  endTime: string;
  usedTokens: {
    input: number;
    output: number;
  };
  usageRequestAmount: number;
  chatCount: {
    input: number;
    output: number;
  };
  linesChanged: number;
  codeChangeCount: number;
  adoptionRate: number;
  chatEntries?: any[];
}

export async function end(includeChatEntries?: boolean): Promise<OutputData> {
  const installDir = path.dirname(path.dirname(path.dirname(__filename)));
  const currentDirName = path.basename(process.cwd());
  const cfgPath = path.join(installDir, currentDirName, '.cursor-efficiency.json');
  
  if (!fs.existsSync(cfgPath)) {
    console.error('No .cursor-efficiency.json found. Run `cursor-efficiency start` first.');
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  const { branch, startSha, startTime } = cfg;

  const endSha = getSha();
  const endTime = new Date().toISOString();

  // metrics
  const chatLogs = await getChatLogs({
    workspaceDir: process.cwd(),
    start: new Date(startTime),
    end: new Date(endTime)
  })

  // output
  const output: OutputData = {
    branch,
    startTime,
    endTime,
    usedTokens: chatLogs.tokens,
    usageRequestAmount: chatLogs.usageAmount,
    chatCount: chatLogs.chatCount,
    linesChanged: countLines(startSha, endSha),
    codeChangeCount: chatLogs.codeChangeCount,
    adoptionRate: chatLogs.adoptionRate,
  };

  if (includeChatEntries) {
    output.chatEntries = chatLogs.entries;
  }
  return output;
}