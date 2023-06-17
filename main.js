const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
    }
  })

  win.loadFile('index.html')
}

// First, get the current execution policy
let getPolicy = spawn('powershell.exe', ['Get-ExecutionPolicy']);

let originalPolicy;

getPolicy.stdout.on('data', (data) => {
    originalPolicy = data.toString().trim(); // save the original policy
});

getPolicy.on('close', (code) => {
    if (code !== 0) {
        console.error(`Get-ExecutionPolicy command exited with code ${code}`);
        return;
    }

    // Now, set the execution policy to RemoteSigned
    let setPolicy = spawn('powershell.exe', ['Set-ExecutionPolicy', 'RemoteSigned', '-Scope', 'CurrentUser', '-Force']);

    setPolicy.on('close', (code) => {
        if (code !== 0) {
            console.error(`Set-ExecutionPolicy command exited with code ${code}`);
            return;
        }

        // Now that the execution policy is set, run your script
        let ps = spawn('powershell.exe', ['C:\\test.ps1']);

        ps.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        ps.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        ps.on('close', (code) => {
            console.log(`child process exited with code ${code}`);

            // After your script has finished running, restore the original execution policy
            let restorePolicy = spawn('powershell.exe', ['Set-ExecutionPolicy', originalPolicy, '-Scope', 'CurrentUser', '-Force']);

            restorePolicy.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Set-ExecutionPolicy command exited with code ${code}`);
                }
            });
        });
    });
});

app.whenReady().then(createWindow)
