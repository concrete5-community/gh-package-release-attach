const fs = require('fs');

/**
 * @typedef {Object} Result
 * @property {bool} requiresComposerPkg
 */

/**
 * @param {string} path
 *
 * @returns {Result|null} returns NULL if there's no composer.json file
 */
async function parseFile(path) {
    let json;
    try {
        json = await fs.promises.readFile(path, { encoding: 'utf8' });
    } catch (error) {
        if (error?.code === 'ENOENT') {
            console.log('composer.json file not found');
            return null;
        }
        throw error;
    }
    const result = {
        requiresComposerPkg: false,
    };
    const data = JSON.parse(json);
    if (data.require) {
        result.requiresComposerPkg = Object.keys(data.require).some((required) => {
            return required === 'concrete5/core' || required === 'concretecms/core';
        });
    }
    if (result.requiresComposerPkg) {
        console.log('We need to use composerpkg to install the Composer dependencies.');
    } else {
        console.log('We can to use the plain composer command to install the Composer dependencies.');
    }

    return result;
}

exports.parseFile = parseFile;
