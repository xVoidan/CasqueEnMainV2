-- ========================================
-- SCRIPT D'ADAPTATION POUR LA BASE EXISTANTE
-- Ce script adapte la structure existante pour CasqueEnMain
-- ========================================

-- ========================================
-- PARTIE 1: ADAPTER LA TABLE questions
-- ========================================

-- Ajouter les colonnes manquantes à la table questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS theme_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS correct_answer TEXT,
ADD COLUMN IF NOT EXISTS options JSONB;

-- Migrer les données existantes si nécessaire
UPDATE questions 
SET theme_name = theme::text 
WHERE theme_name IS NULL AND theme IS NOT NULL;

-- Migrer les réponses existantes vers le nouveau format
UPDATE questions 
SET correct_answer = COALESCE(
  (SELECT answer_text FROM answers WHERE question_id = questions.id AND is_correct = true LIMIT 1),
  'À définir'
)
WHERE correct_answer IS NULL;

-- Migrer les options depuis la table answers
UPDATE questions 
SET options = COALESCE(
  (SELECT jsonb_agg(answer_text ORDER BY order_position) 
   FROM answers 
   WHERE question_id = questions.id),
  '[]'::jsonb
)
WHERE options IS NULL;

-- ========================================
-- PARTIE 2: CRÉER user_profiles EN LIEN AVEC profiles
-- ========================================

-- Créer une vue user_profiles qui pointe vers profiles
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  user_id,
  user_id as id,
  username,
  department,
  avatar_url,
  total_points,
  streak_days as current_streak,
  streak_days as longest_streak,
  created_at::date as last_activity,
  created_at::date as streak_updated_at,
  created_at,
  updated_at,
  -- Colonnes additionnelles
  0 as best_score,
  0 as sessions_completed,
  0 as total_time_played,
  '{"theme": "light"}'::jsonb as preferences,
  username as email
FROM profiles;

-- ========================================
-- PARTIE 3: CRÉER quiz_sessions EN LIEN AVEC sessions
-- ========================================

-- Créer une vue quiz_sessions qui pointe vers sessions
CREATE OR REPLACE VIEW quiz_sessions AS
SELECT 
  id,
  user_id,
  COALESCE(score::integer, 0) as score,
  EXTRACT(EPOCH FROM (ended_at - started_at))::integer as time_spent,
  started_at as created_at,
  ended_at as completed_at,
  -- Colonnes additionnelles
  COALESCE((config->>'theme')::varchar, 'Diverse') as theme_name,
  COALESCE((config->>'questions_count')::integer, 10) as questions_count,
  COALESCE((config->>'correct_answers')::integer, 0) as correct_answers,
  COALESCE(total_points_earned, 0) as points_earned
FROM sessions;

-- ========================================
-- PARTIE 4: CRÉER user_answers EN LIEN AVEC session_answers
-- ========================================

-- Créer une vue user_answers qui pointe vers session_answers
CREATE OR REPLACE VIEW user_answers AS
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
-- PARTIE 5: CRÉER LA TABLE user_question_stats
-- ========================================

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

-- Index pour les requêtes de révision
CREATE INDEX IF NOT EXISTS idx_user_question_stats_user ON user_question_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_mastered ON user_question_stats(is_mastered);
CREATE INDEX IF NOT EXISTS idx_user_question_stats_errors ON user_question_stats(error_count);

-- Policies RLS pour user_question_stats
ALTER TABLE user_question_stats ENABLE ROW LEVEL SECURITY;

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
-- PARTIE 6: AJOUTER LES COLONNES MANQUANTES À profiles
-- ========================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS best_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme": "light"}'::jsonb;

-- ========================================
-- PARTIE 7: INSÉRER LES QUESTIONS DE TEST
-- ========================================

-- Supprimer les anciennes questions de test
DELETE FROM questions WHERE theme_name IN ('Incendie', 'Secourisme', 'Diverse');

-- Insérer les nouvelles questions avec la structure adaptée
INSERT INTO questions (question_text, question_type, theme_name, difficulty, correct_answer, options, explanation, created_at) VALUES
-- Questions Incendie
('Quelle est la classe de feu pour les liquides inflammables ?', 'QCU', 'Incendie', 1, 'Classe B', 
 '["Classe A", "Classe B", "Classe C", "Classe D"]',
 'Les feux de classe B concernent les liquides inflammables comme l''essence, l''huile, les solvants.', NOW()),

('Quel est le débit d''une lance de 45mm sous 6 bars ?', 'QCU', 'Incendie', 2, '500 L/min',
 '["250 L/min", "500 L/min", "750 L/min", "1000 L/min"]',
 'Une lance de 45mm sous 6 bars débite environ 500 litres par minute.', NOW()),

('Quelle est la température d''auto-inflammation du gasoil ?', 'QCU', 'Incendie', 3, '250°C',
 '["150°C", "200°C", "250°C", "350°C"]',
 'Le gasoil s''enflamme spontanément à partir de 250°C environ.', NOW()),

('Quelle est la couleur de l''extincteur à poudre ?', 'QCU', 'Incendie', 1, 'Bleu',
 '["Rouge", "Bleu", "Jaune", "Vert"]',
 'Les extincteurs à poudre sont identifiés par une bande bleue.', NOW()),

('Quel est le temps d''autonomie d''un ARI de 6L à 300 bars ?', 'QCU', 'Incendie', 2, '30 minutes',
 '["20 minutes", "25 minutes", "30 minutes", "35 minutes"]',
 'Calcul : (6L × 300 bars) / 60L/min = 30 minutes.', NOW()),

-- Questions Secourisme
('Quel est le rythme de compression thoracique en RCP adulte ?', 'QCU', 'Secourisme', 1, '100-120/min',
 '["60-80/min", "80-100/min", "100-120/min", "120-140/min"]',
 'Le rythme recommandé est de 100 à 120 compressions par minute.', NOW()),

('Quelle est la position pour une femme enceinte inconsciente ?', 'QCU', 'Secourisme', 2, 'PLS gauche',
 '["PLS droite", "PLS gauche", "Demi-assise", "Allongée"]',
 'La PLS côté gauche évite la compression de la veine cave.', NOW()),

('Que faire face à une hémorragie externe ?', 'QCU', 'Secourisme', 1, 'Compression',
 '["Garrot", "Compression", "Point compression", "Pansement"]',
 'La compression directe est le premier geste.', NOW()),

('Quel est le score de Glasgow minimum ?', 'QCU', 'Secourisme', 1, '3',
 '["0", "1", "3", "5"]',
 'Le score de Glasgow va de 3 à 15.', NOW()),

('Dose d''adrénaline en arrêt cardiaque adulte ?', 'QCU', 'Secourisme', 3, '1mg/3-5min',
 '["0.5mg/2min", "1mg/3-5min", "2mg/5min", "5mg"]',
 'La dose est 1mg IV/IO toutes les 3-5 minutes.', NOW()),

-- Questions Diverses
('Hiérarchie après Sergent ?', 'QCU', 'Diverse', 1, 'Sergent-chef',
 '["Adjudant", "Sergent-chef", "Major", "Lieutenant"]',
 'Sergent → Sergent-chef → Adjudant → Adjudant-chef.', NOW()),

('Délai départ VSAV prompt secours ?', 'QCU', 'Diverse', 2, '1 minute',
 '["30 secondes", "1 minute", "2 minutes", "3 minutes"]',
 'Le délai est de 1 minute en journée.', NOW()),

('Capacité d''un FPT ?', 'QCU', 'Diverse', 1, '3000-4000 L',
 '["1000-2000 L", "2000-3000 L", "3000-4000 L", "5000-6000 L"]',
 'Un FPT a une capacité de 3000 à 4000 litres d''eau.', NOW()),

('Pression de service ARI ?', 'QCU', 'Diverse', 1, '300 bars',
 '["200 bars", "250 bars", "300 bars", "350 bars"]',
 'Les bouteilles ARI sont gonflées à 300 bars.', NOW()),

('Numéro d''urgence européen ?', 'QCU', 'Diverse', 1, '112',
 '["15", "18", "112", "911"]',
 'Le 112 est le numéro d''urgence européen.', NOW());

-- ========================================
-- VÉRIFICATION FINALE
-- ========================================

DO $$
BEGIN
  RAISE NOTICE 'Adaptation terminée avec succès !';
  RAISE NOTICE 'Vérification des tables...';
  
  -- Vérifier que les vues fonctionnent
  IF EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
    RAISE NOTICE '✅ Vue user_profiles OK';
  END IF;
  
  IF EXISTS (SELECT 1 FROM quiz_sessions LIMIT 1) THEN
    RAISE NOTICE '✅ Vue quiz_sessions OK';
  END IF;
  
  -- Compter les questions
  RAISE NOTICE 'Questions insérées: %', (SELECT COUNT(*) FROM questions WHERE theme_name IN ('Incendie', 'Secourisme', 'Diverse'));
END $$;