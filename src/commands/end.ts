import fs from 'fs';
import path from 'path';
import { getSha, countLines } from '../utils/git';
import { getChatLogs } from '../utils/chatLogs';

// TODO: implement adoption logic later
interface OutputData {
  branch: string;
  startTime: string;
  endTime: string;
  promptTokensUsed: number;
  requestUsageCount: number;
  chatCount: number;
  linesChanged: number;
  adoptionRate?: number;
  chatEntries?: any[];
}

export async function end(branchName?: string, includeChatEntries?: boolean): Promise<OutputData> {
  const installDir = path.dirname(path.dirname(path.dirname(__filename)));
  const currentDirName = path.basename(process.cwd());
  const cfgPath = path.join(installDir, currentDirName, '.cursor-efficiency.json');
  
  if (!fs.existsSync(cfgPath)) {
    console.error('No .cursor-efficiency.json found. Run `cursor-efficiency start` first.');
    process.exit(1);
  }
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf-8'));
  const { branch, startSha, startTime, requestUsageCount } = cfg;
  if (branchName && branchName !== branch) {
    console.warn(
      `Branch mismatch: started on ${branch}, now on ${branchName}`
    );
  }

  const endSha = getSha();
  const endTime = new Date().toISOString();

  // metrics
  const chatLogs = await getChatLogs(
    process.cwd(),
    new Date(startTime),
    new Date(endTime)
  );
  const linesChanged = countLines(startSha, endSha);

  // output
  const output: OutputData = {
    branch,
    startTime,
    endTime,
    promptTokensUsed: chatLogs.tokens,
    requestUsageCount,
    chatCount: chatLogs.total,
    linesChanged,
  };

  if (includeChatEntries) {
    output.chatEntries = chatLogs.entries;
  }

  console.log(JSON.stringify(output, null, 2));

  return output;
}