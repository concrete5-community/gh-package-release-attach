const fs = require('fs');
const engine = require('php-parser');

const parser = new engine({
    parser: {
        extractDoc: false,
    }
});

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
 * @property {string} pkgHandle
 * @property {string} pkgVersion
 */

/**
 * @param {string} path
 *
 * @returns {Result}
 */
async function parseFile(path) {
    let phpCode;
    try {
        phpCode = await fs.promises.readFile(path, { encoding: 'utf8' });
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

exports.parseFile = parseFile;
