import {getInput} from '@actions/core';

/**
 * @param {any} str
 * @returns {string[]}
 */
function stringToArray(str) {
  const result = [];
  if (typeof str !== 'string' || str === '') {
    return result;
  }
  str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\r')
    .split(/\n/)
    .forEach((line) => {
      line = line.replace(/^\s+|\s+$/g, '');
      if (line !== '') {
        result.push(line);
      }
    });
  return result;
}

/**
 * @param {any} str
 * @returns {boolean}
 */
function stringToBool(str) {
  switch (typeof str) {
    case 'boolean':
      return str;
    case 'number':
      return str !== 0;
    case 'string':
      return parseInt(str) ? true : false;
    default:
      return false;
  }
}

/**
 * @typedef {Object} Result
 * @property {string[]} removeFiles
 * @property {string[]} keepFiles
 * @property {boolean} verbose
 */

/**
 * @returns {Result}
 */
export default function resolveArguments() {
  return {
    removeFiles: stringToArray(getInput('remove-files')),
    keepFiles: stringToArray(getInput('keep-files')),
    verbose: stringToBool(getInput('verbose')),
  };
}
