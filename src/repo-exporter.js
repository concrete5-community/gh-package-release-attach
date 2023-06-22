const exec = require('child_process').exec;
const spawnedAwaiter = require('./spawned-awaiter');

/**
 * @param {string} destinationDirectory
 */
async function exportRepository(destinationDirectory) {
    const spawned = exec(`git archive --format=tar HEAD | tar x -C '${destinationDirectory.replace(/(['$\\])/g, '\\$1')}'`);
    await spawnedAwaiter.awaitSpawned(spawned, true);
    console.log(`The repository has been exported to ${destinationDirectory}`);
}
exports.exportRepository = exportRepository;
