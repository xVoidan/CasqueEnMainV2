# CasqueEnMains - Interface Admin Web

Interface d'administration locale pour gérer les contenus de l'application CasqueEnMains.

## 🚀 Démarrage rapide

```bash
# 1. Installer les dépendances (déjà fait)
npm install

# 2. Lancer l'interface admin
npm run dev
```

L'interface sera accessible sur : **http://localhost:3001**

## 🔐 Connexion

- **Email autorisé** : jonathan.valsaque@gmail.com
- **Mot de passe** : Le même que votre app mobile

## ✨ Fonctionnalités

### 📚 Gestion des Thèmes
- Créer, modifier et supprimer des thèmes
- Ajouter des icônes personnalisées (emojis)
- Gérer les sous-thèmes associés

### ❓ Éditeur de Questions
- Interface intuitive pour créer des questions
- Support des QCM avec 4 réponses
- Ajout d'explications détaillées
- Édition et suppression en temps réel

### 📥 Import/Export
- **Export JSON** : Sauvegarde complète de toutes les données
- **Import JSON** : Restauration depuis une sauvegarde
- **Import CSV** : Import en masse depuis Excel
- **Modèle CSV** : Téléchargement du template pour faciliter l'import

## 🛡️ Sécurité

- ✅ Authentification obligatoire via Supabase
- ✅ Vérification de l'email administrateur
- ✅ Interface accessible uniquement en local (localhost)
- ✅ Connexion sécurisée à Supabase

## 📝 Format CSV pour l'import

Le fichier CSV doit contenir ces colonnes :
- `theme_name` : Nom du thème
- `theme_icon` : Emoji du thème (optionnel)
- `sub_theme_name` : Nom du sous-thème
- `question` : La question
- `correct_answer` : La bonne réponse
- `wrong_answer_1` : Mauvaise réponse 1
- `wrong_answer_2` : Mauvaise réponse 2
- `wrong_answer_3` : Mauvaise réponse 3
- `explanation` : Explication (optionnel)

## 🔧 Configuration

Les variables d'environnement sont dans `.env.local` :
- `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé publique Supabase
- `ADMIN_EMAIL` : Email de l'administrateur autorisé

## 📱 Intégration Mobile

Cette interface admin complète l'application mobile en permettant :
- Une gestion avancée des contenus
- Des imports/exports en masse
- Une édition plus confortable sur ordinateur

## 🆘 Support

En cas de problème :
1. Vérifiez que vous êtes connecté avec le bon email
2. Assurez-vous que le serveur est lancé (`npm run dev`)
3. Vérifiez la connexion à Supabase dans la console