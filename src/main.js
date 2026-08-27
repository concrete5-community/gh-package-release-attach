import {join as joinPath} from 'node:path';
import * as fs from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {context, getOctokit} from '@actions/github';
import {setFailed, summary, warning} from '@actions/core';
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

/**
 * Delete a draft release that we created but that we couldn't publish, ignoring any error.
 *
 * @param {ReturnType<typeof getOctokit>} client
 * @param {number} releaseId
 * @returns {Promise<void>}
 */
async function deleteRelease(client, releaseId) {
  console.log(`Deleting the draft release (ID: ${releaseId})...`);
  try {
    await client.rest.repos.deleteRelease({
      owner: context.repo.owner,
      repo: context.repo.repo,
      release_id: releaseId,
    });
    console.log('Draft release deleted');
  } catch (error) {
    warning(`Failed to delete the draft release (ID: ${releaseId}): ${error?.message || error}`);
  }
}

async function run() {
  try {
    const actionEnvironment = resolveActionEnvironment();
    if (actionEnvironment === null) {
      return;
    }
    const args = resolveArguments();
    if (args.verbose) {
      console.log(`Resolved environment:\n${JSON.stringify(actionEnvironment, null, 2)}`);
      await dumpEnvironment();
    }
    const client = getOctokit(args.token);
    const packageInfo = await parseControllerFile('./controller.php');
    if (actionEnvironment.kind === 'createRelease' && actionEnvironment.version !== packageInfo.pkgVersion) {
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
      let publishRelease = false;
      let newlyCreatedReleaseUrl;
      let draftReleaseToDeleteOnFailure = null;
      switch (actionEnvironment.kind) {
        case 'attachZipToRelease':
          releaseId = actionEnvironment.releaseId;
          break;
        case 'createRelease': {
          const createReleaseRequestBody = {
            owner: context.repo.owner,
            repo: context.repo.repo,
            tag_name: actionEnvironment.tagName,
            name: `v${actionEnvironment.version}`,
            generate_release_notes: true,
            draft: true,
            prerelease: actionEnvironment.prerelease,
            make_latest: actionEnvironment.prerelease ? 'false' : 'true',
          };
          if (args.verbose) {
            console.log(
              `Creating draft release for tag '${actionEnvironment.tagName}' on repository '${context.repo.owner}/${context.repo.repo}' with:\n${JSON.stringify(createReleaseRequestBody, null, 2)}`,
            );
          }
          const releaseResponse = await client.rest.repos.createRelease(createReleaseRequestBody);
          draftReleaseToDeleteOnFailure = releaseId = releaseResponse.data.id;
          newlyCreatedReleaseUrl = releaseResponse.data.html_url;
          console.log(`Draft release created (ID: ${releaseId})`);
          if (args.publishRelease) {
            publishRelease = true;
          }
          break;
        }
        default:
          throw new Error(`Unsupported environment kind '${actionEnvironment.kind}'`);
      }
      try {
        if (args.verbose) {
          console.log(
            `Attaching ZIP file '${zipFilename}' (${zipFileSize} bytes) to release (ID: ${releaseId}) on repository '${context.repo.owner}/${context.repo.repo}'...`,
          );
        }
        await client.rest.repos.uploadReleaseAsset({
          owner: context.repo.owner,
          repo: context.repo.repo,
          release_id: releaseId,
          headers: {
            'content-type': 'application/zip',
          },
          name: zipFilename,
          data: zipFileBytes,
        });
        console.log('ZIP file attached to release');
        if (publishRelease) {
          const updateReleaseRequestBody = {
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: releaseId,
            draft: false,
            prerelease: actionEnvironment.prerelease,
            make_latest: actionEnvironment.prerelease ? 'false' : 'true',
          };
          if (args.verbose) {
            console.log(
              `Publishing release (ID: ${releaseId}) with:\n${JSON.stringify(updateReleaseRequestBody, null, 2)}`,
            );
          }
          const updatedRelease = await client.rest.repos.updateRelease(updateReleaseRequestBody);
          newlyCreatedReleaseUrl = updatedRelease.data.html_url;
          console.log('Release published');
        }
        draftReleaseToDeleteOnFailure = null;
      } catch (error) {
        if (draftReleaseToDeleteOnFailure !== null) {
          await deleteRelease(client, draftReleaseToDeleteOnFailure);
        }
        throw error;
      }
      if (newlyCreatedReleaseUrl) {
        await summary
          .addHeading('Release created and ZIP file attached', 2)
          .addLink('View release on GitHub', newlyCreatedReleaseUrl)
          .write();
      }
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
