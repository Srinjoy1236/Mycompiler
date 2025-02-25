require('dotenv').config();
console.log("🚀 Judge0 API Key:", process.env.RAPID_API_KEY);
console.log("🌍 Judge0 API URL:", process.env.JUDGE0_API_URL);

const express = require('express');
const cors = require('cors');
const { VM } = require('vm2');
const { execSync } = require('child_process');
const fs = require('fs');

const app = express();
const port = 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Execute JavaScript code
const runJavaScript = (code) => {
  try {
    let output = '';
    const vm = new VM({
      timeout: 3000,
      sandbox: {
        console: {
          log: (...args) => {
            output += args.join(' ') + '\n';
          }
        }
      }
    });
    vm.run(code);
    return { output: output.trim() || 'Code executed successfully (no output)' };
  } catch (error) {
    return { error: error.message };
  }
};

// Execute Python code
const runPython = (code) => {
  const { spawnSync } = require('child_process');
  try {
    const process = spawnSync('python', ['-c', code]);
    if (process.error) {
      return { error: process.error.message };
    }
    if (process.stderr.length > 0) {
      return { error: process.stderr.toString() };
    }
    return { output: process.stdout.toString() || 'Code executed successfully (no output)' };
  } catch (error) {
    return { error: error.message };
  }
};

// Execute C++ code
// Replace the existing runCpp function with this new implementation
const runCpp = (code, input = '') => {
  const { spawn } = require('child_process');
  const path = require('path');

  try {
    // Save code to a temporary file
    fs.writeFileSync('temp.cpp', code);
    
    // Compile
    execSync('g++ temp.cpp -o temp');

    // Create a promise to handle the asynchronous process
    return new Promise((resolve) => {
      const process = spawn('./temp', [], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      // Write input to stdin
      if (input) {
        process.stdin.write(input);
        process.stdin.end();
      }

      // Collect output
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        // Cleanup
        try {
          fs.unlinkSync('temp.cpp');
          fs.unlinkSync('temp');
        } catch (e) {
          console.error('Cleanup failed:', e);
        }

        if (code !== 0) {
          resolve({ error: errorOutput || 'Execution failed' });
        } else {
          resolve({ output: output.trim() });
        }
      });

      // Handle timeout
      setTimeout(() => {
        process.kill();
        resolve({ error: 'Time Limit Exceeded' });
      }, 5000);
    });
  } catch (error) {
    return { error: error.message || 'Compilation Error' };
  }
};


// Execute Java code
const runJava = (code) => {
  const { spawnSync } = require('child_process');
  const fs = require('fs');
  const path = require('path');

  const tempFile = path.join(__dirname, 'Main.java');

  try {
    // Ensure code has Main class
    const javaCode = code.includes('public class') 
      ? code.replace(/public\s+class\s+\w+/g, 'public class Main')
      : `public class Main { public static void main(String[] args) { ${code} } }`;

    // Write code to file
    fs.writeFileSync(tempFile, javaCode);

    // Compile
    const compile = spawnSync('javac', [tempFile]);
    if (compile.error) {
      return { error: compile.error.message };
    }
    if (compile.stderr.length > 0) {
      return { error: compile.stderr.toString() };
    }

    // Run
    const run = spawnSync('java', ['Main']);
    if (run.error) {
      return { error: run.error.message };
    }
    if (run.stderr.length > 0) {
      return { error: run.stderr.toString() };
    }

    return { output: run.stdout.toString() || 'Code executed successfully (no output)' };
  } catch (error) {
    return { error: error.message };
  } finally {
    // Cleanup
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    if (fs.existsSync('Main.class')) fs.unlinkSync('Main.class');
  }
};

// Run code endpoint
app.post('/api/run-code', async (req, res) => {
  const { code, language, input } = req.body;
  console.log('Received code execution request:', { language, hasInput: !!input });

  try {
    let result;
    switch (language) {
      case 'javascript':
        result = runJavaScript(code);
        break;
      case 'python':
        result = runPython(code);
        break;
      case 'cpp':
        result = await runCpp(code, input);
        break;
      case 'java':
        result = runJava(code);
        break;
      default:
        result = { error: 'Unsupported language' };
    }
    res.json(result);
  } catch (error) {
    res.json({ error: 'Execution failed' });
  }
});
// Submit endpoint
app.post('/api/submit-code', (req, res) => {
  const { code, language } = req.body;
  console.log('Received code submission:', { language });

  let result;
  switch (language) {
    case 'javascript':
      result = runJavaScript(code);
      break;
    case 'python':
      result = runPython(code);
      break;
    case 'cpp':
      result = runCpp(code);
      break;
    case 'java':
      result = runJava(code);
      break;
    default:
      result = { error: 'Unsupported language' };
  }

  res.json({
    ...result,
    status: 'submitted',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

app.get('/', (req, res) => {
  res.send('Server is running! Use /api/run-code to execute code.');
});

