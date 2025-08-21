# 🔑 Comment obtenir l'empreinte SHA-1 pour Google Auth Android

## Méthode 1 : Avec Expo (RECOMMANDÉ) 🎯

```bash
# Dans votre projet
npx expo credentials:manager

# Choisissez :
# 1. Android
# 2. production (ou development)
# 3. Keystore
# 4. View keystore info

# L'empreinte SHA-1 sera affichée
```

## Méthode 2 : Avec EAS Build

```bash
# Si vous utilisez EAS Build
eas credentials

# Sélectionnez :
# - Platform: Android
# - Profile: development
# - View Keystore
```

## Méthode 3 : Keytool sur Windows

### A. Trouver votre keystore de debug

Le keystore de debug est généralement ici :

```
C:\Users\VOTRE_NOM\.android\debug.keystore
```

### B. Obtenir le SHA-1

```bash
# Ouvrez PowerShell ou CMD en tant qu'administrateur
# Naviguez vers le dossier Java (adaptez selon votre version)
cd "C:\Program Files\Java\jdk-17\bin"

# Ou si Java est dans PATH, directement :
keytool -list -v -keystore C:\Users\%USERNAME%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## Méthode 4 : Avec Android Studio

1. Ouvrez Android Studio
2. Ouvrez n'importe quel projet Android (ou créez-en un temporaire)
3. Dans le menu : **View → Tool Windows → Gradle**
4. Dans le panneau Gradle : **app → Tasks → android → signingReport**
5. Double-cliquez sur **signingReport**
6. Le SHA-1 apparaîtra dans la console

## Méthode 5 : Pour Expo Managed Workflow (PLUS SIMPLE) 🚀

### Si vous n'avez PAS encore de build Android :

```bash
# Générez un keystore de développement
npx expo prebuild

# Puis
cd android
./gradlew signingReport

# Sur Windows, utilisez :
cd android
gradlew.bat signingReport
```

### SHA-1 pour Expo Go (développement uniquement) :

Pour tester avec Expo Go, utilisez cette empreinte SHA-1 :

```
# SHA-1 Expo Go (Client de développement)
17:75:EA:86:35:0A:11:9C:BA:7C:9C:CE:96:CB:7B:6D:B0:CB:C6:61
```

## Méthode 6 : Script automatique pour Windows

Créez un fichier `get-sha1.bat` :

```batch
@echo off
echo Recherche de l'empreinte SHA-1...
echo.

set KEYSTORE_PATH=%USERPROFILE%\.android\debug.keystore

if not exist "%KEYSTORE_PATH%" (
    echo Keystore introuvable. Création d'un nouveau...
    echo.
    keytool -genkey -v -keystore "%KEYSTORE_PATH%" -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"
)

echo Extraction du SHA-1...
echo.
keytool -list -v -keystore "%KEYSTORE_PATH%" -alias androiddebugkey -storepass android | findstr SHA1

echo.
pause
```

Double-cliquez sur le fichier pour obtenir votre SHA-1.

## 🎯 Solution rapide sans SHA-1

### Pour le développement UNIQUEMENT :

1. **Dans Google Console**, créez le Client Android SANS SHA-1
2. **Utilisez le Web Client ID** pour Android aussi :

```env
# Dans .env - Utilisez le même ID pour tout
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456-abc.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=123456-abc.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=123456-abc.apps.googleusercontent.com
```

3. **Cela fonctionnera** pour le développement avec Expo Go

## 📱 Pour la production

Pour la production, vous DEVREZ avoir le SHA-1 correct :

```bash
# Build de production avec EAS
eas build --platform android

# EAS génèrera automatiquement le keystore
# et vous donnera le SHA-1 dans les logs
```

## 🔍 Vérification

Pour vérifier que votre SHA-1 est correct :

```bash
# Après avoir ajouté le SHA-1 dans Google Console
# Attendez 5-10 minutes
# Testez la connexion Google dans l'app
```

## ⚠️ Erreurs communes

### "keytool n'est pas reconnu"

→ Java n'est pas installé ou pas dans PATH

**Solution** :

```bash
# Installez Java JDK
# Ou utilisez le chemin complet
"C:\Program Files\Java\jdk-17\bin\keytool.exe" -list ...
```

### "keystore not found"

→ Le fichier debug.keystore n'existe pas

**Solution** :

```bash
# Android Studio le créera automatiquement
# Ou créez-le manuellement :
keytool -genkey -v -keystore ~/.android/debug.keystore -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=Android Debug,O=Android,C=US"
```

### "Access denied"

→ Permissions insuffisantes

**Solution** :

```bash
# Lancez PowerShell/CMD en tant qu'administrateur
# Ou copiez debug.keystore sur le bureau
```

## 💡 Astuce pour contourner le problème

**Pour tester rapidement SANS SHA-1** :

1. Ne créez PAS de Client Android
2. Utilisez uniquement le Web Client ID
3. Testez avec Expo Go ou en mode web
4. Ajoutez le SHA-1 plus tard pour la production

---

**Note** : Pour le développement avec Expo Go, le SHA-1 n'est pas strictement nécessaire si vous
utilisez le Web Client ID.
