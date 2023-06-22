const spawn = require('child_process').spawn;
const fs = require('fs');
const spawnedAwaiter = require('./spawned-awaiter');

/**
 * @param {string} parentDirectory
 * @param {string} subdirectoryName
 * @param {string} zipFile
 *
 * @returns {Number}
 */
async function createZip(parentDirectory, subdirectoryName, zipFile) {
    const command = 'zip';
    const args = [
        '-r',
        zipFile,
        subdirectoryName,
    ];
    await spawnedAwaiter.awaitSpawned(spawn(command, args, {stdio: 'inherit', cwd: parentDirectory}));
    const stat = await fs.promises.stat(zipFile);
    console.log(`ZIP archive created: '${zipFile}' (${stat.size} bytes)`);

    return stat.size;
}

exports.createZip = createZip;
