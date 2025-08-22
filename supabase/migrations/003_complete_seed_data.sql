-- =====================================================
-- Migration complète avec données de test
-- =====================================================
-- À exécuter APRÈS 002_fix_database_structure.sql
-- Cette migration insère des données de test sans créer d'utilisateurs Auth
-- Les utilisateurs doivent être créés via le script Node.js

-- Nettoyage des données existantes (optionnel)
-- TRUNCATE TABLE sessions CASCADE;
-- TRUNCATE TABLE daily_challenges CASCADE;
-- TRUNCATE TABLE rankings CASCADE;
-- TRUNCATE TABLE questions CASCADE;

-- =====================================================
-- QUESTIONS DE TEST
-- =====================================================

-- Mathématiques - Géométrie
INSERT INTO questions (theme, sub_theme, question_text, question_type, type, explanation, difficulty, answers, points) VALUES
('Mathématiques', 'Géométrie', 'Quelle est la formule pour calculer l''aire d''un cercle ?', 'QCU', 'single', 
 'L''aire d''un cercle se calcule avec la formule A = πr² où r est le rayon du cercle.', 1,
 '[{"id": "a", "text": "πr²", "isCorrect": true}, {"id": "b", "text": "2πr", "isCorrect": false}, {"id": "c", "text": "πd", "isCorrect": false}, {"id": "d", "text": "r²/π", "isCorrect": false}]'::jsonb, 1),

('Mathématiques', 'Géométrie', 'Quel est le périmètre d''un rectangle de longueur 8m et de largeur 5m ?', 'QCU', 'single',
 'Le périmètre d''un rectangle se calcule avec P = 2(L + l) = 2(8 + 5) = 26m', 1,
 '[{"id": "a", "text": "18m", "isCorrect": false}, {"id": "b", "text": "26m", "isCorrect": true}, {"id": "c", "text": "40m", "isCorrect": false}, {"id": "d", "text": "13m", "isCorrect": false}]'::jsonb, 1),

('Mathématiques', 'Géométrie', 'Combien de côtés possède un hexagone ?', 'QCU', 'single',
 'Un hexagone possède 6 côtés. Le préfixe "hexa" signifie six en grec.', 1,
 '[{"id": "a", "text": "4", "isCorrect": false}, {"id": "b", "text": "5", "isCorrect": false}, {"id": "c", "text": "6", "isCorrect": true}, {"id": "d", "text": "8", "isCorrect": false}]'::jsonb, 1);

-- Mathématiques - Pourcentages
INSERT INTO questions (theme, sub_theme, question_text, question_type, type, explanation, difficulty, answers, points) VALUES
('Mathématiques', 'Pourcentages', 'Un article coûte 80€. Il est soldé à -25%. Quel est son nouveau prix ?', 'QCU', 'single',
 'Réduction = 80 × 0,25 = 20€. Nouveau prix = 80 - 20 = 60€', 1,
 '[{"id": "a", "text": "60€", "isCorrect": true}, {"id": "b", "text": "55€", "isCorrect": false}, {"id": "c", "text": "65€", "isCorrect": false}, {"id": "d", "text": "70€", "isCorrect": false}]'::jsonb, 1),

('Mathématiques', 'Pourcentages', 'Sur 120 candidats, 90 ont réussi l''examen. Quel est le taux de réussite ?', 'QCU', 'single',
 'Taux = (90 / 120) × 100 = 75%', 2,
 '[{"id": "a", "text": "70%", "isCorrect": false}, {"id": "b", "text": "75%", "isCorrect": true}, {"id": "c", "text": "80%", "isCorrect": false}, {"id": "d", "text": "85%", "isCorrect": false}]'::jsonb, 2);

-- Français - Grammaire
INSERT INTO questions (theme, sub_theme, question_text, question_type, type, explanation, difficulty, answers, points) VALUES
('Français', 'Grammaire', 'Quel est le participe passé du verbe "acquérir" ?', 'QCU', 'single',
 'Le participe passé du verbe "acquérir" est "acquis" (acquise au féminin).', 2,
 '[{"id": "a", "text": "Acquis", "isCorrect": true}, {"id": "b", "text": "Acquéri", "isCorrect": false}, {"id": "c", "text": "Acquiert", "isCorrect": false}, {"id": "d", "text": "Acqueru", "isCorrect": false}]'::jsonb, 2),

('Français', 'Grammaire', 'Quel est le pluriel de "un cheval" ?', 'QCU', 'single',
 'Le pluriel de "cheval" est "chevaux" (pluriel irrégulier en -aux).', 1,
 '[{"id": "a", "text": "Chevals", "isCorrect": false}, {"id": "b", "text": "Chevaux", "isCorrect": true}, {"id": "c", "text": "Chevaus", "isCorrect": false}, {"id": "d", "text": "Cheval", "isCorrect": false}]'::jsonb, 1);

-- Français - Culture générale
INSERT INTO questions (theme, sub_theme, question_text, question_type, type, explanation, difficulty, answers, points) VALUES
('Français', 'Culture générale', 'Qui a écrit "Les Misérables" ?', 'QCU', 'single',
 'Victor Hugo est l''auteur des Misérables, publié en 1862.', 1,
 '[{"id": "a", "text": "Victor Hugo", "isCorrect": true}, {"id": "b", "text": "Émile Zola", "isCorrect": false}, {"id": "c", "text": "Alexandre Dumas", "isCorrect": false}, {"id": "d", "text": "Honoré de Balzac", "isCorrect": false}]'::jsonb, 1);

-- Métier - Culture administrative
INSERT INTO questions (theme, sub_theme, question_text, question_type, type, explanation, difficulty, answers, points) VALUES
('Métier', 'Culture administrative', 'Que signifie SDIS ?', 'QCU', 'single',
 'SDIS signifie Service Départemental d''Incendie et de Secours.', 1,
 '[{"id": "a", "text": "Service Départemental d''Incendie et de Secours", "isCorrect": true}, {"id": "b", "text": "Syndicat Départemental d''Intervention et de Sauvetage", "isCorrect": false}, {"id": "c", "text": "Service de Défense Incendie et Secours", "isCorrect": false}, {"id": "d", "text": "Système Départemental d''Intervention Sécurisée", "isCorrect": false}]'::jsonb, 1),

('Métier', 'Culture administrative', 'Quel est le numéro d''urgence européen ?', 'QCU', 'single',
 'Le 112 est le numéro d''urgence européen valable dans tous les pays de l''UE.', 1,
 '[{"id": "a", "text": "15", "isCorrect": false}, {"id": "b", "text": "18", "isCorrect": false}, {"id": "c", "text": "112", "isCorrect": true}, {"id": "d", "text": "17", "isCorrect": false}]'::jsonb, 1);

-- Métier - Techniques opérationnelles (QCM)
INSERT INTO questions (theme, sub_theme, question_text, question_type, type, explanation, difficulty, answers, points) VALUES
('Métier', 'Techniques opérationnelles', 'Quels sont les éléments du triangle du feu ?', 'QCM', 'multiple',
 'Le triangle du feu comprend : combustible, comburant (oxygène) et énergie d''activation (chaleur).', 1,
 '[{"id": "a", "text": "Combustible", "isCorrect": true}, {"id": "b", "text": "Comburant (oxygène)", "isCorrect": true}, {"id": "c", "text": "Énergie d''activation", "isCorrect": true}, {"id": "d", "text": "Eau", "isCorrect": false}]'::jsonb, 1);

-- Métier - Secours à personne
INSERT INTO questions (theme, sub_theme, question_text, question_type, type, explanation, difficulty, answers, points) VALUES
('Métier', 'Secours à personne', 'Quelle est la fréquence des compressions thoraciques lors d''un massage cardiaque ?', 'QCU', 'single',
 'Les compressions doivent être effectuées à une fréquence de 100 à 120 par minute.', 1,
 '[{"id": "a", "text": "100 à 120 par minute", "isCorrect": true}, {"id": "b", "text": "60 à 80 par minute", "isCorrect": false}, {"id": "c", "text": "140 à 160 par minute", "isCorrect": false}, {"id": "d", "text": "80 à 100 par minute", "isCorrect": false}]'::jsonb, 1),

('Métier', 'Secours à personne', 'Que signifie PLS ?', 'QCU', 'single',
 'PLS signifie Position Latérale de Sécurité.', 1,
 '[{"id": "a", "text": "Position Latérale de Sécurité", "isCorrect": true}, {"id": "b", "text": "Premiers Lieux de Secours", "isCorrect": false}, {"id": "c", "text": "Plan Local de Sauvetage", "isCorrect": false}, {"id": "d", "text": "Protocole de Levage Sécurisé", "isCorrect": false}]'::jsonb, 1);

-- Métier - Matériel et équipements
INSERT INTO questions (theme, sub_theme, question_text, question_type, type, explanation, difficulty, answers, points) VALUES
('Métier', 'Matériel et équipements', 'Quelle est la capacité d''une bouteille ARI standard ?', 'QCU', 'single',
 'Une bouteille ARI standard a une capacité de 6,8 litres à 300 bars.', 2,
 '[{"id": "a", "text": "6,8 litres à 300 bars", "isCorrect": true}, {"id": "b", "text": "9 litres à 200 bars", "isCorrect": false}, {"id": "c", "text": "6 litres à 350 bars", "isCorrect": false}, {"id": "d", "text": "7 litres à 250 bars", "isCorrect": false}]'::jsonb, 2);

-- =====================================================
-- DÉFIS QUOTIDIENS
-- =====================================================

-- Créer des défis pour les 7 derniers jours
DO $$
DECLARE
    i INTEGER;
    theme_array TEXT[] := ARRAY['Mathématiques', 'Français', 'Métier'];
    selected_theme TEXT;
    question_ids INTEGER[];
BEGIN
    FOR i IN 0..6 LOOP
        selected_theme := theme_array[(i % 3) + 1];
        
        -- Sélectionner des IDs de questions aléatoires pour ce thème
        SELECT ARRAY_AGG(id) INTO question_ids
        FROM (
            SELECT id FROM questions 
            WHERE theme = selected_theme 
            ORDER BY RANDOM() 
            LIMIT 10
        ) q;
        
        -- Insérer le défi quotidien
        INSERT INTO daily_challenges (date, theme, questions_ids, reward_points)
        VALUES (
            CURRENT_DATE - INTERVAL '1 day' * i,
            selected_theme,
            question_ids,
            CASE WHEN i = 0 THEN 150 ELSE 100 END -- Bonus pour aujourd'hui
        )
        ON CONFLICT (date) DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- NOTES IMPORTANTES
-- =====================================================

-- Cette migration ne crée PAS les utilisateurs Auth ni les profils
-- Pour avoir des données complètes de test, utilisez le script Node.js :
-- node scripts/seed-database.js

-- Ce script créera :
-- - 12 utilisateurs avec authentification
-- - Profils complets avec grades et points
-- - Sessions d'entraînement historiques
-- - Classements globaux et hebdomadaires

-- Les questions et défis quotidiens créés ici sont utilisables
-- immédiatement après l'exécution de cette migration.