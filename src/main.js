import {join as joinPath} from 'node:path';
import * as fs from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {getOctokit} from '@actions/github';
import {setFailed} from '@actions/core';
import resolveArguments from './arguments-resolver.js';
import dumpEnvironment from './environment-dumper.js';
import resolveUploadUrl from './upload-url-resolver.js';
import parseControllerFile from './controller-inspector.js';
import parseComposerFile from './composer-inspector.js';
import resolveComposerBin from './composerbin-resolver.js';
import exportRepository from './repo-exporter.js';
import installComposerDependencies from './composer-installer.js';
import * as filesManager from './files-manager.js';
import createZip from './zipper.js';

async function run() {
  try {
    if (!process.env.GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN environment variable not set');
    }
    const args = resolveArguments();
    if (args.verbose) {
      await dumpEnvironment();
    }
    const client = getOctokit(process.env.GITHUB_TOKEN);
    const uploadUrl = resolveUploadUrl();
    const packageInfo = await parseControllerFile('./controller.php');
    const composerInfo = await parseComposerFile('./composer.json');
    const temporaryDirectory = await fs.mkdtemp(joinPath(tmpdir(), 'ccm-pkg'));
    try {
      let composerBin = null;
      if (composerInfo !== null) {
        composerBin = await resolveComposerBin(temporaryDirectory, composerInfo.requiresComposerPkg);
      }
      const temporaryPackageDirectory = joinPath(temporaryDirectory, packageInfo.pkgHandle);
      await fs.mkdir(temporaryPackageDirectory);
      await exportRepository(temporaryPackageDirectory);
      if (composerBin !== null) {
        await installComposerDependencies(temporaryPackageDirectory, composerBin, args.verbose);
      }
      await filesManager.removeAdditionalFiles(temporaryPackageDirectory, args.removeFiles);
      await filesManager.copyAdditionalFiles(temporaryPackageDirectory, args.keepFiles);
      const zipFilename = `${packageInfo.pkgHandle}-v${packageInfo.pkgVersion}.zip`;
      const packageZipFile = joinPath(temporaryDirectory, zipFilename);
      const zipFileSize = await createZip(temporaryDirectory, packageInfo.pkgHandle, packageZipFile);
      const zipFileBytes = await fs.readFile(packageZipFile);
      await client.rest.repos.uploadReleaseAsset({
        url: uploadUrl,
        headers: {
          'content-type': 'application/zip',
          'content-length': zipFileSize,
        },
        name: zipFilename,
        data: zipFileBytes,
      });
      console.log('ZIP file attached to release');
    } finally {
      try {
        await fs.rm(temporaryDirectory, {recursive: true});
      } catch {}
    }
  } catch (error) {
    setFailed(error.message);
  }
}

run();
