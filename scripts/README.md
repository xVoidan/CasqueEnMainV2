# Scripts de base de données

## Script de seed (seed-database.js)

Ce script permet de peupler la base de données Supabase avec des données de test complètes.

### Prérequis

1. Avoir configuré le fichier `.env` avec les variables suivantes :
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ucwgtiaebljfbvhokicf.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon
   SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role
   ```

2. Installer les dépendances :
   ```bash
   npm install dotenv
   ```

3. Appliquer les migrations dans Supabase Dashboard :
   - Aller dans SQL Editor
   - Exécuter le contenu de `supabase/migrations/002_fix_database_structure.sql`

### Utilisation

```bash
node scripts/seed-database.js
```

### Données créées

Le script crée automatiquement :

#### 12 utilisateurs de test
- **commandant@test.com** - Commandant Dupont (Grade 14)
- **capitaine@test.com** - Capitaine Legrand (Grade 12)
- **lieutenant@test.com** - Lieutenant Martin (Grade 11)
- **adjudant@test.com** - Adjudant Rousseau (Grade 9)
- **sergent.chef@test.com** - Sergent-Chef Bernard (Grade 7)
- **sergent@test.com** - Sergent Dubois (Grade 6)
- **caporal.chef@test.com** - Caporal-Chef Moreau (Grade 5)
- **caporal@test.com** - Caporal Laurent (Grade 4)
- **sapeur1@test.com** - Sapeur1 Garcia (Grade 3)
- **sapeur2@test.com** - Sapeur2 Martinez (Grade 2)
- **aspirant1@test.com** - Aspirant Thomas (Grade 1)
- **aspirant2@test.com** - Aspirant Robert (Grade 1)

**Mot de passe pour tous : Test123!**

#### 30+ questions variées
- **Mathématiques** : Géométrie, Pourcentages, Fractions, Calcul mental
- **Français** : Grammaire, Orthographe, Conjugaison, Culture générale
- **Métier** : Culture administrative, Techniques opérationnelles, Secours à personne, Matériel et équipements, Hydraulique, Risques chimiques, Grades et hiérarchie

#### Sessions d'entraînement
- 5-10 sessions par utilisateur
- Sessions réparties sur les 60 derniers jours
- Sessions récentes (aujourd'hui et hier) pour les utilisateurs les plus actifs
- Scores et performances adaptés au niveau de chaque utilisateur

#### Défis quotidiens
- 7 derniers jours de défis
- Thèmes variés
- Récompenses en points

#### Classements
- Classement global
- Classement hebdomadaire
- Basé sur les points totaux de chaque utilisateur

### Structure des données

Les données sont organisées de manière cohérente :
- Les utilisateurs de grade élevé ont plus de points et de meilleures performances
- Les sessions récentes sont disponibles pour tester les fonctionnalités actuelles
- Les questions couvrent tous les thèmes et difficultés
- Les classements reflètent l'activité et les performances des utilisateurs

### Recommandations

1. **Première utilisation** : Exécuter le script une seule fois pour créer les données initiales
2. **Réinitialisation** : Si vous souhaitez réinitialiser, supprimez d'abord les données existantes via Supabase Dashboard
3. **Test** : Utilisez le compte **commandant@test.com** pour tester avec un utilisateur expérimenté
4. **Développement** : Les données créées permettent de tester toutes les fonctionnalités de l'application

### Dépannage

- **Erreur "already been registered"** : Les utilisateurs existent déjà, le script utilise les comptes existants
- **Erreur de connexion** : Vérifiez vos clés Supabase dans le fichier `.env`
- **Erreur de permissions** : Assurez-vous d'utiliser la clé `SUPABASE_SERVICE_ROLE_KEY` (pas la clé anon)