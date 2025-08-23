#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des erreurs de syntaxe...\n');

// Fichiers avec erreurs de syntaxe connues
const filesToFix = [
  {
    file: 'src/components/network/OfflineNotice.tsx',
    fix: (content) => {
      // Corriger le return mal fermé à la ligne 28
      content = content.replace(/return \(\) => unsubscribe\(\);\n\s*}\), \[\]\);/g, 
        '    return () => unsubscribe();\n  }, []);');
      
      // S'assurer que la fermeture du composant est correcte
      if (!content.includes('});') && content.includes('export const OfflineNotice')) {
        content = content.replace(/}\);\s*$/m, '});');
      }
      
      return content;
    }
  },
  {
    file: 'src/components/animations/ConfettiAnimation.tsx',
    fix: (content) => {
      // Corriger les interpolations mal fermées
      content = content.replace(/outputRange: \[[^\]]+\],\s*$/gm, (match) => {
        if (!match.includes('});')) {
          return match.replace(/,\s*$/, ',\n    });');
        }
        return match;
      });
      
      // Ajouter les fermetures manquantes
      content = content.replace(/outputRange: \['0deg', `\$\{randomRotation\}deg`\],\s*$/gm,
        "outputRange: ['0deg', `${randomRotation}deg`],\n        });");
        
      return content;
    }
  },
  {
    file: 'src/components/auth/UsernameInput.tsx',
    fix: (content) => {
      // Corriger la déclaration de fonction mal formée
      content = content.replace(/^\s*export function UsernameInput\(/gm,
        '});\\n\\nexport function UsernameInput(');
      
      // S'assurer que les styles sont bien fermés avant l'export
      const styleEndIndex = content.lastIndexOf('});');
      const exportIndex = content.indexOf('export function UsernameInput');
      
      if (exportIndex > 0 && styleEndIndex < exportIndex - 10) {
        content = content.replace(/,\s*\n\s*export function UsernameInput/,
          ',\n});\n\nexport function UsernameInput');
      }
      
      return content;
    }
  },
  {
    file: 'src/components/loading/SkeletonLoader.tsx',
    fix: (content) => {
      // Corriger les fermetures d'interpolation manquantes
      content = content.replace(/outputRange: \[[^\]]+\],\s*\n\s*const getVariantStyles/gm,
        'outputRange: [-200, 200],\n  });\n\n  const getVariantStyles');
        
      // Corriger le return dans switch
      content = content.replace(/borderRadius: borderRadius \|\| 4,\s*};\s*}\s*$/gm,
        'borderRadius: borderRadius || 4,\n        };\n    }\n  };');
        
      return content;
    }
  },
  {
    file: 'src/components/notifications/BadgeUnlockNotification.tsx',
    fix: (content) => {
      // Corriger les interpolations mal fermées
      content = content.replace(/outputRange: \['0deg', '360deg'\],\s*\n\s*return/gm,
        "outputRange: ['0deg', '360deg'],\n  });\n\n  return");
        
      return content;
    }
  },
  {
    file: 'src/components/profile/GradeBadge.tsx',
    fix: (content) => {
      // Corriger les interpolations et return
      content = content.replace(/outputRange: \['0deg', '360deg'\],\s*\n\s*return/gm,
        "outputRange: ['0deg', '360deg'],\n  });\n\n  return");
        
      // S'assurer que les styles sont bien fermés
      if (!content.match(/}\);\s*$/)) {
        content = content + '\n});';
      }
      
      return content;
    }
  },
  {
    file: 'src/screens/main/ProfileScreen.tsx',
    fix: (content) => {
      // Supprimer le }); orphelin après le return
      content = content.replace(/return\s*\(\s*}\);\s*$/gm, 'return (');
      
      // S'assurer que le composant est bien fermé
      const lastLine = content.trim().split('\n').pop();
      if (!lastLine.includes('});')) {
        content = content.trimEnd() + '\n});';
      }
      
      return content;
    }
  },
  {
    file: 'src/screens/main/ProgressScreen.tsx',
    fix: (content) => {
      // Même correction
      content = content.replace(/return\s*\(\s*}\);\s*$/gm, 'return (');
      
      const lastLine = content.trim().split('\n').pop();
      if (!lastLine.includes('});')) {
        content = content.trimEnd() + '\n});';
      }
      
      return content;
    }
  },
  {
    file: 'src/screens/main/RankingScreen.tsx',
    fix: (content) => {
      content = content.replace(/return\s*\(\s*}\);\s*$/gm, 'return (');
      
      const lastLine = content.trim().split('\n').pop();
      if (!lastLine.includes('});')) {
        content = content.trimEnd() + '\n});';
      }
      
      return content;
    }
  },
  {
    file: 'src/screens/main/RevisionScreen.tsx',
    fix: (content) => {
      content = content.replace(/return\s*\(\s*}\);\s*$/gm, 'return (');
      
      const lastLine = content.trim().split('\n').pop();
      if (!lastLine.includes('});')) {
        content = content.trimEnd() + '\n});';
      }
      
      return content;
    }
  }
];

// Appliquer les corrections
filesToFix.forEach(({ file, fix }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Fichier non trouvé: ${file}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Appliquer la correction spécifique
    content = fix(content);
    
    // Corrections générales pour tous les fichiers
    // S'assurer que le fichier se termine par une nouvelle ligne
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    
    // Supprimer les lignes avec seulement });
    content = content.replace(/^\s*}\);\s*\n\s*}\);\s*$/gm, '});');
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${file}`);
    } else {
      console.log(`⏭️  Pas de changement: ${file}`);
    }
  } catch (error) {
    console.error(`❌ Erreur sur ${file}:`, error.message);
  }
});

console.log('\n✨ Corrections terminées !');