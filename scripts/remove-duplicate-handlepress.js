#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to clean
const filesToClean = [
  'src/screens/auth/RegisterScreen.tsx',
  'src/screens/training/TrainingSessionScreen.tsx',
  'src/screens/main/ProgressScreen.tsx',
  'src/screens/main/RevisionScreen.tsx',
  'src/components/common/Input.tsx',
  'src/components/auth/UsernameInput.tsx',
  'src/components/error/ErrorBoundary.tsx',
];

function removeDuplicateHandlePress(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Pattern to match duplicate handlePress declarations
  // This matches the pattern with TODO comment and surrounding whitespace
  const pattern = /\n\s*\n\s*const handlePress = useCallback\(\(\) => \{\s*\n\s*\/\/ TODO: Implement onPress logic\s*\n\s*\}, \[\]\);/g;
  
  // Count how many matches we have
  const matches = content.match(pattern);
  
  if (matches && matches.length > 0) {
    console.log(`Found ${matches.length} duplicate handlePress in ${filePath}`);
    
    // Remove all matches (they're all duplicates and unused)
    content = content.replace(pattern, '');
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ Removed ${matches.length} duplicate declarations`);
    return true;
  }
  
  console.log(`No duplicates found in ${filePath}`);
  return false;
}

console.log('Removing duplicate handlePress declarations...\n');

let totalFixed = 0;
filesToClean.forEach(file => {
  try {
    if (removeDuplicateHandlePress(file)) {
      totalFixed++;
    }
  } catch (error) {
    console.error(`Error cleaning ${file}:`, error.message);
  }
});

console.log(`\n✨ Fixed ${totalFixed} files total`);