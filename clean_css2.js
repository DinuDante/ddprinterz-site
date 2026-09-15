const fs = require('fs');
const css = fs.readFileSync('style.css', 'utf8');

const lines = css.split('\n');

let cleanedLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('/* ANIME // NEON OVERRIDE */') ||
      line.includes('/* 静けさ / SHIZUKESA — peaceful anime refinement */') ||
      line.includes('/* YUGEN — unified quiet Japanese palette */') ||
      line.includes('/* KOKORO — green + purple master refresh */')) {
    skip = true;
  }
  
  if (line.includes('/* Authentic project service cards */') ||
      line.includes('/* Brand mon, authentic contact image, supplied WhatsApp mark */') ||
      line.includes('/* DINUDANTE.IN EDITORIAL THEME */')) {
    skip = false;
  }
  
  if (!skip) {
    cleanedLines.push(line);
  }
}

const newCss = cleanedLines.join('\n');
fs.writeFileSync('style.css', newCss);
fs.writeFileSync('src/style.css', newCss);
console.log('Successfully cleaned CSS! Length is now:', newCss.split('\n').length);
