const github = require('@actions/github');
const core = require('@actions/core');
const argumentsResolver = require('./arguments-resolver');
const environmentDumper = require('./environment-dumper');
const uploadUrlResolver = require('./upload-url-resolver');
const controllerInspector = require('./controller-inspector');
const composerInspector = require('./composer-inspector');
const composerBinResolver = require('./composerbin-resolver');
const repoExporter = require('./repo-exporter');
const composerInstaller = require('./composer-installer.js');
const filesManager = require('./files-manager');
const zipper = require('./zipper');
const path = require('path');
const fs = require('fs');
const os = require('os');

async function run() {
    try {
        if (!process.env.GITHUB_TOKEN) {
            throw new Error('GITHUB_TOKEN environment variable not set');
        }
        const args = argumentsResolver.resolveArguments();
        if (args.verbose) {
            await environmentDumper.dumpEnvironment();
        }
        const client = github.getOctokit(process.env.GITHUB_TOKEN);
        const uploadUrl = uploadUrlResolver.resolveUploadUrl(github);
        const packageInfo = await controllerInspector.parseFile('./controller.php');
        const composerInfo = await composerInspector.parseFile('./composer.json');
        const temporaryDirectory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'ccm-pkg'));
        try {
            let composerBin = null;
            if (composerInfo !== null) {
                composerBin = await composerBinResolver.resolveComposerBin(temporaryDirectory, composerInfo.requiresComposerPkg);
            }
            const temporaryPackageDirectory = path.join(temporaryDirectory, packageInfo.pkgHandle);
            await fs.promises.mkdir(temporaryPackageDirectory);
            await repoExporter.exportRepository(temporaryPackageDirectory);
            if (composerBin !== null) {
                await composerInstaller.installComposerDependencies(temporaryPackageDirectory, composerBin, args.verbose);
            }
            await filesManager.removeAdditionalFiles(temporaryPackageDirectory, args.removeFiles);
            await filesManager.copyAdditionalFiles(temporaryPackageDirectory, args.keepFiles);
            const zipFilename = `${packageInfo.pkgHandle}-v${packageInfo.pkgVersion}.zip`;
            const packageZipFile = path.join(temporaryDirectory, zipFilename);
            const zipFileSize = await zipper.createZip(temporaryDirectory, packageInfo.pkgHandle, packageZipFile);
            const zipFileBytes = await fs.promises.readFile(packageZipFile);
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
                await fs.promises.rm(temporaryDirectory, { recursive: true });
            } catch (_) {
            }
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();

