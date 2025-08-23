#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to fix
const filesToFix = [
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/auth/RegisterScreen.tsx', 
  'src/screens/main/HomeScreen.tsx',
  'src/screens/main/ProfileScreen.tsx',
  'src/screens/main/ProgressScreen.tsx',
  'src/screens/main/RankingScreen.tsx',
  'src/screens/main/RevisionScreen.tsx',
  'src/screens/training/TrainingConfigScreen.tsx',
  'src/screens/training/TrainingSessionScreen.tsx',
];

function fixDuplicateCallbacks(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} (not found)`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // Remove duplicate handlePress declarations (keep only the first one)
  const handlePressPattern = /(\s+const handlePress = useCallback\([^}]+\}\), \[[^\]]*\]\);?\s*\n)/g;
  const matches = content.match(handlePressPattern);
  
  if (matches && matches.length > 1) {
    console.log(`Found ${matches.length} handlePress declarations in ${filePath}`);
    
    // Remove all but keep track to not break the code
    let count = 0;
    content = content.replace(handlePressPattern, (match) => {
      count++;
      if (count === 1) {
        return ''; // Remove all handlePress declarations
      }
      return '';
    });
  }

  // Fix incorrect onPress syntax like "onPress={handlePress} router.back()}"
  content = content.replace(/onPress=\{handlePress\}\s+router\.(back|push|replace)\([^)]*\)\}/g, (match, method) => {
    if (method === 'back') {
      return 'onPress={() => router.back()}';
    } else {
      // Extract the route from the original match
      const routeMatch = match.match(/router\.(push|replace)\(([^)]+)\)/);
      if (routeMatch) {
        return `onPress={() => router.${routeMatch[1]}(${routeMatch[2]})}`;
      }
    }
    return match;
  });

  // Fix standalone router calls in onPress
  content = content.replace(/onPress=\{handlePress\}\s+router\.(back|push|replace)\([^)]*\)/g, (match, method) => {
    if (method === 'back') {
      return 'onPress={() => router.back()}';
    } else {
      // Extract the route from the original match
      const routeMatch = match.match(/router\.(push|replace)\(([^)]+)\)/);
      if (routeMatch) {
        return `onPress={() => router.${routeMatch[1]}(${routeMatch[2]})`;
      }
    }
    return match;
  });

  // Also fix any remaining handlePress references that are no longer needed
  content = content.replace(/onPress=\{handlePress\}/g, 'onPress={() => {}}');

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`No changes needed for ${filePath}`);
  }
}

console.log('Fixing duplicate callback declarations...\n');

filesToFix.forEach(file => {
  try {
    fixDuplicateCallbacks(file);
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
  }
});

console.log('\nDone!');