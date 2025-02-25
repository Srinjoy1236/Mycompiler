const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const TEMP_DIR = path.join(__dirname, 'temp');

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.access(TEMP_DIR);
  } catch {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  }
}

// Clean up old files
async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      const stats = await fs.stat(filePath);
      // Remove files older than 5 minutes
      if (now - stats.mtimeMs > 5 * 60 * 1000) {
        await fs.unlink(filePath);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupOldFiles, 5 * 60 * 1000);

async function runCode(language, code, input = '') {
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const tempDir = path.join(TEMP_DIR, uniqueId);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    switch (language) {
      case 'java': {
        const className = 'Solution_' + uniqueId;
        const modifiedCode = code.replace(/public\s+class\s+\w+/, `public class ${className}`);
        const filePath = path.join(tempDir, `${className}.java`);
        await fs.writeFile(filePath, modifiedCode);
        
        const compile = spawn('javac', [filePath]);
        const execution = spawn('java', ['-cp', tempDir, className]);
        if (input) execution.stdin.write(input);
        execution.stdin.end();
        
        const output = await new Promise((resolve) => {
          let stdout = '', stderr = '';
          execution.stdout.on('data', (data) => stdout += data);
          execution.stderr.on('data', (data) => stderr += data);
          execution.on('close', () => resolve({ stdout, stderr }));
        });
        return output;
      }
      case 'python': {
        const filePath = path.join(tempDir, 'script.py');
        await fs.writeFile(filePath, code);
        const execution = spawn('python', [filePath]);
    if (input) execution.stdin.write(input);
    execution.stdin.end();
    
    const output = await new Promise((resolve) => {
      let stdout = '', stderr = '';
      execution.stdout.on('data', (data) => stdout += data);
      execution.stderr.on('data', (data) => stderr += data);
      execution.on('close', () => resolve({ stdout, stderr }));
    });
    return output;
      }
      case 'cpp': {
        const filePath = path.join(tempDir, 'program.cpp');
        const exePath = path.join(tempDir, 'program.exe');
        try {
            await fs.writeFile(filePath, code);
            await fs.access(filePath);
        } catch (error) {
            return { stdout: '', stderr: 'Failed to create or access C++ source file: ' + error.message };
        }
        // Check if g++ compiler is available
        const gppCheck = await new Promise((resolve) => {
          const check = spawn('g++', ['--version']);
          check.on('error', () => resolve(false));
          check.on('close', (code) => resolve(code === 0));
        });

        if (!gppCheck) {
          return { stdout: '', stderr: 'g++ compiler not found' };
        }
        const compileOutput = await new Promise((resolve) => {
          const compile = spawn('g++', [filePath, '-o', exePath]);
          let stdout = '', stderr = '';
          compile.stdout.on('data', (data) => stdout += data);
          compile.stderr.on('data', (data) => stderr += data);
          compile.on('error', (error) => resolve({ stdout: '', stderr: error.message }));
          compile.on('close', (code) => {
            if (code !== 0) {
              resolve({ stdout: '', stderr: `Compilation failed: ${stderr}` });
            }
            resolve({ stdout, stderr });
          });
        });

        if (compileOutput.stderr) {
          return { stdout: '', stderr: compileOutput.stderr };
        }
        
        const output = await new Promise((resolve) => {
          const execution = spawn(exePath);
          let stdout = '', stderr = '';
          if (input) execution.stdin.write(input);
          execution.stdin.end();
          
          execution.stdout.on('data', (data) => stdout += data);
          execution.stderr.on('data', (data) => stderr += data);
          execution.on('close', () => resolve({ stdout, stderr }));
        });
        return output;
      }
      case 'javascript': {
        const filePath = path.join(tempDir, 'script.js');
        await fs.writeFile(filePath, code);
        const execution = spawn('node', [filePath]);
        if (input) execution.stdin.write(input);
        execution.stdin.end();
        
        const output = await new Promise((resolve) => {
          let stdout = '', stderr = '';
          execution.stdout.on('data', (data) => stdout += data);
          execution.stderr.on('data', (data) => stderr += data);
          execution.on('close', () => resolve({ stdout, stderr }));
        });
        return output;
      }
      default:
        throw new Error('Unsupported language');
    }
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
