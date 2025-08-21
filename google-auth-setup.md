# Configuration Google OAuth - Guide Complet

## 📝 Checklist de configuration

### Étape 1 : Projet Google Cloud

- [ ] Créer le projet sur Google Cloud Console
- [ ] Activer l'API Google+ (si nécessaire)
- [ ] Configurer l'écran de consentement OAuth

### Étape 2 : Créer les Client IDs

- [ ] Web Client ID créé
- [ ] Android Client ID créé
- [ ] iOS Client ID créé
- [ ] Secrets copiés et sécurisés

### Étape 3 : Configuration .env

Ajoutez ces lignes dans votre fichier `.env` :

```env
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=votre-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=votre-ios-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=votre-android-client-id.apps.googleusercontent.com
```

### Étape 4 : Configuration app.json

Vérifiez que votre `app.json` contient :

```json
{
  "expo": {
    "scheme": "casqueenmain",
    "android": {
      "package": "com.yourcompany.casqueenmainv2"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.casqueenmainv2",
      "config": {
        "googleSignIn": {
          "reservedClientId": "VOTRE_IOS_CLIENT_ID"
        }
      }
    }
  }
}
```

### Étape 5 : Configuration Supabase

1. Dans Supabase Dashboard → Authentication → Providers
2. Activez Google et ajoutez :
   - Client ID (web)
   - Client Secret
3. Copiez l'URL de callback Supabase
4. Ajoutez cette URL dans Google Console

## 🔍 Vérification

Pour tester la configuration :

```bash
# Vérifier les variables d'environnement
npm run start

# Dans l'app, essayez de vous connecter avec Google
# Vérifiez les logs pour les erreurs
```

## 🚨 Erreurs communes

### "Client Id property must be defined"

→ Vérifiez que les variables d'environnement sont bien définies dans `.env`

### "Invalid client_id"

→ Vérifiez que vous utilisez le bon Client ID pour la bonne plateforme

### "Redirect URI mismatch"

→ Ajoutez l'URI exact dans Google Console

## 📱 Test avec Expo Go

Pour tester avec Expo Go :

1. Utilisez le Web Client ID pour toutes les plateformes en développement
2. Les Client IDs spécifiques (iOS/Android) sont nécessaires pour les builds standalone

## 🔗 Ressources utiles

- [Google Cloud Console](https://console.cloud.google.com/)
- [Expo Google Authentication](https://docs.expo.dev/guides/google-authentication/)
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)

## 📌 Notes importantes

1. **Sécurité** : Ne commitez JAMAIS vos secrets dans Git
2. **Environnements** : Créez des projets Google séparés pour dev/staging/prod
3. **Quotas** : Google OAuth a des limites de requêtes (vérifiez dans la console)
4. **Vérification** : Pour la production, soumettez votre app pour vérification Google
