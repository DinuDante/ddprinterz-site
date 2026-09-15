const fs = require('fs');
const css = fs.readFileSync('style.css', 'utf8');

// The CSS file contains multiple themes marked by comments.
// We want to keep the base styles and the DINUDANTE.IN EDITORIAL THEME.

const lines = css.split('\n');

let cleanedLines = [];
let inOverride = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('/* ANIME // NEON OVERRIDE */')) {
    inOverride = true;
  }
  
  if (line.includes('/* DINUDANTE.IN EDITORIAL THEME */')) {
    inOverride = false;
  }
  
  if (!inOverride) {
    cleanedLines.push(line);
  }
}

fs.writeFileSync('style.css', cleanedLines.join('\n'));
fs.writeFileSync('src/style.css', cleanedLines.join('\n'));
console.log('Cleaned style.css');
