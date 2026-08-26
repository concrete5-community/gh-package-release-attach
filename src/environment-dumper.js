import {spawn} from 'node:child_process';
import {warning} from '@actions/core';
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
  try {
    await run('php', ['-v']);
  } catch (error) {
    warning(`Failed to get PHP version: ${error?.message || error}`);
  }
  console.log('Composer Version:\n');
  try {
    await run('composer', ['--version']);
  } catch (error) {
    warning(`Failed to get Composer version: ${error?.message || error}`);
  }
}
