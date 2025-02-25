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

// Create temp directory for code execution
const TEMP_DIR = path.join(__dirname, 'temp');
fs.mkdir(TEMP_DIR, { recursive: true }).catch(console.error);

// Add cache for compiled C++ programs
const cppCache = new Map();
const CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

// Cleanup function for temp files
async function cleanup(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Function to get cached binary path
function getCachedBinary(code) {
  const hash = crypto.createHash('md5').update(code).digest('hex');
  return { hash, path: path.join(TEMP_DIR, `cached_${hash}.exe`) };
}

async function runCode(language, code, input = '', problemTitle = '') {
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const tempDir = path.join(TEMP_DIR, uniqueId);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    switch (language) {
      case 'java': {
        // Extract the class name from the code first
        const classMatch = code.match(/(?:public\s+)?class\s+(\w+)/);
        let className;
        
        if (classMatch) {
          // Use the class name from the code
          className = classMatch[1];
          
          // Only validate the class name if this is a saved file (not "New File")
          if (problemTitle && problemTitle !== 'New File' && className !== problemTitle) {
            return {
              stderr: `Error: Class name '${className}' must match the file name '${problemTitle}' exactly (case-sensitive).`,
              stdout: ''
            };
          }
        } else {
          // If no class is found, use HelloWorld for new files or problemTitle for saved files
          className = (!problemTitle || problemTitle === 'New File') ? 'HelloWorld' : problemTitle;
          // Wrap the code in a class
          code = `public class ${className} {
            public static void main(String[] args) {
                ${code}
            }
          }`;
        }

        const filePath = path.join(tempDir, `${className}.java`);
        console.log('Generated Java file path:', filePath);
        console.log('Generated Java code:', code);
        
        // Write the code to file
        await fs.writeFile(filePath, code);
        
        // First compile the Java code with better error handling
        const compileProcess = spawn('javac', ['-encoding', 'UTF-8', filePath]);
        
        const compileResult = await new Promise((resolve) => {
          let stderr = '';
          let stdout = '';
          
          compileProcess.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log('Compilation stdout:', data.toString());
          });
          
          compileProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log('Compilation stderr:', data.toString());
          });
          
          compileProcess.on('error', (error) => {
            console.error('Compilation error:', error);
            resolve({ 
              success: false, 
              error: `Failed to start compiler: ${error.message}` 
            });
          });
          
          compileProcess.on('close', (code) => {
            console.log('Compilation process closed with code:', code);
            if (code !== 0) {
              resolve({ 
                success: false, 
                error: stderr || 'Compilation failed with no error message' 
              });
            } else {
              resolve({ success: true, output: stdout });
            }
          });
        });

        if (!compileResult.success) {
          console.error('Compilation failed:', compileResult.error);
          return { stderr: compileResult.error };
        }
        
        console.log('Compilation successful, executing code...');
        
        // Then execute the compiled code
        const execution = spawn('java', [
          '-Dfile.encoding=UTF-8',
          '-cp', tempDir, 
          className
        ]);

        // Handle input before creating the output promise
        if (input) {
          console.log('Writing input to Java process:', input);
          execution.stdin.write(input + '\n');
          execution.stdin.end();
        }

        const output = await new Promise((resolve) => {
          let stdout = '';
          let stderr = '';
          let timedOut = false;
          
          execution.stdout.on('data', (data) => {
            const chunk = data.toString();
            stdout += chunk;
            console.log('Execution stdout:', chunk);
          });
          
          execution.stderr.on('data', (data) => {
            const chunk = data.toString();
            stderr += chunk;
            console.log('Execution stderr:', chunk);
          });
          
          execution.on('error', (error) => {
            console.error('Execution error:', error);
            resolve({ 
              stdout,
              stderr: `Execution error: ${error.message}`
            });
          });
          
          const timeoutId = setTimeout(() => {
            timedOut = true;
            try {
              process.kill(-execution.pid, 'SIGKILL'); // Kill the entire process group
            } catch (err) {
              console.error('Error killing process:', err);
            }
            resolve({ 
              stdout: stdout || '',
              stderr: 'Compilation Error:\nExecution timed out (15 seconds). Your program may have an infinite loop or is taking too long to process.'
            });
          }, 15000);
          
          execution.on('close', (code) => {
            console.log('Execution process closed with code:', code);
            clearTimeout(timeoutId);
            if (!timedOut) {
              resolve({ stdout, stderr });
            }
          });

          // Set process group to enable killing child processes
          if (execution.pid) {
            try {
              process.platform === 'win32' 
                ? require('child_process').exec(`taskkill /pid ${execution.pid} /T /F`)
                : process.setpgid(execution.pid, execution.pid);
            } catch (err) {
              console.error('Error setting process group:', err);
            }
          }
        });

        // Clean up
        try {
          execution.kill();
        } catch (error) {
          console.error('Error killing Java process:', error);
        }

        console.log('Final output:', output);

        // Return the output, ensuring we have string values
        return {
          stdout: String(output.stdout || '').trim(),
          stderr: String(output.stderr || '').trim()
        };
      }
      case 'python': {
        const filePath = path.join(tempDir, 'script.py');
        await fs.writeFile(filePath, code);
        const execution = spawn('python', [filePath]);
        if (input) {
          execution.stdin.write(input);
          execution.stdin.end();
        }
        
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
        } catch (error) {
          return { stdout: '', stderr: 'Failed to create C++ source file: ' + error.message };
        }

        // Compile
        const compileOutput = await new Promise((resolve) => {
          const compile = spawn('g++', [
            filePath,
            '-o', exePath,
            '-std=c++17'
          ]);
          
          let stdout = '', stderr = '';
          compile.stdout.on('data', (data) => stdout += data);
          compile.stderr.on('data', (data) => stderr += data);
          compile.on('close', (code) => {
            if (code !== 0) {
              resolve({ success: false, error: stderr });
            } else {
              resolve({ success: true });
            }
          });
        });

        if (!compileOutput.success) {
          return { stdout: '', stderr: compileOutput.error };
        }

        // Execute
        const output = await new Promise((resolve) => {
          const execution = spawn(exePath);
          let stdout = '', stderr = '';
          
          if (input) {
            execution.stdin.write(input + '\n');
            execution.stdin.end();
          }

          execution.stdout.on('data', (data) => {
            stdout += data.toString();
          });
          
          execution.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          const timeoutId = setTimeout(() => {
            execution.kill();
            resolve({ 
              stdout: '',
              stderr: 'Execution timed out (15 seconds)'
            });
          }, 15000);

          execution.on('close', (code) => {
            clearTimeout(timeoutId);
            resolve({ stdout, stderr });
          });
        });

        return {
          stdout: output.stdout.trim(),
          stderr: output.stderr.trim()
        };
      }
      case 'javascript': {
        const filePath = path.join(tempDir, 'script.js');
        await fs.writeFile(filePath, code);
        const execution = spawn('node', [filePath]);
        if (input) {
          execution.stdin.write(input);
          execution.stdin.end();
        }
        
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
    // Clean up temporary directory but keep cached files
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

// API endpoint to run code
app.post('/api/run-code', async (req, res) => {
  try {
    const { code, language, input, problemTitle } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'No code provided' });
    }

    if (!language) {
      return res.status(400).json({ error: 'No language specified' });
    }

    const result = await runCode(language.toLowerCase(), code, input, problemTitle);
    res.json(result);
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: error.message || 'Failed to execute code' });
  }
});

// API endpoint to check Java installation
app.get('/api/check-java', async (req, res) => {
  try {
    const javaCheck = await new Promise((resolve) => {
      const check = spawn('java', ['-version']);
      let version = '';
      check.stderr.on('data', (data) => version += data.toString());
      check.on('error', () => resolve({ installed: false }));
      check.on('close', (code) => {
        if (code === 0) {
          const match = version.match(/version "([^"]+)"/);
          resolve({
            installed: true,
            version: match ? match[1] : 'unknown',
            message: 'Java is installed and ready to use.'
          });
        } else {
          resolve({
            installed: false,
            message: 'Java is not installed.',
            downloadInfo: {
              message: 'Please install Java Development Kit (JDK)',
              platform: process.platform,
              arch: process.arch,
              downloadUrl: 'https://adoptium.net/temurin/releases/'
            }
          });
        }
      });
    });

    res.json(javaCheck);
  } catch (error) {
    console.error('Error checking Java:', error);
    res.status(500).json({
      installed: false,
      error: error.message,
      message: 'Failed to check Java installation'
    });
  }
});

// API endpoint to submit code
app.post('/api/submit-code', async (req, res) => {
  try {
    const { code, language, timestamp } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Here you would typically:
    // 1. Save the submission to a database
    // 2. Run tests against the submission
    // 3. Return results

    // For now, we'll just return a success message
    res.json({
      success: true,
      result: 'Code submitted successfully',
      timestamp
    });
  } catch (error) {
    console.error('Error submitting code:', error);
    res.status(500).json({ error: error.message || 'Failed to submit code' });
  }
});

// Add cache cleanup interval
setInterval(async () => {
  const now = Date.now();
  for (const [hash, entry] of cppCache.entries()) {
    if (now - entry.timestamp >= CACHE_TIMEOUT) {
      cppCache.delete(hash);
      try {
        await fs.unlink(entry.path);
      } catch {}
    }
  }
}, CACHE_TIMEOUT);

const startServer = async (initialPort) => {
  const server = app.listen(initialPort)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${initialPort} is busy, trying ${initialPort + 1}...`);
        server.close();
        startServer(initialPort + 1);
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      const addr = server.address();
      console.log(`Server is running on port ${addr.port}`);
    });
};

startServer(PORT);
