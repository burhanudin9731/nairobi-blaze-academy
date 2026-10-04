const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const output = path.join(root, 'dist');

fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(path.join(root, 'index.html'), path.join(output, 'index.html'));
fs.cpSync(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
fs.writeFileSync(
  path.join(output, 'netlify-registration.json'),
  JSON.stringify({ provider: 'netlify-forms' })
);