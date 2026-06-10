import {join as joinPath} from 'node:path';
import {createWriteStream} from 'node:fs';
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
  const file = createWriteStream(composerpkg);
  try {
    await Readable.fromWeb(response.body).pipe(file);
  } finally {
    file.close();
  }
  const deltaTime = Date.now() - startTime;
  console.log(`composerpkg downloaded in ${Math.ceil(deltaTime * 100) / 100} ms`);

  return ['php', composerpkg];
}
