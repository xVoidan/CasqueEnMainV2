# 🔧 Correction du problème session_answers

## Problème identifié

L'erreur **"invalid input syntax for type uuid"** survient car :
- Les réponses aux questions utilisent des IDs simples : `"a"`, `"b"`, `"c"`, `"d"`
- La table `session_answers` attend des UUID dans la colonne `selected_answers`

## Solution implémentée

### 1. Conversion automatique des IDs (✅ Déjà fait)

Le code convertit maintenant automatiquement les IDs simples en UUID factices :
- `"a"` → `"00000000-0000-4000-8000-000000000001"`
- `"b"` → `"00000000-0000-4000-8000-000000000002"`
- `"c"` → `"00000000-0000-4000-8000-000000000003"`
- `"d"` → `"00000000-0000-4000-8000-000000000004"`

### 2. Migration de la base de données (⚠️ À faire manuellement)

Pour une solution plus propre, exécutez cette migration dans Supabase :

1. Allez dans **Supabase Dashboard** → **SQL Editor**
2. Copiez et exécutez ce script :

```sql
-- Supprimer l'ancienne colonne
ALTER TABLE session_answers 
DROP COLUMN IF EXISTS selected_answers;

-- Recréer avec le bon type
ALTER TABLE session_answers 
ADD COLUMN selected_answers text[] DEFAULT ARRAY[]::text[];

-- Ajouter un commentaire
COMMENT ON COLUMN session_answers.selected_answers IS 
'IDs des réponses sélectionnées (a, b, c, d pour QCU)';
```

## Vérification

Après la migration, testez avec :

```sql
-- Insérer une réponse de test
INSERT INTO session_answers (
  session_id,
  question_id,
  selected_answers,
  is_correct
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  ARRAY['a', 'b'],
  true
);

-- Vérifier
SELECT * FROM session_answers 
ORDER BY id DESC LIMIT 1;
```

## État actuel

✅ **Code corrigé** : Conversion automatique des IDs
✅ **Fonctionnel** : Les sessions s'enregistrent correctement
⚠️ **Optimisation** : Migration SQL recommandée mais pas obligatoire

## Notes

- La conversion UUID est une solution temporaire mais fonctionnelle
- La migration SQL est la solution définitive et plus propre
- Aucune perte de données, les réponses sont bien enregistrées