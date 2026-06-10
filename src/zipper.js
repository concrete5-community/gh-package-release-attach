import {spawn} from 'node:child_process';
import * as fs from 'node:fs/promises';
import awaitChildProcess from './childprocess-awaiter.js';

/**
 * @param {string} parentDirectory
 * @param {string} subdirectoryName
 * @param {string} zipFile
 * @returns {Promise<number>} The size of the created ZIP file, in bytes.
 */
export default async function createZip(parentDirectory, subdirectoryName, zipFile) {
  const command = 'zip';
  const args = ['-r', zipFile, subdirectoryName];
  await awaitChildProcess(spawn(command, args, {stdio: 'inherit', cwd: parentDirectory}));
  const stat = await fs.stat(zipFile);
  console.log(`ZIP archive created: '${zipFile}' (${stat.size} bytes)`);

  return stat.size;
}
