const spawnedAwaiter = require('./spawned-awaiter');
const spawn = require('child_process').spawn;

async function run(command, args) {
    await spawnedAwaiter.awaitSpawned(spawn(command, args, { stdio: 'inherit' }));
}

async function dumpEnvironment() {
    console.log('PHP Version:\n');
    await run('php', ['-v']);
    console.log('Composer Version:\n');
    await run('composer', ['--version']);
}

exports.dumpEnvironment = dumpEnvironment;
