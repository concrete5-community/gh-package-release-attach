import {join as joinPath} from 'node:path';
import * as fs from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {context, getOctokit} from '@actions/github';
import {setFailed} from '@actions/core';
import resolveActionEnvironment from './action-environment-resolver.js';
import resolveArguments from './arguments-resolver.js';
import dumpEnvironment from './environment-dumper.js';
import parseControllerFile from './controller-inspector.js';
import parseComposerFile from './composer-inspector.js';
import resolveComposerBin from './composerbin-resolver.js';
import exportRepository from './repo-exporter.js';
import installComposerDependencies from './composer-installer.js';
import * as filesManager from './files-manager.js';
import createZip from './zipper.js';

async function run() {
  try {
    const actionEnvironment = resolveActionEnvironment();
    if (actionEnvironment === null) {
      return;
    }
    const args = resolveArguments();
    if (args.verbose) {
      await dumpEnvironment();
    }
    const client = getOctokit(args.token);
    const packageInfo = await parseControllerFile('./controller.php');
    if (actionEnvironment.kind === 'createDraftRelease' && actionEnvironment.version !== packageInfo.pkgVersion) {
      throw new Error(
        `The pushed tag (${actionEnvironment.tagName}) does not match the package version (${packageInfo.pkgVersion})`,
      );
    }
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
      let releaseId;
      switch (actionEnvironment.kind) {
        case 'attachZipToRelease':
          releaseId = actionEnvironment.releaseId;
          break;
        case 'createDraftRelease':
          console.log(
            `Creating draft release for tag '${actionEnvironment.tagName}' on repository '${context.repo.owner}/${context.repo.repo}'...`,
          );
          const releaseResponse = await client.rest.repos.createRelease({
            owner: context.repo.owner,
            repo: context.repo.repo,
            tag_name: actionEnvironment.tagName,
            name: `v${actionEnvironment.version}`,
            generate_release_notes: true,
            draft: true,
          });
          releaseId = releaseResponse.data.id;
          console.log(`Draft release created (ID: ${releaseId})`);
          break;
        default:
          throw new Error(`Unsupported environment kind '${actionEnvironment.kind}'`);
      }
      console.log(
        `Attaching ZIP file '${zipFilename}' (${zipFileSize} bytes) to release (ID: ${releaseId}) on repository '${context.repo.owner}/${context.repo.repo}'...`,
      );
      await client.rest.repos.uploadReleaseAsset({
        owner: context.repo.owner,
        repo: context.repo.repo,
        release_id: releaseId,
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
