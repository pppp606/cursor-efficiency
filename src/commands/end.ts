import fs from 'fs';
import path from 'path';
import { getSha, countLines, getGitCommit, getDiff } from '../utils/git';
import { getChatLogs } from '../utils/chatLogs';

interface OutputData {
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
  git: {
    branch: string;
    linesChanged: number;
    commit: string[];
    diff?: string;
  };
  proposedCodeCount: number;
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
    startTime,
    endTime,
    usedTokens: chatLogs.tokens,
    usageRequestAmount: chatLogs.usageAmount,
    chatCount: chatLogs.chatCount,
    git:{
      branch,
      linesChanged: countLines(startSha, endSha),
      commit: getGitCommit(startSha, endSha),
    },
    proposedCodeCount: chatLogs.proposedCodeCount,
    adoptionRate: chatLogs.adoptionRate,
  };

  if (includeChatEntries) {
    output.chatEntries = chatLogs.entries
    output.git.diff = getDiff(startSha, endSha).patches
  }
  return output;
}