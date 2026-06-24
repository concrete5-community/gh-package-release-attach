import {getInput} from '@actions/core';
import {env} from 'node:process';

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
 * @param {boolean} [defaultValue=false]
 * @returns {boolean}
 */
function stringToBool(str, defaultValue) {
  switch (typeof str) {
    case 'boolean':
      return str;
    case 'number':
      return str !== 0;
    case 'string':
      switch (str.toLowerCase()) {
        case 'true':
        case 'yes':
        case 'on':
          return true;
        case 'false':
        case 'no':
        case 'off':
          return false;
      }
      return parseInt(str) ? true : false;
    default:
      return defaultValue;
  }
}

/**
 * @returns {string}
 */
function resolveToken() {
  let token = getInput('token')?.trim();
  if (token) {
    return token;
  }
  token = env.GITHUB_TOKEN?.trim();
  if (token) {
    return token;
  }
  throw new Error('GitHub token not provided. Please set the "token" input or the GITHUB_TOKEN environment variable.');
}

/**
 * @typedef {Object} Result
 * @property {string} token
 * @property {string[]} removeFiles
 * @property {string[]} keepFiles
 * @property {boolean} publishRelease
 * @property {boolean} verbose
 */

/**
 * @returns {Result}
 */
export default function resolveArguments() {
  return {
    token: resolveToken(),
    removeFiles: stringToArray(getInput('remove-files')),
    keepFiles: stringToArray(getInput('keep-files')),
    publishRelease: stringToBool(getInput('publish-release'), false),
    verbose: stringToBool(getInput('verbose'), true),
  };
}
