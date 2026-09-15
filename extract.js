const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
  const fullCss = cssMatch[1];
  const editorialIndex = fullCss.indexOf('/* DINUDANTE.IN EDITORIAL THEME */');
  if (editorialIndex !== -1) {
    const baseCssMatch = fullCss.match(/(.*?)\n\/\*/);
    let baseCss = '';
    // We only want the basic reset, not the older themes.
    // Actually, looking at the file, line 10 has `*{box-sizing:border-box}html{scroll-behavior:smooth...`
    // Let's just grab the whole CSS, it's safer. But wait, the user asked to clean it up:
    // "6. CREATE ONE MAINTAINABLE DESIGN SYSTEM... Audit existing CSS before replacing it... Normalize tokens... Use a predictable scale."
    // Let's write the entire CSS to src/style.css first so we can analyze and clean it up.
    fs.writeFileSync('src/style.css', fullCss);
    console.log('CSS extracted to src/style.css');
  }
}
