-- ==========================================
-- SCRIPT INITIAL : Création des tables simples
-- À exécuter EN PREMIER dans Supabase
-- ==========================================

-- Activer l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLE DES THÈMES
-- ==========================================
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS sub_themes CASCADE;
DROP TABLE IF EXISTS themes CASCADE;

CREATE TABLE themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📚',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. TABLE DES SOUS-THÈMES
-- ==========================================
CREATE TABLE sub_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(theme_id, name)
);

-- ==========================================
-- 3. TABLE DES QUESTIONS
-- ==========================================
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sub_theme_id UUID NOT NULL REFERENCES sub_themes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  wrong_answer_1 TEXT NOT NULL,
  wrong_answer_2 TEXT NOT NULL,
  wrong_answer_3 TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. TABLE DES UTILISATEURS (simple)
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. CRÉER LES INDEX
-- ==========================================
CREATE INDEX idx_sub_themes_theme_id ON sub_themes(theme_id);
CREATE INDEX idx_questions_sub_theme_id ON questions(sub_theme_id);

-- ==========================================
-- 6. TRIGGER POUR updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer les triggers s'ils existent déjà
DROP TRIGGER IF EXISTS update_themes_updated_at ON themes;
DROP TRIGGER IF EXISTS update_sub_themes_updated_at ON sub_themes;
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Recréer les triggers
CREATE TRIGGER update_themes_updated_at BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sub_themes_updated_at BEFORE UPDATE ON sub_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 7. INSÉRER LES DONNÉES ORIGINALES DE L'APP
-- ==========================================

-- Thèmes principaux (comme dans l'app)
INSERT INTO themes (name, icon) VALUES 
  ('Mathématiques', '📐'),
  ('Français', '📚'),
  ('Métier', '🚒')
ON CONFLICT (name) DO NOTHING;

-- Récupérer les IDs des thèmes
DO $$
DECLARE
  math_id UUID;
  francais_id UUID;
  metier_id UUID;
  -- IDs des sous-thèmes pour les questions
  calcul_id UUID;
  conjugaison_id UUID;
  incendie_id UUID;
  secourisme_id UUID;
BEGIN
  -- Récupérer les IDs des thèmes
  SELECT id INTO math_id FROM themes WHERE name = 'Mathématiques';
  SELECT id INTO francais_id FROM themes WHERE name = 'Français';
  SELECT id INTO metier_id FROM themes WHERE name = 'Métier';

  -- Insérer les sous-thèmes pour Mathématiques
  INSERT INTO sub_themes (theme_id, name) VALUES 
    (math_id, 'Calcul mental'),
    (math_id, 'Fractions'),
    (math_id, 'Géométrie'),
    (math_id, 'Pourcentages')
  ON CONFLICT DO NOTHING;

  -- Insérer les sous-thèmes pour Français
  INSERT INTO sub_themes (theme_id, name) VALUES 
    (francais_id, 'Conjugaison'),
    (francais_id, 'Culture générale'),
    (francais_id, 'Grammaire'),
    (francais_id, 'Orthographe')
  ON CONFLICT DO NOTHING;

  -- Insérer les sous-thèmes pour Métier (pompiers)
  INSERT INTO sub_themes (theme_id, name) VALUES 
    (metier_id, 'Culture administrative'),
    (metier_id, 'Diverse'),
    (metier_id, 'Grades et hiérarchie'),
    (metier_id, 'Hydraulique'),
    (metier_id, 'Incendie'),
    (metier_id, 'Matériel et équipements'),
    (metier_id, 'Risques chimiques'),
    (metier_id, 'Secourisme'),
    (metier_id, 'Secours à personne'),
    (metier_id, 'Techniques opérationnelles')
  ON CONFLICT DO NOTHING;

  -- Récupérer les IDs des sous-thèmes pour les questions
  SELECT id INTO calcul_id FROM sub_themes WHERE name = 'Calcul mental';
  SELECT id INTO conjugaison_id FROM sub_themes WHERE name = 'Conjugaison';
  SELECT id INTO incendie_id FROM sub_themes WHERE name = 'Incendie';
  SELECT id INTO secourisme_id FROM sub_themes WHERE name = 'Secourisme';

  -- Questions pour Calcul mental
  INSERT INTO questions (sub_theme_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, explanation) VALUES
    (calcul_id, 'Combien font 15 x 8 ?', '120', '100', '140', '110', 'Pour calculer 15 x 8, on peut faire (10 x 8) + (5 x 8) = 80 + 40 = 120'),
    (calcul_id, 'Quel est le résultat de 72 ÷ 9 ?', '8', '7', '9', '6', '72 divisé par 9 égale 8 (car 9 x 8 = 72)')
  ON CONFLICT DO NOTHING;

  -- Questions pour Conjugaison
  INSERT INTO questions (sub_theme_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, explanation) VALUES
    (conjugaison_id, 'Conjuguez le verbe "finir" au présent, 3ème personne du pluriel', 'Ils finissent', 'Ils finient', 'Ils finirent', 'Ils finissaient', 'Au présent, les verbes du 2ème groupe prennent -issent à la 3ème personne du pluriel')
  ON CONFLICT DO NOTHING;

  -- Questions pour Incendie (beaucoup de questions dans l'app originale)
  INSERT INTO questions (sub_theme_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, explanation) VALUES
    (incendie_id, 'Quelle est la température d''inflammation du bois ?', '280°C environ', '100°C', '500°C', '1000°C', 'Le bois s''enflamme généralement autour de 280°C'),
    (incendie_id, 'Quel type d''extincteur pour un feu électrique ?', 'CO2', 'Eau', 'Mousse', 'Sable', 'Le CO2 est non conducteur et idéal pour les feux électriques'),
    (incendie_id, 'Que signifie ARI ?', 'Appareil Respiratoire Isolant', 'Appareil de Refroidissement Intégré', 'Alarme Radio Incendie', 'Agent de Risque Industriel', 'L''ARI protège les voies respiratoires des pompiers'),
    (incendie_id, 'Quelle est la règle des 3 "30" ?', '30m, 30s, 30°C', '30 personnes max', '30 minutes d''intervention', '30 litres d''eau', 'Visibilité 30m, temps de sortie 30s, température 30°C = conditions limites'),
    (incendie_id, 'Qu''est-ce qu''un backdraft ?', 'Explosion de fumées', 'Feu de forêt', 'Type d''échelle', 'Grade pompier', 'Le backdraft est une explosion violente due à l''apport soudain d''oxygène')
  ON CONFLICT DO NOTHING;

  -- Questions pour Secourisme
  INSERT INTO questions (sub_theme_id, question, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3, explanation) VALUES
    (secourisme_id, 'Quel est le rythme de compression pour un massage cardiaque ?', '100 à 120/min', '60/min', '150/min', '200/min', 'Le rythme recommandé est de 100 à 120 compressions par minute'),
    (secourisme_id, 'Que signifie PLS ?', 'Position Latérale de Sécurité', 'Premier Lieu de Secours', 'Protocole Local de Sauvetage', 'Plan de Localisation Sécurisé', 'La PLS permet de maintenir les voies aériennes libres'),
    (secourisme_id, 'Combien de compressions avant les insufflations ?', '30', '15', '5', '50', 'Le protocole est 30 compressions pour 2 insufflations'),
    (secourisme_id, 'Que faire en premier face à un accident ?', 'Protéger', 'Alerter', 'Secourir', 'Évacuer', 'Protéger, Alerter, Secourir : c''est l''ordre du PAS'),
    (secourisme_id, 'Durée maximale d''un garrot ?', '2 heures', '30 minutes', '6 heures', 'Illimité', 'Un garrot ne doit pas rester plus de 2 heures')
  ON CONFLICT DO NOTHING;

END $$;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Tables créées avec succès !';
  RAISE NOTICE 'Données de test insérées.';
END $$;