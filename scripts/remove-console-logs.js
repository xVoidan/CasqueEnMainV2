const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns à rechercher et remplacer
const patterns = [
  // console.log, console.error, console.warn, console.info
  {
    regex: /^\s*console\.(log|error|warn|info)\([^)]*\);?\s*$/gm,
    replacement: ''
  },
  // console multilignes
  {
    regex: /^\s*console\.(log|error|warn|info)\([^)]*\n[^)]*\);?\s*$/gm,
    replacement: ''
  },
  // console dans les catch (on garde en commentaire)
  {
    regex: /console\.error\('([^']+)',\s*error\);?/g,
    replacement: '// $1'
  },
  {
    regex: /console\.error\('([^']+)'\);?/g,
    replacement: '// $1'
  }
];

// Fonction pour nettoyer un fichier
function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  patterns.forEach(pattern => {
    const newContent = content.replace(pattern.regex, pattern.replacement);
    if (newContent !== content) {
      modified = true;
      content = newContent;
    }
  });
  
  if (modified) {
    // Nettoyer les lignes vides multiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    fs.writeFileSync(filePath, content);
    return true;
  }
  
  return false;
}

// Trouver tous les fichiers TypeScript
const srcFiles = glob.sync('src/**/*.{ts,tsx}', {
  cwd: path.join(__dirname, '..'),
  absolute: true,
  ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*']
});

let filesModified = 0;
srcFiles.forEach(file => {
  if (cleanFile(file)) {
    filesModified++;
    console.log(`✓ Cleaned: ${path.relative(process.cwd(), file)}`);
  }
});

console.log(`\n✅ Nettoyage terminé: ${filesModified} fichiers modifiés`);