const path = require('path');
const fs = require('fs');
const https = require('https');

/**
 * @param {string} temporaryDirectory
 * @param {bool} useComposerPkg
 *
 * @returns {string[]}
 */
async function resolveComposerBin(temporaryDirectory, useComposerPkg)
{
    if (!useComposerPkg) {
        return ['composer'];
    }
    const composerpkg = path.join(temporaryDirectory, 'composerpkg');
    const file = fs.createWriteStream(composerpkg);
    try {
        const startTime = Date.now();
        const response = await new Promise(resolve => {
            https.get('https://raw.githubusercontent.com/concrete5-community/cli/master/composerpkg', resolve)
          });
        response.pipe(file);
        await new Promise((resolve, reject) => {
            response.on('error', error => reject(error));
            response.on('end', () => resolve());
        });
        const deltaTime = Date.now() - startTime;
        console.log(`composerpkg downloaded in ${Math.ceil(deltaTime * 100) / 100} ms`);
    } finally {
        file.close();
    }

    return ['php', composerpkg];
}

exports.resolveComposerBin = resolveComposerBin;
