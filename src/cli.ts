import { program } from 'commander';
import * as startCmd from './commands/start';
import * as endCmd from './commands/end';

program
  .name('cursor-efficiency')
  .description('Report token usage, chat counts, code diff, and adoption rate')
  .version('0.1.0');

program.command('start')
  .description('Begin measurement')
  .action(startCmd.start);

program.command('end [branch]')
  .description('End measurement and output report')
  .option('-c, --include-chat-entries', 'Include chat entries in the output')
  .action((branch, options) => endCmd.end(branch, options.includeChatEntries));

program.parse(process.argv);