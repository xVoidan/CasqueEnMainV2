# Configuration Rapide Google Auth avec Supabase

## État Actuel 

L'authentification Google est **prête à être configurée** dans votre application. Le code est déjà en place et testé.

## Configuration en 5 minutes

### 1. Dans Google Cloud Console

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Créez un nouveau projet ou sélectionnez un existant
3. Activez l'API Google+ (APIs & Services > Enable APIs)
4. Créez des identifiants OAuth 2.0 :
   - **Type**: Application Web
   - **URI de redirection autorisée**: `https://ucwgtiaebljfbvhokicf.supabase.co/auth/v1/callback`

### 2. Dans Supabase Dashboard

1. Allez dans Authentication > Providers
2. Activez Google
3. Collez vos clés depuis Google Console :
   - **Client ID**: Votre ID client Google
   - **Client Secret**: Votre secret client Google

### 3. Dans votre fichier .env

Vos clés sont déjà configurées pour le développement :

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=votre-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=votre-ios-client-id  
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=votre-android-client-id
```

## Test Rapide

1. Lancez l'app : `npm start`
2. Cliquez sur "Continuer avec Google"
3. Connectez-vous avec votre compte Google
4. C'est fait ! <‰

## Fonctionnement

Le système gère automatiquement :
- La création de compte si l'utilisateur n'existe pas
- La connexion si le compte existe déjà
- La synchronisation du profil avec les données Google
- La gestion des sessions

## En Production

Pour Android, ajoutez votre SHA-1 dans Google Console :
```bash
# Obtenir le SHA-1
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## Support

L'authentification Google fonctionne avec :
-  Expo Go (développement)
-  Build de développement
-  Build de production
-  Web

## Résolution de Problèmes

### "Invalid Client ID"
’ Vérifiez que vous utilisez le bon Client ID pour votre plateforme

### "Redirect URI mismatch"  
’ Ajoutez l'URI Supabase dans Google Console

### Connexion échoue silencieusement
’ Vérifiez que Google Provider est activé dans Supabase

---

**Note**: Le code gère automatiquement la création/connexion des utilisateurs Google. Aucune modification de code nécessaire !