import fs from 'fs';
import path from 'path';
import { getCurrentBranch, getSha } from '../utils/git';

export async function start() {
  const branch = getCurrentBranch();
  const startSha = getSha();
  const startTime = new Date().toISOString();

  const installDir = path.dirname(path.dirname(path.dirname(__filename)));
  const currentDirName = path.basename(process.cwd());
  const configDir = path.join(installDir, currentDirName);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // save before values
  fs.writeFileSync(
    path.join(configDir, '.cursor-efficiency.json'),
    JSON.stringify({
       branch,
       startSha,
       startTime
    }, null, 2)
  );
  console.log(`Started on ${branch} @ ${startSha} (${startTime})`);
}