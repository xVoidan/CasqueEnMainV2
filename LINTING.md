# Guide ESLint - Configuration Stricte

## Configuration

Ce projet utilise une configuration ESLint **très stricte** pour garantir la qualité du code et
maintenir des standards élevés.

### Plugins installés

- **TypeScript** : Règles strictes pour TypeScript
- **React & React Native** : Best practices pour React/React Native
- **React Hooks** : Validation des hooks React
- **SonarJS** : Détection de code smells et problèmes de qualité
- **JSX A11y** : Accessibilité
- **Security** : Détection de failles de sécurité
- **Promise** : Gestion correcte des promesses
- **Prettier** : Formatage automatique du code

## Commandes disponibles

```bash
# Vérifier le code (audit strict)
npm run lint

# Corriger automatiquement les erreurs
npm run lint:fix

# Vérification ultra-stricte
npm run lint:strict

# Formater le code avec Prettier
npm run format

# Vérifier le formatage
npm run format:check

# Audit complet (lint + format)
npm run audit

# Corriger tout automatiquement
npm run audit:fix
```

## Règles principales

### TypeScript

- ❌ Pas de `any` explicite
- ✅ Types de retour obligatoires pour les fonctions
- ✅ Gestion stricte des booléens
- ✅ Préfixe `I` pour les interfaces
- ✅ Utilisation de optional chaining

### React/React Native

- ❌ Pas de styles inline
- ❌ Pas de couleurs littérales
- ✅ Self-closing pour les composants vides
- ✅ PascalCase pour les composants
- ✅ Validation exhaustive des dépendances des hooks

### Qualité du code

- **Max lignes par fonction** : 80
- **Max profondeur** : 4 niveaux
- **Max paramètres** : 4
- **Complexité cyclomatique** : 15
- **Longueur fichier** : 300 lignes

### Sécurité & Performances

- ❌ Pas de `console.log` (sauf warn/error)
- ❌ Pas de debugger
- ❌ Pas de eval
- ✅ Gestion correcte des promesses
- ✅ Messages d'erreur obligatoires

## Résolution des erreurs courantes

### "Missing return type on function"

```typescript
// ❌ Mauvais
export default function HomeScreen() {

// ✅ Bon
export default function HomeScreen(): React.ReactElement {
```

### "no-inline-styles"

```typescript
// ❌ Mauvais
<View style={{ padding: 10 }}>

// ✅ Bon
const styles = StyleSheet.create({
  container: { padding: 10 }
});
<View style={styles.container}>
```

### "no-color-literals"

```typescript
// ❌ Mauvais
color: '#808080';

// ✅ Bon
// Dans constants/Colors.ts
export const Colors = {
  gray: '#808080',
};
```

### "max-lines-per-function"

Divisez les grandes fonctions en plusieurs petites fonctions plus spécialisées.

## Workflow recommandé

1. **Avant chaque commit** : Exécutez `npm run audit`
2. **Pour corriger rapidement** : `npm run audit:fix`
3. **En développement** : Activez ESLint dans votre IDE

## Configuration IDE

### VS Code

Installez l'extension ESLint et ajoutez dans `.vscode/settings.json` :

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Désactiver temporairement une règle

⚠️ **À utiliser avec parcimonie !**

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = fetchData();

// Pour un bloc entier (déconseillé)
/* eslint-disable react-native/no-inline-styles */
// votre code
/* eslint-enable react-native/no-inline-styles */
```

## CI/CD

Pour intégrer dans votre pipeline :

```yaml
- name: Lint
  run: npm run lint:strict

- name: Format check
  run: npm run format:check
```

## Support

Si une règle pose problème, vérifiez d'abord si votre code ne peut pas être amélioré. Si la règle
est vraiment inappropriée pour votre cas, documentez pourquoi dans un commentaire avant de la
désactiver.
