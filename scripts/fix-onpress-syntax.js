#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'src/screens/training/TrainingConfigScreen.tsx',
  'src/screens/training/TrainingSessionScreen.tsx',
  'src/screens/main/ProfileScreen.tsx',
  'src/screens/main/ProgressScreen.tsx',
  'src/screens/main/RankingScreen.tsx',
  'src/screens/main/RevisionScreen.tsx',
];

function fixOnPressSyntax(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Fix pattern: onPress={() => {}} functionCall(args)}
  // Replace with: onPress={() => functionCall(args)}
  content = content.replace(/onPress=\{(?:\(\) => )?\{\}\}\s+(\w+\([^)]*\))\}/g, 'onPress={() => $1}');
  
  // Fix pattern: onPress={() => {}} setFunction(value)}
  // Replace with: onPress={() => setFunction(value)}
  content = content.replace(/onPress=\{(?:\(\) => )?\{\}\}\s+(set\w+\([^)]*\))\}/g, 'onPress={() => $1}');
  
  // Fix pattern: onPress={() => {}} toggleFunction(args)}
  // Replace with: onPress={() => toggleFunction(args)}
  content = content.replace(/onPress=\{(?:\(\) => )?\{\}\}\s+(toggle\w+\([^)]*\))\}/g, 'onPress={() => $1}');
  
  // Fix pattern: onPress={() => {}} updateFunction(args)}
  // Replace with: onPress={() => updateFunction(args)}
  content = content.replace(/onPress=\{(?:\(\) => )?\{\}\}\s+(update\w+\([^)]*\))\}/g, 'onPress={() => $1}');
  
  // Fix pattern: onPress={() => {}} handleFunction(args)}
  // Replace with: onPress={() => handleFunction(args)}
  content = content.replace(/onPress=\{(?:\(\) => )?\{\}\}\s+(handle\w+\([^)]*\))\}/g, 'onPress={() => $1}');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
    
    // Count how many fixes were made
    const fixes = originalContent.match(/onPress=\{(?:\(\) => )?\{\}\}\s+\w+\([^)]*\)\}/g);
    if (fixes) {
      console.log(`   Fixed ${fixes.length} onPress syntax errors`);
    }
  } else {
    console.log(`No changes needed for ${filePath}`);
  }
}

console.log('Fixing onPress syntax errors...\n');

filesToFix.forEach(file => {
  try {
    fixOnPressSyntax(file);
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
});

console.log('\nDone!');