const { exec } = require('child_process');

const port = process.argv[2] || 5000;

const isWindows = process.platform === 'win32';

const command = isWindows
  ? `netstat -ano | findstr :${port}`
  : `lsof -i :${port}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error finding process: ${error}`);
    return;
  }

  if (!stdout) {
    console.log(`No process found using port ${port}`);
    return;
  }

  if (isWindows) {
    // Parse Windows output
    const lines = stdout.split('\n');
    const processInfo = lines[0].trim().split(/\s+/);
    const pid = processInfo[processInfo.length - 1];
    
    if (pid) {
      exec(`taskkill /F /PID ${pid}`, (err) => {
        if (err) {
          console.error(`Failed to kill process: ${err}`);
        } else {
          console.log(`Successfully killed process using port ${port}`);
        }
      });
    }
  } else {
    // Parse Unix/Linux/Mac output
    const lines = stdout.split('\n');
    const processInfo = lines[1]?.trim().split(/\s+/);
    const pid = processInfo?.[1];
    
    if (pid) {
      exec(`kill -9 ${pid}`, (err) => {
        if (err) {
          console.error(`Failed to kill process: ${err}`);
        } else {
          console.log(`Successfully killed process using port ${port}`);
        }
      });
    }
  }
}); 