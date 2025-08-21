# Configuration Rapide Google Auth avec Supabase

## �tat Actuel 

L'authentification Google est **pr�te � �tre configur�e** dans votre application. Le code est d�j� en place et test�.

## Configuration en 5 minutes

### 1. Dans Google Cloud Console

1. Allez sur [console.cloud.google.com](https://console.cloud.google.com)
2. Cr�ez un nouveau projet ou s�lectionnez un existant
3. Activez l'API Google+ (APIs & Services > Enable APIs)
4. Cr�ez des identifiants OAuth 2.0 :
   - **Type**: Application Web
   - **URI de redirection autoris�e**: `https://ucwgtiaebljfbvhokicf.supabase.co/auth/v1/callback`

### 2. Dans Supabase Dashboard

1. Allez dans Authentication > Providers
2. Activez Google
3. Collez vos cl�s depuis Google Console :
   - **Client ID**: Votre ID client Google
   - **Client Secret**: Votre secret client Google

### 3. Dans votre fichier .env

Vos cl�s sont d�j� configur�es pour le d�veloppement :

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=votre-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=votre-ios-client-id  
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=votre-android-client-id
```

## Test Rapide

1. Lancez l'app : `npm start`
2. Cliquez sur "Continuer avec Google"
3. Connectez-vous avec votre compte Google
4. C'est fait ! <�

## Fonctionnement

Le syst�me g�re automatiquement :
- La cr�ation de compte si l'utilisateur n'existe pas
- La connexion si le compte existe d�j�
- La synchronisation du profil avec les donn�es Google
- La gestion des sessions

## En Production

Pour Android, ajoutez votre SHA-1 dans Google Console :
```bash
# Obtenir le SHA-1
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## Support

L'authentification Google fonctionne avec :
-  Expo Go (d�veloppement)
-  Build de d�veloppement
-  Build de production
-  Web

## R�solution de Probl�mes

### "Invalid Client ID"
� V�rifiez que vous utilisez le bon Client ID pour votre plateforme

### "Redirect URI mismatch"  
� Ajoutez l'URI Supabase dans Google Console

### Connexion �choue silencieusement
� V�rifiez que Google Provider est activ� dans Supabase

---

**Note**: Le code g�re automatiquement la cr�ation/connexion des utilisateurs Google. Aucune modification de code n�cessaire !