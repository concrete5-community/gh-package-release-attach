const fs = require('fs');

const CORE_PACKAGE_HANDLES = [
    'concrete5/core',
    'concretecms/core',
];
/**
 * @typedef {Object} Result
 * @property {bool} requiresComposerPkg
 */

/**
 * @param {Object} data
 *
 * @returns {bool}
 */
function shouldRunComposer(data) {
    if (Object.keys(data.require || {}).some((dependency) => {
        if (CORE_PACKAGE_HANDLES.includes(dependency)) {
            return false;
        }
        if (dependency === 'php' || dependency.startsWith('ext-')) {
            return false;
        }
        console.log('We need to run composer because there are dependencies in composer.json');
        return true;
    })) {
        return true;
    }
    if (Object.keys(data.autoload || {}).some((autoloadKey) => {
        if (autoloadKey === 'exclude-from-classmap') {
            return false;
        }
        const autoload = data.autoload[autoloadKey] || {};
        if (autoload instanceof Array ? autoload.length > 0 : Object.keys(autoload).length > 0) {
            console.log(`We need to run composer because the ${autoloadKey} autoload is configured in composer.json`);
            return true;
        }
        return false;
    })) {
        return true;
    }
    if (data['include-path'] && data['include-path'].length > 0) {
        console.log('We need to run composer because include-path is configured in composer.json');
        return true;
    }
    if (data.bin && data.bin.length > 0) {
        console.log('We need to run composer because bin is configured in composer.json');
        return true;
    }
    console.log('We don\'t need to run composer');

    return false;
}

/**
 * @param {Object} data
 *
 * @returns {bool}
 */
function composerHasCoreDependency(data) {
    if (!data.require) {
        return false;
    }
    return Object.keys(data.require).some((dependency) => {
        return CORE_PACKAGE_HANDLES.includes(dependency);
    });
}

/**
 * @param {string} path
 *
 * @returns {Result|null} returns NULL if there's no composer.json file, or if running composer is not needed
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
    const data = JSON.parse(json);
    if (!shouldRunComposer(data)) {
        return null;
    }
    const result = {};
    if (composerHasCoreDependency(data)) {
        result.requiresComposerPkg = true;
        console.log('We need to use composerpkg to install the Composer dependencies.');
    } else {
        result.requiresComposerPkg = true;
        console.log('We can to use the plain composer command to install the Composer dependencies.');
    }

    return result;
}

exports.parseFile = parseFile;
