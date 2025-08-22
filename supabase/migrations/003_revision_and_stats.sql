-- Migration pour le système de révision et statistiques détaillées

-- Table pour stocker les statistiques par question pour chaque utilisateur
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
CREATE INDEX idx_user_question_stats_user ON user_question_stats(user_id);
CREATE INDEX idx_user_question_stats_mastered ON user_question_stats(is_mastered);
CREATE INDEX idx_user_question_stats_errors ON user_question_stats(error_count);

-- Ajouter les colonnes manquantes à user_profiles si elles n'existent pas
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS best_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_time_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"theme": "light"}'::jsonb;

-- Ajouter les colonnes manquantes à quiz_sessions
ALTER TABLE quiz_sessions
ADD COLUMN IF NOT EXISTS theme_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS questions_count INTEGER,
ADD COLUMN IF NOT EXISTS correct_answers INTEGER,
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- Fonction pour mettre à jour les stats des questions après une session
CREATE OR REPLACE FUNCTION update_question_stats_after_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Pour chaque réponse de la session
  INSERT INTO user_question_stats (user_id, question_id, error_count, success_count, last_attempt)
  SELECT 
    NEW.user_id,
    ua.question_id,
    CASE WHEN ua.is_correct = FALSE THEN 1 ELSE 0 END,
    CASE WHEN ua.is_correct = TRUE THEN 1 ELSE 0 END,
    NOW()
  FROM user_answers ua
  WHERE ua.session_id = NEW.id
  ON CONFLICT (user_id, question_id) 
  DO UPDATE SET
    error_count = user_question_stats.error_count + 
      CASE WHEN excluded.error_count > 0 THEN 1 ELSE 0 END,
    success_count = user_question_stats.success_count + 
      CASE WHEN excluded.success_count > 0 THEN 1 ELSE 0 END,
    last_attempt = excluded.last_attempt,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les stats après une session
DROP TRIGGER IF EXISTS update_question_stats_trigger ON quiz_sessions;
CREATE TRIGGER update_question_stats_trigger
AFTER UPDATE OF completed_at ON quiz_sessions
FOR EACH ROW
WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
EXECUTE FUNCTION update_question_stats_after_session();

-- Policies RLS pour user_question_stats
ALTER TABLE user_question_stats ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir et modifier leurs propres stats
CREATE POLICY "Users can view own question stats"
  ON user_question_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question stats"
  ON user_question_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question stats"
  ON user_question_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour calculer le meilleur score d'un utilisateur
CREATE OR REPLACE FUNCTION calculate_user_best_score(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(score) 
     FROM quiz_sessions 
     WHERE user_id = p_user_id 
     AND completed_at IS NOT NULL),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer le temps total joué
CREATE OR REPLACE FUNCTION calculate_total_time_played(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(EXTRACT(EPOCH FROM (completed_at - created_at))::INTEGER)
     FROM quiz_sessions 
     WHERE user_id = p_user_id 
     AND completed_at IS NOT NULL),
    0
  );
END;
$$ LANGUAGE plpgsql;