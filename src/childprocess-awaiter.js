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
    childProcess.on('exit', (code) => {
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
    childProcess.on('error', (err) => {
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
}
