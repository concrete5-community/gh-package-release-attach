import {join as joinPath} from 'node:path';
import * as fs from 'node:fs/promises';

/**
 *
 * @param {string} fullPath
 * @returns {Promise<boolean>}
 */
async function isFile(fullPath) {
  let stats;
  try {
    stats = await fs.stat(fullPath);
  } catch (err) {
    if (err?.code === 'ENOENT') {
      return false;
    }
    throw err;
  }
  if (stats.isDirectory()) {
    throw new Error(`'${fullPath}' is a directory, not a file`);
  }
  return true;
}

/**
 * @param {string} workingDirectory
 * @param {string[]} list
 * @return {Promise<void>}
 */
export async function copyAdditionalFiles(workingDirectory, list) {
  for (const item of list) {
    const fullPath = joinPath(workingDirectory, item);
    if (await isFile(fullPath)) {
      return;
    }
    await fs.copyFile(item, fullPath);
    console.log(`Copied additional file: '${item}'`);
  }
}

/**
 * @param {string} workingDirectory
 * @param {string[]} list
 * @return {Promise<void>}
 */
export async function removeAdditionalFiles(workingDirectory, list) {
  for (const item of list) {
    const fullPath = joinPath(workingDirectory, item);
    if (!(await isFile(fullPath))) {
      return;
    }
    await fs.rm(fullPath);
    console.log(`Removed additional file: '${item}'`);
  }
}
