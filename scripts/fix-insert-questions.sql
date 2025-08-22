-- ========================================
-- SCRIPT CORRIGÉ POUR INSÉRER LES QUESTIONS
-- Utilise la structure existante avec theme ENUM
-- ========================================

-- ========================================
-- PARTIE 1: ADAPTER LA STRUCTURE
-- ========================================

-- Ajouter les colonnes manquantes si elles n'existent pas
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS theme_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS correct_answer TEXT,
ADD COLUMN IF NOT EXISTS options JSONB;

-- Créer la table user_question_stats pour les révisions
CREATE TABLE IF NOT EXISTS user_question_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  error_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_mastered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_question_stats_user ON user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_mastered ON user_question_stats(is_mastered);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_errors ON user_question_stats(error_count);

-- Activer RLS
ALTER TABLE user_question_stats ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own question stats" ON user_question_stats;
CREATE POLICY "Users can view own question stats"
  ON user_question_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own question stats" ON user_question_stats;
CREATE POLICY "Users can insert own question stats"
  ON user_question_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own question stats" ON user_question_stats;
CREATE POLICY "Users can update own question stats"
  ON user_question_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ========================================
-- PARTIE 2: MAPPER LES THÈMES
-- ========================================

-- Fonction pour mapper nos thèmes vers l'ENUM existant
CREATE OR REPLACE FUNCTION map_theme(theme_text VARCHAR) 
RETURNS theme_type AS $$
BEGIN
  CASE theme_text
    WHEN 'Incendie' THEN RETURN 'Métier'::theme_type;
    WHEN 'Secourisme' THEN RETURN 'Métier'::theme_type;
    WHEN 'Diverse' THEN RETURN 'Métier'::theme_type;
    ELSE RETURN 'Métier'::theme_type;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PARTIE 3: INSÉRER LES QUESTIONS
-- ========================================

-- Supprimer les anciennes questions de test
DELETE FROM questions WHERE theme_name IN ('Incendie', 'Secourisme', 'Diverse');

-- Insérer les questions avec le mapping correct
INSERT INTO questions (
  theme,           -- ENUM obligatoire
  sub_theme,       -- On utilise sub_theme pour stocker notre catégorie
  question_text, 
  question_type, 
  difficulty, 
  correct_answer, 
  options, 
  explanation,
  theme_name,      -- Notre colonne ajoutée
  created_at
) VALUES
-- Questions Incendie (5 questions)
('Métier'::theme_type, 'Incendie', 
 'Quelle est la classe de feu pour les liquides inflammables ?', 
 'QCU', 1, 'Classe B', 
 '["Classe A", "Classe B", "Classe C", "Classe D"]',
 'Les feux de classe B concernent les liquides inflammables comme l''essence, l''huile, les solvants.',
 'Incendie', NOW()),

('Métier'::theme_type, 'Incendie',
 'Quel est le débit d''une lance de 45mm sous 6 bars ?', 
 'QCU', 2, '500 L/min',
 '["250 L/min", "500 L/min", "750 L/min", "1000 L/min"]',
 'Une lance de 45mm sous 6 bars débite environ 500 litres par minute.',
 'Incendie', NOW()),

('Métier'::theme_type, 'Incendie',
 'Quelle est la température d''auto-inflammation du gasoil ?', 
 'QCU', 3, '250°C',
 '["150°C", "200°C", "250°C", "350°C"]',
 'Le gasoil s''enflamme spontanément à partir de 250°C environ.',
 'Incendie', NOW()),

('Métier'::theme_type, 'Incendie',
 'Quelle est la couleur de l''extincteur à poudre ?', 
 'QCU', 1, 'Bleu',
 '["Rouge", "Bleu", "Jaune", "Vert"]',
 'Les extincteurs à poudre sont identifiés par une bande bleue.',
 'Incendie', NOW()),

('Métier'::theme_type, 'Incendie',
 'Quel est le temps d''autonomie d''un ARI de 6L à 300 bars pour 60L/min ?', 
 'QCU', 2, '30 minutes',
 '["20 minutes", "25 minutes", "30 minutes", "35 minutes"]',
 'Calcul : (6L × 300 bars) / 60L/min = 30 minutes.',
 'Incendie', NOW()),

-- Questions Secourisme (5 questions)
('Métier'::theme_type, 'Secourisme',
 'Quel est le rythme de compression thoracique en RCP adulte ?', 
 'QCU', 1, '100-120/min',
 '["60-80/min", "80-100/min", "100-120/min", "120-140/min"]',
 'Le rythme recommandé est de 100 à 120 compressions par minute.',
 'Secourisme', NOW()),

('Métier'::theme_type, 'Secourisme',
 'Quelle est la position pour une femme enceinte inconsciente qui respire ?', 
 'QCU', 2, 'PLS côté gauche',
 '["PLS côté droit", "PLS côté gauche", "Demi-assise", "Allongée"]',
 'La PLS côté gauche évite la compression de la veine cave.',
 'Secourisme', NOW()),

('Métier'::theme_type, 'Secourisme',
 'Que faire en premier face à une hémorragie externe ?', 
 'QCU', 1, 'Compression directe',
 '["Garrot", "Compression directe", "Point de compression", "Pansement"]',
 'La compression directe est le premier geste.',
 'Secourisme', NOW()),

('Métier'::theme_type, 'Secourisme',
 'Quel est le score de Glasgow minimum ?', 
 'QCU', 1, '3',
 '["0", "1", "3", "5"]',
 'Le score de Glasgow va de 3 (coma profond) à 15 (normal).',
 'Secourisme', NOW()),

('Métier'::theme_type, 'Secourisme',
 'Quelle est la dose d''adrénaline en arrêt cardiaque adulte ?', 
 'QCU', 3, '1mg toutes les 3-5 min',
 '["0.5mg/2min", "1mg toutes les 3-5 min", "2mg/5min", "5mg en bolus"]',
 'La dose standard est 1mg IV/IO toutes les 3-5 minutes.',
 'Secourisme', NOW()),

-- Questions Diverses (5 questions)
('Métier'::theme_type, 'Diverse',
 'Quelle est la hiérarchie après Sergent ?', 
 'QCU', 1, 'Sergent-chef',
 '["Adjudant", "Sergent-chef", "Major", "Lieutenant"]',
 'La progression : Sergent → Sergent-chef → Adjudant.',
 'Diverse', NOW()),

('Métier'::theme_type, 'Diverse',
 'Quel est le délai de départ VSAV en prompt secours ?', 
 'QCU', 2, '1 minute',
 '["30 secondes", "1 minute", "2 minutes", "3 minutes"]',
 'Le délai réglementaire est de 1 minute en journée.',
 'Diverse', NOW()),

('Métier'::theme_type, 'Diverse',
 'Quelle est la capacité d''un FPT ?', 
 'QCU', 1, '3000-4000 L',
 '["1000-2000 L", "2000-3000 L", "3000-4000 L", "5000-6000 L"]',
 'Un FPT a généralement 3000 à 4000 litres d''eau.',
 'Diverse', NOW()),

('Métier'::theme_type, 'Diverse',
 'Quelle est la pression de service d''une bouteille ARI ?', 
 'QCU', 1, '300 bars',
 '["200 bars", "250 bars", "300 bars", "350 bars"]',
 'Les bouteilles ARI sont gonflées à 300 bars.',
 'Diverse', NOW()),

('Métier'::theme_type, 'Diverse',
 'Quel est le numéro d''urgence européen ?', 
 'QCU', 1, '112',
 '["15", "18", "112", "911"]',
 'Le 112 est le numéro d''urgence européen.',
 'Diverse', NOW());

-- ========================================
-- PARTIE 4: CRÉER LES VUES POUR COMPATIBILITÉ
-- ========================================

-- Vue user_profiles mappée sur profiles
DROP VIEW IF EXISTS user_profiles;
CREATE VIEW user_profiles AS
SELECT 
  user_id,
  user_id as id,
  username,
  department,
  avatar_url,
  total_points,
  COALESCE(streak_days, 0) as current_streak,
  COALESCE(streak_days, 0) as longest_streak,
  created_at::date as last_activity,
  created_at::date as streak_updated_at,
  created_at,
  updated_at,
  COALESCE(
    (SELECT MAX((score * 100)::integer) 
     FROM sessions 
     WHERE sessions.user_id = profiles.user_id 
     AND ended_at IS NOT NULL), 
    0
  ) as best_score,
  COALESCE(
    (SELECT COUNT(*) 
     FROM sessions 
     WHERE sessions.user_id = profiles.user_id 
     AND status = 'completed'), 
    0
  )::integer as sessions_completed,
  COALESCE(
    (SELECT SUM(EXTRACT(EPOCH FROM (ended_at - started_at))::integer) 
     FROM sessions 
     WHERE sessions.user_id = profiles.user_id 
     AND ended_at IS NOT NULL), 
    0
  )::integer as total_time_played,
  '{"theme": "light"}'::jsonb as preferences,
  (SELECT email FROM auth.users WHERE id = profiles.user_id) as email
FROM profiles;

-- Vue quiz_sessions mappée sur sessions  
DROP VIEW IF EXISTS quiz_sessions;
CREATE VIEW quiz_sessions AS
SELECT 
  id,
  user_id,
  COALESCE((score * 100)::integer, 0) as score,
  COALESCE(EXTRACT(EPOCH FROM (ended_at - started_at))::integer, 0) as time_spent,
  started_at as created_at,
  ended_at as completed_at,
  COALESCE((config->>'theme')::varchar, 'Diverse') as theme_name,
  COALESCE((config->>'questions_count')::integer, 10) as questions_count,
  COALESCE((config->>'correct_answers')::integer, 0) as correct_answers,
  COALESCE(total_points_earned, 0) as points_earned
FROM sessions;

-- Vue user_answers mappée sur session_answers
DROP VIEW IF EXISTS user_answers;
CREATE VIEW user_answers AS
SELECT 
  id,
  session_id,
  question_id,
  COALESCE(array_to_string(selected_answers, ','), '') as user_answer,
  is_correct,
  time_taken as time_spent,
  NOW() as created_at
FROM session_answers;

-- ========================================
-- PARTIE 5: AJOUTER COLONNES MANQUANTES
-- ========================================

-- Ajouter les colonnes manquantes à profiles si nécessaire
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS best_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme": "light"}'::jsonb;

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

DO $$
DECLARE
  question_count INTEGER;
BEGIN
  -- Compter les questions insérées
  SELECT COUNT(*) INTO question_count 
  FROM questions 
  WHERE theme_name IN ('Incendie', 'Secourisme', 'Diverse');
  
  RAISE NOTICE '✅ Script exécuté avec succès !';
  RAISE NOTICE '📊 Questions insérées : %', question_count;
  RAISE NOTICE '✅ Table user_question_stats créée';
  RAISE NOTICE '✅ Vues de compatibilité créées';
  RAISE NOTICE '';
  RAISE NOTICE '📦 N''oubliez pas de créer le bucket "avatars" dans Storage !';
END $$;