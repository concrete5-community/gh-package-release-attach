import {spawn} from 'node:child_process';
import awaitChildProcess from './childprocess-awaiter.js';

/**
 * @param {string} command
 * @param {string[]} args
 * @return {Promise<void>}
 */
async function run(command, args) {
  await awaitChildProcess(spawn(command, args, {stdio: 'inherit'}));
}

/**
 * @return {Promise<void>}
 */
export default async function dumpEnvironment() {
  console.log('PHP Version:\n');
  await run('php', ['-v']);
  console.log('Composer Version:\n');
  await run('composer', ['--version']);
}
