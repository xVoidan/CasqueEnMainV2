#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Get all files recursively
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      arrayOfFiles.push(fullPath);
    }
  });
  
  return arrayOfFiles;
}

// Find all .tsx and .ts files in src directory
const srcPath = path.join(process.cwd(), 'src');
const files = getAllFiles(srcPath).map(f => path.relative(process.cwd(), f));

let totalFixed = 0;

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Find all handlePress declarations
  const handlePressPattern = /\s+const handlePress = useCallback\([^}]+\}\), \[[^\]]*\]\);?\s*\n/g;
  const matches = content.match(handlePressPattern);
  
  if (matches && matches.length > 1) {
    console.log(`Found ${matches.length} handlePress declarations in ${file}`);
    
    // Remove ALL handlePress declarations (they're duplicates and unused)
    content = content.replace(handlePressPattern, '\n');
    
    // Count lines removed
    const linesRemoved = matches.reduce((acc, match) => acc + (match.match(/\n/g) || []).length, 0);
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ Removed ${matches.length} duplicate handlePress declarations (${linesRemoved} lines)`);
    totalFixed++;
  }
});

console.log(`\n✨ Fixed ${totalFixed} files total`);