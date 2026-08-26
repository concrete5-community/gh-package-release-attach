import {join as joinPath} from 'node:path';
import * as fs from 'node:fs/promises';
import {Readable} from 'node:stream';

/**
 * @param {string} temporaryDirectory
 * @param {boolean} useComposerPkg
 * @returns {Promise<string[]>}
 */
export default async function resolveComposerBin(temporaryDirectory, useComposerPkg) {
  if (!useComposerPkg) {
    return ['composer'];
  }
  const startTime = Date.now();
  const response = await fetch('https://raw.githubusercontent.com/concrete5-community/cli/master/composerpkg');
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} ${response.statusText} while fetching composerpkg`);
  }
  if (!response.body) {
    throw new Error('No response body while fetching composerpkg');
  }
  const composerpkg = joinPath(temporaryDirectory, 'composerpkg');
  await fs.writeFile(composerpkg, Readable.fromWeb(response.body));
  const deltaTime = Date.now() - startTime;
  console.log(`composerpkg downloaded in ${deltaTime} ms`);

  return ['php', composerpkg];
}
