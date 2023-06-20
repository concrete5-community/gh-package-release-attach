const fs = require('fs');
const path = require('path');

function findControllerClass(parent) {
    let found = undefined;
    parent?.children?.some((child) => {
        if (child.kind === 'class' && child?.name?.kind === 'identifier' && child?.name?.name === 'Controller') {
            found = child;
        } else {
            found = findControllerClass(child);
        }
        return found !== undefined;
    });
    return found;
}

function findTextProperty(classBody, propertyName) {
    let result = undefined;
    classBody?.some((child) => {
        if (child.kind !== 'propertystatement') {
            return false;
        }
        return child?.properties?.some((property) => {
            if (property?.kind !== 'property' || property?.name?.kind !== 'identifier' || property?.name?.name !== propertyName) {
                return false;
            }
            const str = property?.value?.kind === 'string' ? property?.value?.value : null;
            if (typeof str !== 'string') {
                throw new Error(`Invalid type of the ${property} property`);
            }
            result = str;
            return true;
        });
    });

    return result;
}

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
