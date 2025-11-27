const fs = require('fs');
const path = require('path');

function walk(dir){
  const res = [];
  for (const name of fs.readdirSync(dir)){
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) res.push(...walk(p));
    else if (/\.jsx?$/.test(name)) res.push(p);
  }
  return res;
}

const root = path.join(__dirname, '..', 'client', 'src');
const files = walk(root);
let problems = 0;
for (const file of files){
  const content = fs.readFileSync(file,'utf8');
  if (content.includes('createContext(') || content.includes('React.createContext')){
    const header = content.split('\n').slice(0,8).join('\n');
    const importsReact = /import\s+React/.test(header);
    const importsCreate = /createContext/.test(header);
    if (!importsReact && !importsCreate){
      console.log(`File uses createContext but does not import React or createContext: ${file}`);
      problems++;
    }
  }
}
if (problems===0) console.log('All files using createContext import React or createContext in header.');
process.exit(problems>0?1:0);
