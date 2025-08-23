# 🔒 Recommandations de Sécurité Supabase

## Actions à effectuer dans le Dashboard Supabase

### 1. ⚠️ Vue SECURITY DEFINER (ERREUR)
La vue `public.user_profiles` utilise SECURITY DEFINER ce qui peut poser des problèmes de sécurité.

**Solution SQL à exécuter:**
```sql
-- Supprimer la vue existante
DROP VIEW IF EXISTS public.user_profiles;

-- Recréer la vue sans SECURITY DEFINER
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  p.user_id,
  p.username,
  p.department,
  p.avatar_url,
  p.total_points,
  p.current_grade,
  p.streak_days,
  p.best_score,
  p.sessions_completed,
  p.total_time_played
FROM profiles p
WHERE p.user_id = auth.uid();

-- Appliquer les permissions appropriées
ALTER VIEW public.user_profiles OWNER TO authenticated;
```

### 2. ⚠️ Fonction sans search_path (WARNING)
La fonction `public.map_theme` n'a pas de search_path défini.

**Solution SQL à exécuter:**
```sql
CREATE OR REPLACE FUNCTION public.map_theme(theme_input text)
RETURNS theme_type AS $$
BEGIN
  CASE theme_input
    WHEN 'Mathématiques' THEN RETURN 'Mathématiques'::theme_type;
    WHEN 'Français' THEN RETURN 'Français'::theme_type;
    WHEN 'Métier' THEN RETURN 'Métier'::theme_type;
    ELSE RAISE EXCEPTION 'Invalid theme: %', theme_input;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog;
```

### 3. ⚠️ Protection contre les mots de passe compromis (WARNING)
La protection contre les mots de passe compromis est désactivée.

**Solution dans le Dashboard:**
1. Aller dans **Authentication** > **Providers**
2. Cliquer sur **Email** 
3. Dans la section **Password Security**
4. Activer **"Leaked password protection"**
5. Sauvegarder les changements

## État actuel de la sécurité

✅ **Points positifs:**
- RLS activé sur toutes les tables (11/11)
- Policies configurées correctement
- Authentification Supabase bien configurée

❌ **À corriger:**
- Vue user_profiles avec SECURITY DEFINER
- Fonction map_theme sans search_path
- Protection mots de passe compromis désactivée

## Priorité des corrections

1. **HAUTE**: Corriger la vue SECURITY DEFINER (risque sécurité)
2. **MOYENNE**: Ajouter search_path à la fonction
3. **FAIBLE**: Activer la protection mots de passe compromis

## Comment appliquer les corrections

### Option 1: Via le SQL Editor de Supabase
1. Se connecter au dashboard Supabase
2. Aller dans **SQL Editor**
3. Copier-coller les requêtes SQL ci-dessus
4. Exécuter les requêtes

### Option 2: Via un script de migration
Créer un nouveau fichier de migration et l'appliquer via le CLI Supabase.

---
*Généré le 23/08/2025*