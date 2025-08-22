# Casque En Mains V2 - Mémo Claude

## 📋 État du Projet

### Vue d'ensemble

- **Nom**: Casque En Mains V2
- **Type**: Application React Native avec Expo Router
- **Backend**: Supabase (projet: ucwgtiaebljfbvhokicf)
- **Langages**: TypeScript strict, React Native 0.79.5

### Architecture Technique

```
CasqueEnMainV2/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── index.tsx      # Écran d'accueil
│   │   └── explore.tsx    # Écran exploration
│   ├── _layout.tsx        # Layout racine
│   └── +not-found.tsx     # Page 404
├── components/            # Composants réutilisables
│   ├── ThemedText.tsx     # Texte avec thème
│   ├── ThemedView.tsx     # Vue avec thème
│   └── ui/               # Composants UI
├── constants/            # Constantes (couleurs, etc.)
├── hooks/               # Hooks personnalisés
└── assets/              # Images, fonts
```

### Configuration Actuelle

- **ESLint**: Configuration très stricte (8 plugins)
- **TypeScript**: Mode strict activé
- **Prettier**: Formatage automatique
- **Supabase MCP**: Configuré en lecture seule
- **Expo**: Version 53.0.20 avec nouvelles architectures

### État Git

- **Branche**: master
- **Fichiers modifiés**: 22 fichiers (personnalisation du template)
- **Fichiers non trackés**: Configuration ajoutée (.env, .prettierrc, etc.)

## 🔧 Configuration Supabase

### Projet Supabase

- **Ref**: ucwgtiaebljfbvhokicf
- **MCP Server**: @supabase/mcp-server-supabase
- **Mode**: Lecture seule activé
- **Token**: sbp_6710a595d938984c6ddbd63015576c85c01c0acc

### Variables d'environnement (.env.example)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 📚 Ressources Disponibles

### Documentation

- **llms-full.txt**: Documentation complète Expo (1.5MB)
- Guides d'authentification Supabase
- Templates et exemples disponibles

### Commandes Utiles

```bash
# Développement
npm start                    # Démarrer Expo
npm run android             # Android
npm run ios                 # iOS
npm run web                 # Web

# Qualité de code
npm run lint                # Linting strict
npm run lint:fix            # Correction automatique
npm run format              # Formatage Prettier
npm run audit               # Vérification complète

# Utilitaires
npm run reset-project       # Reset vers template vide
```

## 💾 Système de Backup Supabase

### État actuel

- **Tables**: Aucune table créée pour le moment
- **Migrations**: Aucune migration appliquée
- **Scripts de backup**: Installés et opérationnels

### Scripts disponibles

```bash
# Sauvegarde complète (recommandé)
npm run backup:supabase

# Sauvegarde du schéma uniquement
npm run backup:supabase:schema

# Sauvegarde des données uniquement
npm run backup:supabase:data

# Restauration
npm run restore:supabase list           # Liste les backups
npm run restore:supabase latest         # Restore le dernier backup
npm run restore:supabase restore <file> # Restore un fichier spécifique
```

### Fonctionnalités

- ✅ Backup automatique du schéma et des données
- ✅ Sauvegarde des métadonnées du projet
- ✅ Nettoyage automatique (garde les 10 derniers)
- ✅ Backup de sécurité avant restauration
- ✅ Support de différents types de backup
- ✅ Interface en ligne de commande intuitive

### Localisation des backups

- **Dossier**: `./backups/`
- **Format**: `full-backup-YYYY-MM-DDTHH-MM-SS.sql`
- **Métadonnées**: `metadata-YYYY-MM-DDTHH-MM-SS.json`

## 🎯 Prochaines Étapes

### Développement

1. Configurer le fichier .env avec les vraies clés Supabase
2. Implémenter l'authentification avec Supabase
3. Créer les écrans de l'application métier
4. Configurer les tables et données Supabase

### Qualité

1. Résoudre les violations ESLint existantes
2. Commiter les modifications en cours
3. Mettre en place les tests
4. Configurer CI/CD avec EAS

### Backup/Sécurité

1. ✅ Scripts de backup installés
2. Tester les scripts une fois les premières tables créées
3. Programmer des backups automatiques (cron/CI)
4. Configurer la rétention des backups selon les besoins

## 🔄 Workflow de Développement (OBLIGATOIRE)

### Processus à Suivre pour Chaque Modification

1. **🔍 EXPLORE** - Comprendre le contexte
   - Analyser le code existant
   - Comprendre les dépendances et l'architecture
   - Identifier les impacts potentiels

2. **📋 PLAN** - Planifier les modifications
   - Utiliser TodoWrite pour organiser les tâches
   - Décomposer en étapes logiques
   - Anticiper les difficultés

3. **🧠 ULTRATHINK** - Réflexion approfondie
   - Analyser les implications de chaque changement
   - Considérer les effets de bord
   - Valider l'approche technique

4. **💻 CODE** - Implémenter
   - Respecter les conventions existantes
   - Suivre les règles ESLint strictes
   - Tester au fur et à mesure

5. **🔍 ESLINT COMPLET** - Vérification qualité
   - `npm run lint:strict` (0 warning toléré)
   - `npm run format:check`
   - `npm run audit` si possible

6. **✅ COMMIT** - Seulement si parfait
   - **RÈGLE ABSOLUE**: Aucun commit tant qu'il y a des erreurs/warnings
   - Messages de commit clairs et descriptifs
   - Inclure les tests si applicables

### Commandes de Vérification Obligatoires

```bash
# Avant chaque commit
npm run audit           # Lint + Format check
npm run lint:strict     # ESLint sans tolérance
npm run format:check    # Vérification Prettier
```

**⚠️ AUCUN COMMIT AUTORISÉ EN CAS D'ERREUR OU WARNING**

## 🤖 Configuration Claude

### Modèle Requis

- **Modèle**: Claude Opus 4.1 (OBLIGATOIRE)
- **Workflow**: Explore → Plan → UltraThink → Code → ESLint → Commit
- **Qualité**: 0 erreur/warning toléré avant commit

### Rappel pour Claude

À chaque intervention sur ce projet, s'assurer d'être sur **Claude Opus 4.1** et suivre
rigoureusement le workflow de développement défini.

---

**Dernière mise à jour**: 21 août 2025 **Version Claude**: Opus 4.1
