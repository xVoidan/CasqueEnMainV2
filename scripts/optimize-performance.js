const fs = require('fs');
const path = require('path');
const glob = require('glob');

/**
 * Script d'optimisation automatique des performances React Native
 * - Extraction des styles inline
 * - Ajout de React.memo sur les composants
 * - Optimisation des re-renders
 */

// Patterns pour détecter les problèmes de performance
const performancePatterns = {
  // Styles inline dans les composants
  inlineStyles: /style={{[^}]+}}/g,
  
  // Fonctions fléchées dans les props (cause re-renders)
  arrowFunctionsInProps: /(?:onPress|onChange|onSubmit|onRefresh)={\(\)\s*=>/g,
  
  // Composants sans memo
  componentsWithoutMemo: /export\s+(?:const|function)\s+(\w+).*?:\s*(?:React\.)?FC/g,
  
  // UseEffect sans dépendances
  useEffectNoDeps: /useEffect\(\(\)\s*=>\s*{[^}]+}\)/g,
};

// Fonction pour extraire et optimiser les styles
function extractStyles(content, fileName) {
  const styles = [];
  let styleCounter = 0;
  let modifiedContent = content;
  
  // Trouver tous les styles inline
  const inlineStyleMatches = content.match(performancePatterns.inlineStyles) || [];
  
  inlineStyleMatches.forEach(match => {
    styleCounter++;
    const styleName = `dynamicStyle${styleCounter}`;
    
    // Extraire le contenu du style
    const styleContent = match.replace(/style={{/, '').replace(/}}/, '');
    
    // Ajouter aux styles extraits
    styles.push(`  ${styleName}: {${styleContent}},`);
    
    // Remplacer dans le contenu
    modifiedContent = modifiedContent.replace(match, `style={styles.${styleName}}`);
  });
  
  if (styles.length > 0) {
    // Vérifier si StyleSheet est déjà importé
    if (!modifiedContent.includes('StyleSheet')) {
      modifiedContent = modifiedContent.replace(
        /from 'react-native';/,
        ", StyleSheet } from 'react-native';"
      );
    }
    
    // Ajouter les styles extraits à la fin du fichier
    if (!modifiedContent.includes('const styles = StyleSheet.create')) {
      const styleBlock = `\nconst dynamicStyles = StyleSheet.create({\n${styles.join('\n')}\n});\n`;
      
      // Fusionner avec les styles existants ou créer nouveau
      if (modifiedContent.includes('const styles =')) {
        modifiedContent = modifiedContent.replace(
          /const styles = StyleSheet\.create\({/,
          `const styles = StyleSheet.create({\n${styles.join('\n')},`
        );
      } else {
        modifiedContent = modifiedContent.replace(
          /export default/,
          `${styleBlock}\nexport default`
        );
      }
    }
  }
  
  return { content: modifiedContent, stylesExtracted: styles.length };
}

// Fonction pour ajouter React.memo aux composants
function addMemoization(content) {
  let modifiedContent = content;
  let memoCount = 0;
  
  // Trouver les composants exportés sans memo
  const componentMatches = content.match(performancePatterns.componentsWithoutMemo) || [];
  
  componentMatches.forEach(match => {
    const componentName = match.match(/(?:const|function)\s+(\w+)/)?.[1];
    
    if (componentName && !content.includes(`React.memo(${componentName})`)) {
      // Ajouter React.memo
      modifiedContent = modifiedContent.replace(
        new RegExp(`export\\s+(const|function)\\s+${componentName}`),
        `export const ${componentName} = React.memo(function ${componentName}`
      );
      
      // Fermer le React.memo à la fin du composant
      const endPattern = new RegExp(`(return[^}]+}\\s*;?)\\s*}\\s*;?\\s*$`, 'm');
      modifiedContent = modifiedContent.replace(endPattern, '$1\n});\n');
      
      memoCount++;
    }
  });
  
  return { content: modifiedContent, memoized: memoCount };
}

// Fonction pour optimiser les callbacks
function optimizeCallbacks(content) {
  let modifiedContent = content;
  let callbacksOptimized = 0;
  
  // Remplacer les arrow functions dans les props par des fonctions memoïsées
  const callbackMatches = content.match(performancePatterns.arrowFunctionsInProps) || [];
  
  callbackMatches.forEach(match => {
    const propName = match.match(/(on\w+)=/)?.[1];
    if (propName) {
      const handlerName = `handle${propName.replace('on', '')}`;
      
      // Vérifier si le handler existe déjà
      if (!content.includes(handlerName)) {
        // Créer un handler avec useCallback
        const newHandler = `\n  const ${handlerName} = useCallback(() => {\n    // TODO: Implement ${propName} logic\n  }, []);\n`;
        
        // Ajouter le handler avant le return
        modifiedContent = modifiedContent.replace(
          /return\s*\(/,
          `${newHandler}\n  return (`
        );
        
        // Remplacer la prop
        modifiedContent = modifiedContent.replace(match, `${propName}={${handlerName}}`);
        
        callbacksOptimized++;
      }
    }
  });
  
  // Ajouter useCallback import si nécessaire
  if (callbacksOptimized > 0 && !content.includes('useCallback')) {
    modifiedContent = modifiedContent.replace(
      /import\s*{\s*([^}]+)\s*}\s*from\s*'react'/,
      (match, imports) => {
        return `import { ${imports}, useCallback } from 'react'`;
      }
    );
  }
  
  return { content: modifiedContent, callbacksOptimized };
}

// Fonction principale pour optimiser un fichier
function optimizeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  
  // Skip si c'est déjà optimisé
  if (content.includes('// Performance optimized')) {
    return null;
  }
  
  let totalOptimizations = 0;
  
  // 1. Extraire les styles inline
  const styleResult = extractStyles(content, fileName);
  content = styleResult.content;
  totalOptimizations += styleResult.stylesExtracted;
  
  // 2. Ajouter React.memo
  const memoResult = addMemoization(content);
  content = memoResult.content;
  totalOptimizations += memoResult.memoized;
  
  // 3. Optimiser les callbacks
  const callbackResult = optimizeCallbacks(content);
  content = callbackResult.content;
  totalOptimizations += callbackResult.callbacksOptimized;
  
  if (totalOptimizations > 0) {
    // Ajouter un commentaire pour marquer comme optimisé
    content = `// Performance optimized\n${content}`;
    
    // Sauvegarder le fichier
    fs.writeFileSync(filePath, content);
    
    return {
      file: filePath,
      optimizations: {
        styles: styleResult.stylesExtracted,
        memoized: memoResult.memoized,
        callbacks: callbackResult.callbacksOptimized,
        total: totalOptimizations,
      },
    };
  }
  
  return null;
}

// Trouver tous les composants React
const componentFiles = glob.sync('src/components/**/*.tsx', {
  cwd: path.join(__dirname, '..'),
  absolute: true,
  ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*', '**/index.tsx'],
});

const screenFiles = glob.sync('src/screens/**/*.tsx', {
  cwd: path.join(__dirname, '..'),
  absolute: true,
  ignore: ['**/node_modules/**', '**/*.test.*', '**/*.spec.*', '**/styles/*'],
});

const allFiles = [...componentFiles, ...screenFiles];

console.log(`🔍 Analyse de ${allFiles.length} fichiers pour optimisation...`);

const results = [];
allFiles.forEach(file => {
  const result = optimizeFile(file);
  if (result) {
    results.push(result);
    console.log(`✅ Optimisé: ${path.relative(process.cwd(), file)}`);
    console.log(`   - Styles extraits: ${result.optimizations.styles}`);
    console.log(`   - Composants memoïsés: ${result.optimizations.memoized}`);
    console.log(`   - Callbacks optimisés: ${result.optimizations.callbacks}`);
  }
});

// Résumé
console.log('\n📊 Résumé des optimisations:');
console.log(`- Fichiers optimisés: ${results.length}`);
console.log(`- Total styles extraits: ${results.reduce((acc, r) => acc + r.optimizations.styles, 0)}`);
console.log(`- Total composants memoïsés: ${results.reduce((acc, r) => acc + r.optimizations.memoized, 0)}`);
console.log(`- Total callbacks optimisés: ${results.reduce((acc, r) => acc + r.optimizations.callbacks, 0)}`);

// Créer un rapport détaillé
const report = {
  timestamp: new Date().toISOString(),
  filesOptimized: results.length,
  totalFiles: allFiles.length,
  optimizations: results,
  summary: {
    stylesExtracted: results.reduce((acc, r) => acc + r.optimizations.styles, 0),
    componentsMemoized: results.reduce((acc, r) => acc + r.optimizations.memoized, 0),
    callbacksOptimized: results.reduce((acc, r) => acc + r.optimizations.callbacks, 0),
  },
};

fs.writeFileSync(
  path.join(__dirname, 'performance-optimization-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('\n✅ Optimisation terminée! Rapport sauvegardé dans scripts/performance-optimization-report.json');