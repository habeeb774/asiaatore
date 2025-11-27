const fs = require('fs');
const path = require('path');

function walk(dir){
  const res = [];
  for (const name of fs.readdirSync(dir)){
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) res.push(...walk(p));
    else if (/\.s[ac]ss$/.test(name)) res.push(p);
  }
  return res;
}

const stylesDir = path.join(__dirname, 'client', 'src', 'styles');
if (!fs.existsSync(stylesDir)) {
  console.error('styles dir not found:', stylesDir);
  process.exit(2);
}

const files = walk(stylesDir);
let bad = 0;
for (const file of files){
  const content = fs.readFileSync(file, 'utf8');
  let open = 0;
  const lines = content.split(/\r?\n/);
  lines.forEach((ln, idx) => {
    for (const ch of ln){
      if (ch === '{') open++;
      else if (ch === '}') open--;
    }
    if (open < 0){
      console.log(`UNEXPECTED '}' in ${file}:${idx+1}`);
      bad++;
      open = 0; // reset to continue
    }
  });
  if (open !== 0){
    console.log(`UNBALANCED braces in ${file}: remaining ${open}`);
    // print small context
    const ctx = lines.slice(Math.max(0, lines.length-8)).join('\n');
    console.log('--- tail 8 lines ---');
    console.log(ctx);
    bad++;
  }
}
if (bad === 0) console.log('No brace imbalances found.');
process.exit(bad>0?1:0);
