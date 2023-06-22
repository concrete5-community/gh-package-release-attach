const exec = require('child_process').exec;

/**
 * @param {string} destinationDirectory
 */
async function exportRepository(destinationDirectory) {
    var spawned = exec(`git archive --format=tar HEAD | tar x -C '${destinationDirectory.replace(/(['$\\])/g, '\\$1')}'`);
    let stdOut = '';
    let stdErr = '';
    spawned.stdout.on('data', function (data) {
        stdOut += data;
    });
    spawned.stderr.on('data', function (data) {
        stdErr += data;
    });
    await new Promise((resolve, reject) => {
        spawned.on('exit', (code) => {
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
