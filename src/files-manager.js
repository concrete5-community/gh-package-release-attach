const path = require('path');
const fs = require('fs');

async function isFile(fullPath) {
    return await new Promise((resolve, reject) => {
        fs.stat(fullPath, (err, stats) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    resolve(false);
                } else {
                    reject(err);
                }
            } else if (stats.isDirectory()) {
                reject(new Error(`'${item}' is a directory, not a file`));
            } else {
                resolve(true);
            }
        });
    });
}

/**
 * @param {string} workingDirectory 
 * @param {string[]} list 
 */
async function copyAdditionalFiles(workingDirectory, list) {
    for (const item of list) {
        const fullPath = path.join(workingDirectory, item);
        if (await isFile(fullPath)) {
            return;
        }
        await fs.promises.copyFile(item, fullPath);
        console.log(`Copied additional file: '${item}'`);
    }
}

/**
 * @param {string} workingDirectory 
 * @param {string[]} list 
 */
async function removeAdditionalFiles(workingDirectory, list) {
    for (const item of list) {
        const fullPath = path.join(workingDirectory, item);
        if (!await isFile(fullPath)) {
            return;
        }
        await fs.promises.rm(fullPath);
        console.log(`Removed additional file: '${item}'`);
    }
}

exports.copyAdditionalFiles = copyAdditionalFiles;
exports.removeAdditionalFiles = removeAdditionalFiles;
