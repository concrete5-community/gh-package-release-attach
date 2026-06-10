import * as fs from 'node:fs/promises';
import {Engine} from 'php-parser';

const parser = new Engine({
  parser: {
    extractDoc: false,
  },
});

/**
 * @param {import('php-parser').Node} node
 * @returns {node is import('php-parser').Class}
 */
function isClassNode(node) {
  return node.kind === 'class';
}

/**
 * @param {import('php-parser').Node} node
 * @returns {node is import('php-parser').PropertyStatement}
 */
function isPropertyStatementNode(node) {
  return node.kind === 'propertystatement';
}

/**
 * @param {import('php-parser').Node} node
 * @returns {node is import('php-parser').Property}
 */
function isPropertyNode(node) {
  return node.kind === 'property';
}

/**
 *
 * @param {import('php-parser').Identifier|string} node
 * @param {string} expectedName
 * @returns {boolean}
 */
function isNodeWithIdentifierName(nodeName, wantedName) {
  return nodeName === wantedName || (nodeName?.kind === 'identifier' && nodeName?.name === wantedName);
}

/**
 * @param {import('php-parser').Program} parent
 * @returns {import('php-parser').Class|undefined}
 */
function findControllerClass(parent) {
  let found = undefined;
  parent?.children?.some((child) => {
    if (isClassNode(child) && isNodeWithIdentifierName(child.name, 'Controller')) {
      found = child;
    } else {
      found = findControllerClass(child);
    }
    return found !== undefined;
  });
  return found;
}

/**
 * @param {import('php-parser').Declaration[]} classBody
 * @param {string} propertyName
 * @returns {string|undefined}
 */
function findTextProperty(classBody, propertyName) {
  let result = undefined;
  classBody?.some((child) => {
    if (!isPropertyStatementNode(child)) {
      return false;
    }
    return child?.properties?.some((property) => {
      if (!isPropertyNode(property) || !isNodeWithIdentifierName(property.name, propertyName)) {
        return false;
      }
      const str = property?.value?.kind === 'string' ? property?.value?.value : null;
      if (typeof str !== 'string') {
        throw new Error(`Invalid type of the ${propertyName} property`);
      }
      result = str;
      return true;
    });
  });

  return result;
}

/**
 * @typedef {Object} Result
 * @property {string} pkgHandle
 * @property {string} pkgVersion
 */

/**
 * @param {string} path
 * @returns {Promise<Result>}
 */
export default async function parseFile(path) {
  let phpCode;
  try {
    phpCode = await fs.readFile(path, {encoding: 'utf8'});
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`Unable to find the file '${path}'`);
    }
    throw error;
  }
  const ast = parser.parseCode(phpCode);
  const controllerClass = findControllerClass(ast);
  if (!controllerClass) {
    throw new Error('Unable to find the Controller class');
  }
  const pkgHandle = findTextProperty(controllerClass.body, 'pkgHandle');
  if (pkgHandle === undefined) {
    throw new Error('Unable to find the Controller::$pkgHandle property');
  }
  if (!/^[A-Za-z0-9_]+/.test(pkgHandle)) {
    throw new Error(`The value of the Controller::$pkgHandle property ('${pkgHandle}') is not a valid Concrete handle`);
  }
  const pkgVersion = findTextProperty(controllerClass.body, 'pkgVersion');
  if (pkgVersion === undefined) {
    throw new Error('Unable to find the Controller::$pkgVersion property');
  }
  if (!/^[0-9]+[0-9a-zA-Z\-_.]*/.test(pkgVersion)) {
    throw new Error(`The value of the Controller::$pkgVersion property ('${pkgVersion}') is not valid`);
  }
  console.log(`Found package '${pkgHandle}' at version '${pkgVersion}'`);

  return {
    pkgHandle,
    pkgVersion,
  };
}
