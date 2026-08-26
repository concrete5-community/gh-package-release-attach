/**
 * @param {import('node:child_process').ChildProcess} childProcess
 * @param {boolean} isExec
 * @param {number|null} code
 * @param {NodeJS.Signals|null} signal
 * @returns {string}
 */
function describeFailure(childProcess, isExec, code, signal) {
  // With exec() the spawned file is the shell itself: the actual command line is its last argument
  const command =
    (isExec ? childProcess.spawnargs?.[childProcess.spawnargs.length - 1] : childProcess.spawnfile) ||
    'The child process';
  if (signal) {
    return `${command} has been killed by the signal ${signal}`;
  }
  return `${command} failed with exit code ${code}`;
}

/**
 * @param {import('node:child_process').ChildProcess | import('node:child_process').ChildProcessWithoutNullStreams} childProcess
 * @param {boolean} isExec
 * @return {Promise<void>}
 */
export default async function (childProcess, isExec = false) {
  let stdOut = '';
  let stdErr = '';
  if (isExec) {
    childProcess.stdout.on('data', function (data) {
      stdOut += data;
    });
    childProcess.stderr.on('data', function (data) {
      stdErr += data;
    });
  }
  await new Promise((resolve, reject) => {
    let completed = false;
    childProcess.on('exit', (code, signal) => {
      if (completed) {
        return;
      }
      completed = true;
      if (code === 0) {
        resolve();
        return;
      }
      const description = describeFailure(childProcess, isExec, code, signal);
      const output = isExec ? (stdErr || stdOut).replace(/\s+$/, '') : '';
      reject(new Error(output ? `${description}:\n${output}` : description));
    });
    childProcess.on('error', (err) => {
      if (completed) {
        return;
      }
      completed = true;
      const output = isExec ? (stdErr || stdOut).replace(/\s+$/, '') : '';
      reject(output ? new Error(`${err.message}:\n${output}`) : err);
    });
  });
}
