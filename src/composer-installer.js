const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');

async function shouldKeepComposer(parent) {
    const contents = await fs.promises.readdir(parent, { withFileTypes: true, recursive: true });
    const directories = contents.filter((ent) => ent.isDirectory());
    if (directories.length === 0) {
        throw new Error('At least the vendor/composer directory should have been found!');
    }
    if (!directories.some((dir) => dir.name === 'composer')) {
        throw new Error('The vendor/composer directory should have been found!');
    }

    return directories.length > 1;
}
/**
 * @param {string} directory
 * @param {string[]} composerBin
 */
async function installComposerDependencies(directory, composerBin) {
    const command = composerBin[0];
    const args = composerBin.slice(1).concat([
        'update',
        '--prefer-dist',
        '--no-dev',
        '--no-progress',
        '--optimize-autoloader',
        '--ignore-platform-reqs',
        '--ansi',
        '--no-interaction',
        '--no-cache',
    ]);
    var process = spawn(command, args, {
        stdio: 'inherit',
        cwd: directory,

    });
    await new Promise((resolve, reject) => {
        process.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject();
            }
        });
    });
    const vendorDir = path.join(directory, 'vendor');
    const keepComposer = await shouldKeepComposer(vendorDir);
    if (keepComposer) {
        console.log('The composer dependencies have been installed');
    } else {
        await fs.promises.rmdir(vendorDir, { recursive: true });
        console.log('No composer dependency required');
    }
}
exports.installComposerDependencies = installComposerDependencies;
