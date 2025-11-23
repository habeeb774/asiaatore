const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'client', 'src', 'pages', 'admin', 'AdminDashboard.jsx');
const s = fs.readFileSync(file, 'utf8');
let count = 0;
const stack = [];
for (let i = 0; i < s.length; i++) {
  const ch = s[i];
  if (ch === '{') { count++; stack.push(i); }
  else if (ch === '}') { if (stack.length) stack.pop(); count = Math.max(0, count-1); }
}
console.log('Total unmatched opens:', stack.length);
if (stack.length) {
  stack.forEach((idx, j) => {
    // compute line number
    const before = s.slice(0, idx);
    const line = before.split('\n').length;
    const start = Math.max(0, idx - 80);
    const end = Math.min(s.length, idx + 80);
    const snippet = s.slice(start, end).replace(/\n/g, '\n');
    console.log(`Unmatched #${j+1} at index ${idx}, approx line ${line}:`);
    console.log('--- snippet ---');
    console.log(snippet);
    console.log('----------------');
  });
} else {
  console.log('No unmatched braces found.');
}
