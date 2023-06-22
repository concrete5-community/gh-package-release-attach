exports.awaitSpawned = async function (spawned, isExec = false) {
    let stdOut = '';
    let stdErr = '';
    if (isExec) {
        spawned.stdout.on('data', function (data) {
            stdOut += data;
        });
        spawned.stderr.on('data', function (data) {
            stdErr += data;
        });
    }
    await new Promise((resolve, reject) => {
        let completed = false;
        spawned.on('exit', (code) => {
            if (completed) {
                return;
            }
            completed = true;
            if (code === 0) {
                resolve();
            } else if (isExec) {
                reject(stdErr || stdOut || 'No output');
            } else {
                reject();
            }
        });
        spawned.on('error', (err) => {
            if (completed) {
                return;
            }
            completed = true;
            if (isExec && (stdErr || stdOut)) {
                err = new Error(stdErr || stdOut);
            }
            reject(err);
        });
    });
};
