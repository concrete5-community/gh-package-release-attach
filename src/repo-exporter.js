const exec = require('child_process').exec;

/**
 * @param {string} destinationDirectory
 */
async function exportRepository(destinationDirectory) {
    var process = exec(`git archive --format=tar HEAD | tar x -C '${destinationDirectory.replace(/(['$\\])/g, '\\$1')}'`);
    let stdOut = '';
    let stdErr = '';
    process.stdout.on('data', function (data) {
        stdOut += data;
    });
    process.stderr.on('data', function (data) {
        stdErr += data;
    });
    await new Promise((resolve, reject) => {
        process.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(stdErr || stdOut || 'No output');
            }
        });
    });
    console.log(`The repository has been exported to ${destinationDirectory}`);
}
exports.exportRepository = exportRepository;
