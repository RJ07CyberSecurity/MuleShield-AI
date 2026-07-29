const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('e:/MuleShieldAI/apps/web/src');
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Replace "$X" inside double quotes with `${CURRENCY_SYMBOL}X` (using backticks)
  content = content.replace(/"([^"]*?)\$([0-9.,]+(?:M|K|k)?)([^"]*?)"/g, '`$1${CURRENCY_SYMBOL}$2$3`');

  // 2. Replace '$X' inside single quotes with `${CURRENCY_SYMBOL}X` (using backticks)
  content = content.replace(/'([^']*?)\$([0-9.,]+(?:M|K|k)?)([^']*?)'/g, '`$1${CURRENCY_SYMBOL}$2$3`');

  // 3. Replace $X in JSX text (not in quotes/backticks) with {CURRENCY_SYMBOL}X
  content = content.replace(/\$([0-9][0-9.,]*(?:M|K|k)?)/g, '{CURRENCY_SYMBOL}$1');
  
  // 4. Fix {CURRENCY_SYMBOL} inside backticks to be ${CURRENCY_SYMBOL}
  content = content.replace(/`([^`]*)\{CURRENCY_SYMBOL\}([^`]*)`/g, (match, p1, p2) => {
      return match.replace(/\{CURRENCY_SYMBOL\}/g, '${CURRENCY_SYMBOL}');
  });

  // 5. Replace double $ in template literals like $${acct.balance}
  content = content.replace(/\$\$\{/g, '${CURRENCY_SYMBOL}${');

  if (content !== original) {
    if (!content.includes('CURRENCY_SYMBOL } from')) {
      content = 'import { CURRENCY_SYMBOL } from "@/utils/currency";\n' + content;
    }
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Updated ${changedFiles} files`);
