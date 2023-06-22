const spawn = require('child_process').spawn;
const fs = require('fs');

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
    var spawned = spawn(command, args, {
        stdio: 'inherit',
        cwd: parentDirectory,
    });
    await new Promise((resolve, reject) => {
        spawned.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject();
            }
        });
    });
    const stat = await fs.promises.stat(zipFile);
    console.log(`ZIP archive created: '${zipFile}' (${stat.size} bytes)`);

    return stat.size;
}

exports.createZip = createZip;
