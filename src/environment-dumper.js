const spawn = require('child_process').spawn;

async function run(command, args) {
    const spawned = spawn(command, args, { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
        spawned.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject();
            }
        });
    });
}

async function dumpEnvironment() {
    console.log('PHP Version:\n');
    await run('php', ['-v']);
    console.log('Composer Version:\n');
    await run('composer', ['--version']);
}

exports.dumpEnvironment = dumpEnvironment;
