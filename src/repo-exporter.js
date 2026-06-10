import {exec} from 'node:child_process';
import awaitChildProcess from './childprocess-awaiter.js';

/**
 * @param {string} destinationDirectory
 * @returns {Promise<void>}
 */
export default async function exportRepository(destinationDirectory) {
  const spawned = exec(
    `git archive --format=tar HEAD | tar x -C '${destinationDirectory.replace(/(['$\\])/g, '\\$1')}'`,
  );
  await awaitChildProcess(spawned, true);
  console.log(`The repository has been exported to ${destinationDirectory}`);
}
