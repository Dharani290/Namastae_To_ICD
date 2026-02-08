const { spawn } = require('child_process');
const path = require('path');

function runMatcher(callback) {
  const scriptPath = path.join(__dirname, '../scripts/match_icd_to_namaste.py');
  const process = spawn('python', [scriptPath]);

  let output = '';
  process.stdout.on('data', (data) => {
    output += data.toString();
  });

  process.stderr.on('data', (data) => {
    console.error(`❌ Python error: ${data}`);
  });

  process.on('close', (code) => {
    if (code === 0) {
      callback(null, output);
    } else {
      callback(new Error('Python script failed'));
    }
  });
}

module.exports = { runMatcher };
