const core = require('@actions/core');

function stringToArray(str) {
    const result = [];
    if (typeof str !== 'string' || str === '') {
        return result;
    }
    str.replace(/\r\n/g, '\n').replace(/\r/g, '\r').split(/\n/).forEach((line) => {
        line = line.replace(/^\s+|\s+$/g, '');
        if (line !== '') {
            result.push(line);
        }
    });
    return result;
}

/**
 * @typedef {Object} Result
 * @property {string[]} removeFiles
 * @property {string[]} keepFiles
 */

/**
 * @returns {Result}
 */
function resolveArguments() {
    return {
        removeFiles: stringToArray(core.getInput('remove-files')),
        keepFiles: stringToArray(core.getInput('keep-files')),
    };
}

exports.resolveArguments = resolveArguments;
