# 🎓 Mode Examen - Documentation

## Vue d'ensemble

Le **Mode Examen** reproduit fidèlement les conditions réelles du concours de sapeur-pompier professionnel. Il permet aux candidats de s'entraîner dans des conditions strictes et chronométrées.

## Fonctionnalités principales

### ⏱️ Conditions strictes
- **Durée fixe** : 1 heure maximum non-stop
- **Pas de pause** : Une fois commencé, impossible de mettre en pause
- **Timer visible** : Compte à rebours permanent avec alerte à 5 minutes de la fin
- **Anti-triche** : Détection des sorties d'application

### 📊 Système de notation
- **+1 point** par bonne réponse
- **-0.5 point** par mauvaise réponse
- **-0.5 point** si aucune réponse donnée
- **Note sur 20** avec seuil de réussite à 10/20

### 🏆 Classements
- **Par annale** : Classement spécifique à chaque examen
- **Global** : Classement général tous examens confondus
- **Départage** : En cas d'égalité, le temps départage les candidats

### 📱 Fonctionnalités additionnelles
- **Mode révision** : Refaire les annales sans contrainte de temps
- **Certificats PDF** : Génération automatique après chaque examen
- **Partage des résultats** : Sur les réseaux sociaux
- **Statistiques détaillées** : Analyse par problème et distribution des scores

## Architecture technique

### 📁 Structure des fichiers

```
src/
├── types/
│   └── exam.ts                 # Types TypeScript
├── services/
│   └── examService.ts          # Logique métier
└── screens/exam/
    ├── ExamSelectionScreen.tsx # Sélection des annales
    ├── ExamSessionScreen.tsx   # Session d'examen
    └── ExamResultsScreen.tsx   # Résultats et classement

app/exam/
├── selection.tsx               # Route de sélection
├── session.tsx                 # Route de session
└── results.tsx                 # Route des résultats

supabase/
├── migrations/
│   └── 20250125_create_exam_mode.sql  # Schéma BDD
└── seed/
    └── exam_data.sql          # Données d'exemple
```

### 🗄️ Base de données

**Tables principales** :
- `exams` : Annales d'examen
- `exam_problems` : Problèmes avec contexte commun
- `exam_questions` : Questions par problème
- `exam_question_options` : Options de réponse
- `exam_sessions` : Sessions utilisateur
- `exam_user_answers` : Réponses données
- `exam_rankings` : Classements calculés
- `exam_certificates` : Certificats générés

### 🔒 Sécurité et intégrité

- **Score d'intégrité** : Commence à 100%, diminue si comportement suspect
- **Détection de triche** :
  - Comptage des sorties d'application (`app_blur_count`)
  - Temps minimum par question (3 secondes)
  - Enregistrement des timestamps
- **Avertissements** : Stockés dans la session pour traçabilité

## Guide d'utilisation

### Pour les utilisateurs

1. **Accès au mode examen**
   - Depuis l'écran d'accueil, cliquer sur "Mode Examen"
   - Bouton violet avec icône 🎓

2. **Sélection de l'annale**
   - Choisir parmi les annales disponibles
   - Voir le nombre de questions et la durée
   - Option "Mode Blanc" pour s'entraîner sans classement

3. **Avertissement pré-examen**
   - Lire attentivement les conditions
   - Préparer l'environnement (mode Ne pas déranger)
   - Choisir entre :
     - **Commencer** : Lancer l'examen officiel
     - **Mode Révision** : Sans contrainte de temps
     - **Annuler** : Revenir à la sélection

4. **Pendant l'examen**
   - Naviguer avec Précédent/Suivant
   - Timer visible en permanence
   - Alerte vibration + notification à 5 minutes de la fin
   - Bouton "Terminer" toujours accessible

5. **Résultats**
   - Score détaillé avec émoji de performance
   - Position dans le classement
   - Top 10 des meilleurs scores
   - Options de partage et certificat PDF

### Pour les administrateurs

1. **Ajouter une nouvelle annale**
   ```sql
   INSERT INTO exams (title, year, duration_minutes, max_questions, passing_score)
   VALUES ('Concours 2025', 2025, 60, 20, 10.0);
   ```

2. **Ajouter des problèmes et questions**
   - Créer d'abord les problèmes avec leur contexte
   - Ajouter les questions liées à chaque problème
   - Définir les options de réponse avec `is_correct`

3. **Gérer les modes**
   - `is_practice_mode = true` : Mode blanc non comptabilisé
   - `is_active = false` : Désactiver temporairement

## Développements futurs

### 🚀 Améliorations prévues

1. **Interface administrateur web**
   - CRUD complet pour les annales
   - Import/export de questions
   - Statistiques avancées

2. **Fonctionnalités avancées**
   - Mode collaboratif (défis entre utilisateurs)
   - Recommandations IA basées sur les erreurs
   - Vidéos explicatives pour les corrections
   - Mode hors-ligne avec synchronisation

3. **Analytics**
   - Heatmap des difficultés par question
   - Prédiction de réussite au concours
   - Suggestions de révision personnalisées

## Commandes utiles

```bash
# Appliquer la migration
npx supabase migration up

# Charger les données d'exemple
npx supabase db seed --file supabase/seed/exam_data.sql

# Vérifier les logs
npm run logs:exam

# Tests du mode examen
npm run test:exam
```

## Troubleshooting

### Problème : "Session déjà en cours"
**Solution** : Vérifier dans la BDD et supprimer les sessions `in_progress` orphelines

### Problème : Timer qui ne s'arrête pas
**Solution** : Vérifier que `clearInterval` est bien appelé dans `cleanup()`

### Problème : Certificat PDF qui ne se génère pas
**Solution** : Vérifier les permissions d'expo-print et expo-sharing

## Support

Pour toute question ou problème :
- Consulter les logs Supabase : `mcp__supabase__get_logs`
- Vérifier les advisors : `mcp__supabase__get_advisors`
- Contacter l'équipe de développement

---

**Version** : 1.0.0  
**Date** : 25 janvier 2025  
**Auteur** : Équipe CasqueEnMains