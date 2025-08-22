-- =============================================
-- SEED DATA - CASQUEENMAIN V2
-- =============================================
-- Script pour insérer des données de test
-- Date: 2025-08-22
-- =============================================

-- =============================================
-- 1. CRÉER DES UTILISATEURS DE TEST
-- =============================================

-- Note: Les utilisateurs doivent être créés via l'authentification Supabase
-- Voici les profils pour les utilisateurs déjà créés

-- Insérer des profils d'utilisateurs (après avoir créé les comptes via Auth)
INSERT INTO public.profiles (user_id, username, department, avatar_url, total_points, current_grade, streak_days, created_at, updated_at) VALUES
-- Top performers
('11111111-1111-1111-1111-111111111111', 'CommandantDupont', '75 - Paris', 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', 45000, 14, 127, NOW() - INTERVAL '6 months', NOW()),
('22222222-2222-2222-2222-222222222222', 'CapitaineLegrand', '13 - Bouches-du-Rhône', 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', 28500, 12, 45, NOW() - INTERVAL '5 months', NOW()),
('33333333-3333-3333-3333-333333333333', 'LieutenantMartin', '69 - Rhône', 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', 18750, 11, 23, NOW() - INTERVAL '4 months', NOW()),

-- Mid performers
('44444444-4444-4444-4444-444444444444', 'AdjudantRousseau', '59 - Nord', 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', 8500, 9, 12, NOW() - INTERVAL '3 months', NOW()),
('55555555-5555-5555-5555-555555555555', 'SergentChefBernard', '33 - Gironde', 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', 4200, 7, 7, NOW() - INTERVAL '3 months', NOW()),
('66666666-6666-6666-6666-666666666666', 'SergentDubois', '06 - Alpes-Maritimes', 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', 2800, 6, 3, NOW() - INTERVAL '2 months', NOW()),

-- Beginners
('77777777-7777-7777-7777-777777777777', 'CaporalChefMoreau', '67 - Bas-Rhin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', 1500, 5, 15, NOW() - INTERVAL '2 months', NOW()),
('88888888-8888-8888-8888-888888888888', 'CaporalLaurent', '31 - Haute-Garonne', 'https://api.dicebear.com/7.x/avataaars/svg?seed=8', 750, 4, 2, NOW() - INTERVAL '1 month', NOW()),
('99999999-9999-9999-9999-999999999999', 'Sapeur1Garcia', '44 - Loire-Atlantique', 'https://api.dicebear.com/7.x/avataaars/svg?seed=9', 350, 3, 1, NOW() - INTERVAL '3 weeks', NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sapeur2Martinez', '34 - Hérault', 'https://api.dicebear.com/7.x/avataaars/svg?seed=10', 180, 2, 0, NOW() - INTERVAL '2 weeks', NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'AspirantThomas', '38 - Isère', 'https://api.dicebear.com/7.x/avataaars/svg?seed=11', 50, 1, 1, NOW() - INTERVAL '1 week', NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'AspirantRobert', '21 - Côte-d\'Or', 'https://api.dicebear.com/7.x/avataaars/svg?seed=12', 25, 1, 0, NOW() - INTERVAL '3 days', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- =============================================
-- 2. QUESTIONS - MATHÉMATIQUES
-- =============================================

-- Géométrie
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Mathématiques', 'Géométrie', 'Quelle est la formule pour calculer l''aire d''un cercle ?', 'QCU', 'single', NULL, 'L''aire d''un cercle se calcule avec la formule A = πr² où r est le rayon du cercle.', 1, 1, NOW()),
('Mathématiques', 'Géométrie', 'Quel est le périmètre d''un rectangle de longueur 8m et de largeur 5m ?', 'QCU', 'single', NULL, 'Le périmètre d''un rectangle se calcule avec P = 2(L + l) = 2(8 + 5) = 26m', 1, 1, NOW()),
('Mathématiques', 'Géométrie', 'Combien de côtés possède un hexagone ?', 'QCU', 'single', NULL, 'Un hexagone possède 6 côtés. Le préfixe "hexa" signifie six en grec.', 1, 1, NOW()),
('Mathématiques', 'Géométrie', 'Quelle est la somme des angles d''un triangle ?', 'QCU', 'single', NULL, 'La somme des angles d''un triangle est toujours égale à 180 degrés.', 1, 1, NOW()),
('Mathématiques', 'Géométrie', 'Calculez l''aire d''un triangle de base 10m et de hauteur 6m.', 'QCU', 'single', NULL, 'L''aire d''un triangle = (base × hauteur) / 2 = (10 × 6) / 2 = 30 m²', 2, 1, NOW());

-- Calcul de surface
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Mathématiques', 'Calcul de surface', 'Une pièce rectangulaire mesure 4m sur 6m. Quelle est sa surface ?', 'QCU', 'single', NULL, 'Surface = longueur × largeur = 4 × 6 = 24 m²', 1, 1, NOW()),
('Mathématiques', 'Calcul de surface', 'Un terrain carré a un côté de 15m. Quelle est sa superficie ?', 'QCU', 'single', NULL, 'Surface d''un carré = côté² = 15² = 225 m²', 1, 1, NOW()),
('Mathématiques', 'Calcul de surface', 'Une piscine circulaire a un rayon de 3m. Quelle est sa surface ? (utilisez π ≈ 3,14)', 'QCU', 'single', NULL, 'Surface = πr² = 3,14 × 3² = 3,14 × 9 = 28,26 m²', 2, 1, NOW()),
('Mathématiques', 'Calcul de surface', 'Un mur mesure 3m de haut et 8m de long. Combien faut-il de litres de peinture si 1L couvre 10m² ?', 'QCU', 'single', NULL, 'Surface = 3 × 8 = 24 m². Peinture nécessaire = 24 / 10 = 2,4 L', 3, 2, NOW());

-- Volumes
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Mathématiques', 'Volumes', 'Quel est le volume d''un cube de 4m de côté ?', 'QCU', 'single', NULL, 'Volume d''un cube = côté³ = 4³ = 64 m³', 1, 1, NOW()),
('Mathématiques', 'Volumes', 'Un cylindre a un rayon de 2m et une hauteur de 5m. Quel est son volume ? (π ≈ 3,14)', 'QCU', 'single', NULL, 'Volume = πr²h = 3,14 × 2² × 5 = 3,14 × 4 × 5 = 62,8 m³', 2, 1, NOW()),
('Mathématiques', 'Volumes', 'Une citerne parallélépipédique mesure 2m × 3m × 4m. Quelle est sa capacité en litres ?', 'QCU', 'single', NULL, 'Volume = 2 × 3 × 4 = 24 m³ = 24 000 litres (1 m³ = 1000 L)', 2, 1, NOW());

-- Pourcentages
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Mathématiques', 'Pourcentages', 'Un article coûte 80€. Il est soldé à -25%. Quel est son nouveau prix ?', 'QCU', 'single', NULL, 'Réduction = 80 × 0,25 = 20€. Nouveau prix = 80 - 20 = 60€', 1, 1, NOW()),
('Mathématiques', 'Pourcentages', 'Sur 120 candidats, 90 ont réussi l''examen. Quel est le taux de réussite ?', 'QCU', 'single', NULL, 'Taux = (90 / 120) × 100 = 75%', 2, 1, NOW()),
('Mathématiques', 'Pourcentages', 'Un salaire de 2000€ augmente de 3%. Quel est le nouveau salaire ?', 'QCU', 'single', NULL, 'Augmentation = 2000 × 0,03 = 60€. Nouveau salaire = 2000 + 60 = 2060€', 2, 1, NOW()),
('Mathématiques', 'Pourcentages', 'Une population de 50 000 habitants augmente de 2% par an. Combien d''habitants après 1 an ?', 'QCU', 'single', NULL, '50 000 × 1,02 = 51 000 habitants', 2, 1, NOW());

-- =============================================
-- 3. QUESTIONS - FRANÇAIS
-- =============================================

-- Grammaire
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Français', 'Grammaire', 'Quel est le participe passé du verbe "acquérir" ?', 'QCU', 'single', NULL, 'Le participe passé du verbe "acquérir" est "acquis" (acquise au féminin).', 2, 1, NOW()),
('Français', 'Grammaire', 'Complétez : "Les pompiers sont _____ rapidement."', 'QCU', 'single', NULL, '"Intervenir" s''accorde avec l''auxiliaire être : "Les pompiers sont intervenus rapidement."', 1, 1, NOW()),
('Français', 'Grammaire', 'Quel est le pluriel de "un cheval" ?', 'QCU', 'single', NULL, 'Le pluriel de "cheval" est "chevaux" (pluriel irrégulier en -aux).', 1, 1, NOW()),
('Français', 'Grammaire', 'Conjuguez le verbe "voir" à la 1ère personne du singulier du futur simple.', 'QCU', 'single', NULL, 'Je verrai (futur simple du verbe voir).', 2, 1, NOW());

-- Vocabulaire
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Français', 'Vocabulaire', 'Que signifie le mot "abnégation" ?', 'QCU', 'single', NULL, 'L''abnégation est le sacrifice volontaire de soi-même, de ses intérêts.', 3, 2, NOW()),
('Français', 'Vocabulaire', 'Quel est le synonyme de "courageux" ?', 'QCU', 'single', NULL, 'Les synonymes de courageux incluent : brave, vaillant, intrépide, valeureux.', 1, 1, NOW()),
('Français', 'Vocabulaire', 'Quel est l''antonyme de "dangereux" ?', 'QCU', 'single', NULL, 'L''antonyme de dangereux est sûr, sécurisé, ou inoffensif.', 1, 1, NOW());

-- Culture générale
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Français', 'Culture générale', 'Qui a écrit "Les Misérables" ?', 'QCU', 'single', NULL, 'Victor Hugo est l''auteur des Misérables, publié en 1862.', 1, 1, NOW()),
('Français', 'Culture générale', 'En quelle année a eu lieu la Révolution française ?', 'QCU', 'single', NULL, 'La Révolution française a commencé en 1789 avec la prise de la Bastille le 14 juillet.', 2, 1, NOW()),
('Français', 'Culture générale', 'Quelle est la capitale de la région Nouvelle-Aquitaine ?', 'QCU', 'single', NULL, 'Bordeaux est la capitale de la région Nouvelle-Aquitaine.', 2, 1, NOW()),
('Français', 'Culture générale', 'Quel est le plus long fleuve de France ?', 'QCU', 'single', NULL, 'La Loire est le plus long fleuve de France avec 1 013 km.', 2, 1, NOW());

-- =============================================
-- 4. QUESTIONS - MÉTIER POMPIER
-- =============================================

-- Culture administrative
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Métier', 'Culture administrative', 'Que signifie SDIS ?', 'QCU', 'single', NULL, 'SDIS signifie Service Départemental d''Incendie et de Secours.', 1, 1, NOW()),
('Métier', 'Culture administrative', 'Qui dirige un SDIS ?', 'QCU', 'single', NULL, 'Le SDIS est dirigé par un Directeur Départemental des Services d''Incendie et de Secours (DDSIS).', 2, 1, NOW()),
('Métier', 'Culture administrative', 'Quel est le numéro d''urgence européen ?', 'QCU', 'single', NULL, 'Le 112 est le numéro d''urgence européen valable dans tous les pays de l''UE.', 1, 1, NOW()),
('Métier', 'Culture administrative', 'Que signifie CIS ?', 'QCU', 'single', NULL, 'CIS signifie Centre d''Incendie et de Secours.', 1, 1, NOW()),
('Métier', 'Culture administrative', 'Quelle est la devise des sapeurs-pompiers de Paris ?', 'QCU', 'single', NULL, '"Sauver ou périr" est la devise de la Brigade de sapeurs-pompiers de Paris.', 2, 1, NOW());

-- Techniques opérationnelles
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Métier', 'Techniques opérationnelles', 'Quels sont les éléments du triangle du feu ?', 'QCM', 'multiple', NULL, 'Le triangle du feu comprend : combustible, comburant (oxygène) et énergie d''activation (chaleur).', 1, 2, NOW()),
('Métier', 'Techniques opérationnelles', 'Quelle est la température d''inflammation du bois ?', 'QCU', 'single', NULL, 'Le bois s''enflamme généralement entre 250°C et 300°C.', 3, 2, NOW()),
('Métier', 'Techniques opérationnelles', 'Que signifie ARI ?', 'QCU', 'single', NULL, 'ARI signifie Appareil Respiratoire Isolant.', 1, 1, NOW()),
('Métier', 'Techniques opérationnelles', 'Quels sont les classes de feux ?', 'QCM', 'multiple', NULL, 'Classes : A (solides), B (liquides), C (gaz), D (métaux), F (huiles de cuisson).', 2, 2, NOW()),
('Métier', 'Techniques opérationnelles', 'Quelle est la pression normale d''une lance incendie ?', 'QCU', 'single', NULL, 'La pression normale d''utilisation est généralement de 6 bars.', 3, 2, NOW());

-- Secours à personne
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Métier', 'Secours à personne', 'Quelle est la fréquence des compressions thoraciques lors d''un massage cardiaque ?', 'QCU', 'single', NULL, 'Les compressions doivent être effectuées à une fréquence de 100 à 120 par minute.', 1, 1, NOW()),
('Métier', 'Secours à personne', 'Quel est le ratio compressions/insufflations en RCP ?', 'QCU', 'single', NULL, 'Le ratio est de 30 compressions pour 2 insufflations.', 1, 1, NOW()),
('Métier', 'Secours à personne', 'Que signifie PLS ?', 'QCU', 'single', NULL, 'PLS signifie Position Latérale de Sécurité.', 1, 1, NOW()),
('Métier', 'Secours à personne', 'Quels sont les signes d''un AVC ?', 'QCM', 'multiple', NULL, 'Signes FAST : Face (visage), Arms (bras), Speech (parole), Time (temps).', 2, 2, NOW()),
('Métier', 'Secours à personne', 'Quelle est la profondeur des compressions thoraciques chez l''adulte ?', 'QCU', 'single', NULL, 'Les compressions doivent être d''au moins 5 cm mais sans dépasser 6 cm.', 2, 1, NOW());

-- Prévention
INSERT INTO public.questions (theme, sub_theme, question_text, question_type, type, image_url, explanation, difficulty, points, created_at) VALUES
('Métier', 'Prévention', 'À quelle fréquence doit-on vérifier un détecteur de fumée ?', 'QCU', 'single', NULL, 'Un détecteur de fumée doit être testé au moins une fois par mois.', 1, 1, NOW()),
('Métier', 'Prévention', 'Quelle est la durée de vie moyenne d''un extincteur ?', 'QCU', 'single', NULL, 'Un extincteur a généralement une durée de vie de 20 ans avec révisions annuelles.', 2, 1, NOW()),
('Métier', 'Prévention', 'Combien de sorties de secours minimum pour un ERP de type L ?', 'QCU', 'single', NULL, 'Un ERP de type L (salles de spectacle) doit avoir au minimum 2 sorties de secours.', 3, 2, NOW());

-- =============================================
-- 5. RÉPONSES POUR LES QUESTIONS
-- =============================================

-- Note: Les réponses sont stockées dans la colonne 'answers' en JSONB
-- Voici un exemple de mise à jour pour quelques questions

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "πr²", "isCorrect": true},
  {"id": "b", "text": "2πr", "isCorrect": false},
  {"id": "c", "text": "πd", "isCorrect": false},
  {"id": "d", "text": "r²/π", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Quelle est la formule pour calculer l''aire d''un cercle ?';

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "18m", "isCorrect": false},
  {"id": "b", "text": "26m", "isCorrect": true},
  {"id": "c", "text": "40m", "isCorrect": false},
  {"id": "d", "text": "13m", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Quel est le périmètre d''un rectangle de longueur 8m et de largeur 5m ?';

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "60€", "isCorrect": true},
  {"id": "b", "text": "55€", "isCorrect": false},
  {"id": "c", "text": "65€", "isCorrect": false},
  {"id": "d", "text": "70€", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Un article coûte 80€. Il est soldé à -25%. Quel est son nouveau prix ?';

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "Acquis", "isCorrect": true},
  {"id": "b", "text": "Acquéri", "isCorrect": false},
  {"id": "c", "text": "Acquiert", "isCorrect": false},
  {"id": "d", "text": "Acqueru", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Quel est le participe passé du verbe "acquérir" ?';

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "100 à 120 par minute", "isCorrect": true},
  {"id": "b", "text": "60 à 80 par minute", "isCorrect": false},
  {"id": "c", "text": "140 à 160 par minute", "isCorrect": false},
  {"id": "d", "text": "80 à 100 par minute", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Quelle est la fréquence des compressions thoraciques lors d''un massage cardiaque ?';

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "Service Départemental d''Incendie et de Secours", "isCorrect": true},
  {"id": "b", "text": "Syndicat Départemental d''Intervention et de Sauvetage", "isCorrect": false},
  {"id": "c", "text": "Service de Défense Incendie et Secours", "isCorrect": false},
  {"id": "d", "text": "Système Départemental d''Intervention Sécurisée", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Que signifie SDIS ?';

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "Combustible", "isCorrect": true},
  {"id": "b", "text": "Comburant (oxygène)", "isCorrect": true},
  {"id": "c", "text": "Énergie d''activation", "isCorrect": true},
  {"id": "d", "text": "Eau", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Quels sont les éléments du triangle du feu ?';

-- Mettre à jour toutes les autres questions avec des réponses
UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "4", "isCorrect": false},
  {"id": "b", "text": "5", "isCorrect": false},
  {"id": "c", "text": "6", "isCorrect": true},
  {"id": "d", "text": "8", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Combien de côtés possède un hexagone ?';

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "180°", "isCorrect": true},
  {"id": "b", "text": "360°", "isCorrect": false},
  {"id": "c", "text": "90°", "isCorrect": false},
  {"id": "d", "text": "270°", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Quelle est la somme des angles d''un triangle ?';

UPDATE public.questions 
SET answers = '[
  {"id": "a", "text": "30 m²", "isCorrect": true},
  {"id": "b", "text": "60 m²", "isCorrect": false},
  {"id": "c", "text": "16 m²", "isCorrect": false},
  {"id": "d", "text": "40 m²", "isCorrect": false}
]'::jsonb
WHERE question_text = 'Calculez l''aire d''un triangle de base 10m et de hauteur 6m.';

-- =============================================
-- 6. SESSIONS DE TEST
-- =============================================

-- Créer des sessions terminées pour les utilisateurs
INSERT INTO public.sessions (id, user_id, config, started_at, ended_at, score, total_points_earned, status) VALUES
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 
'{"themes": ["Mathématiques", "Métier"], "questionCount": 20, "timerEnabled": true, "timerDuration": 30}'::jsonb,
NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', 85.5, 120, 'completed'),

(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 
'{"themes": ["Français"], "questionCount": 10, "timerEnabled": false}'::jsonb,
NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '8 minutes', 90.0, 95, 'completed'),

(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 
'{"themes": ["Métier"], "questionCount": 30, "timerEnabled": true, "timerDuration": 45}'::jsonb,
NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '25 minutes', 78.3, 150, 'completed'),

(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 
'{"themes": ["Mathématiques", "Français", "Métier"], "questionCount": 40, "timerEnabled": true, "timerDuration": 30}'::jsonb,
NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '35 minutes', 92.5, 200, 'completed'),

(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 
'{"themes": ["Français"], "questionCount": 20, "timerEnabled": false}'::jsonb,
NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week' + INTERVAL '18 minutes', 75.0, 80, 'completed');

-- =============================================
-- 7. DÉFIS QUOTIDIENS
-- =============================================

INSERT INTO public.daily_challenges (date, theme, questions_ids, reward_points) VALUES
(CURRENT_DATE, 'Métier', ARRAY(SELECT id FROM public.questions WHERE theme = 'Métier' ORDER BY RANDOM() LIMIT 10), 100),
(CURRENT_DATE - INTERVAL '1 day', 'Mathématiques', ARRAY(SELECT id FROM public.questions WHERE theme = 'Mathématiques' ORDER BY RANDOM() LIMIT 10), 100),
(CURRENT_DATE - INTERVAL '2 days', 'Français', ARRAY(SELECT id FROM public.questions WHERE theme = 'Français' ORDER BY RANDOM() LIMIT 10), 100),
(CURRENT_DATE - INTERVAL '3 days', 'Métier', ARRAY(SELECT id FROM public.questions WHERE theme = 'Métier' ORDER BY RANDOM() LIMIT 10), 100),
(CURRENT_DATE - INTERVAL '4 days', 'Mathématiques', ARRAY(SELECT id FROM public.questions WHERE theme = 'Mathématiques' ORDER BY RANDOM() LIMIT 10), 100);

-- =============================================
-- 8. PARTICIPATION AUX DÉFIS
-- =============================================

-- Les top performers ont fait les défis quotidiens
INSERT INTO public.user_challenges (user_id, challenge_id, completed_at, points_earned)
SELECT 
    p.user_id,
    c.id,
    c.date + INTERVAL '18 hours' + INTERVAL '30 minutes' * RANDOM(),
    c.reward_points * (0.8 + RANDOM() * 0.2)
FROM public.profiles p
CROSS JOIN public.daily_challenges c
WHERE p.total_points > 10000
AND c.date < CURRENT_DATE
ON CONFLICT DO NOTHING;

-- =============================================
-- 9. GRADES HISTORIQUES
-- =============================================

-- Enregistrer les grades atteints
INSERT INTO public.user_grades (user_id, grade_level, grade_name, reached_at)
SELECT 
    user_id,
    level,
    CASE level
        WHEN 1 THEN 'Aspirant'
        WHEN 2 THEN 'Sapeur 2ème classe'
        WHEN 3 THEN 'Sapeur 1ère classe'
        WHEN 4 THEN 'Caporal'
        WHEN 5 THEN 'Caporal-chef'
        WHEN 6 THEN 'Sergent'
        WHEN 7 THEN 'Sergent-chef'
        WHEN 8 THEN 'Adjudant'
        WHEN 9 THEN 'Adjudant-chef'
        WHEN 10 THEN 'Lieutenant'
        WHEN 11 THEN 'Lieutenant 1ère classe'
        WHEN 12 THEN 'Capitaine'
        WHEN 13 THEN 'Commandant'
        WHEN 14 THEN 'Lieutenant-colonel'
        WHEN 15 THEN 'Colonel'
    END,
    NOW() - INTERVAL '1 month' * (15 - level)
FROM public.profiles,
LATERAL generate_series(1, current_grade) AS level
ON CONFLICT DO NOTHING;

-- =============================================
-- 10. STATISTIQUES PAR THÈME
-- =============================================

INSERT INTO public.user_stats (user_id, theme, total_questions, correct_answers, avg_time_per_question)
SELECT 
    user_id,
    theme,
    FLOOR(RANDOM() * 100 + 50),
    FLOOR(RANDOM() * 80 + 20),
    RANDOM() * 10 + 5
FROM public.profiles
CROSS JOIN (VALUES ('Mathématiques'), ('Français'), ('Métier')) AS themes(theme)
WHERE total_points > 100
ON CONFLICT DO NOTHING;

-- =============================================
-- 11. CLASSEMENTS
-- =============================================

-- Classement global
INSERT INTO public.rankings (user_id, ranking_type, points, rank, period_start, period_end)
SELECT 
    user_id,
    'global',
    total_points,
    ROW_NUMBER() OVER (ORDER BY total_points DESC),
    '2025-01-01'::date,
    '2025-12-31'::date
FROM public.profiles
WHERE total_points > 0;

-- Classement hebdomadaire
INSERT INTO public.rankings (user_id, ranking_type, points, rank, period_start, period_end)
SELECT 
    user_id,
    'weekly',
    FLOOR(total_points * 0.1),
    ROW_NUMBER() OVER (ORDER BY total_points DESC),
    date_trunc('week', CURRENT_DATE)::date,
    (date_trunc('week', CURRENT_DATE) + INTERVAL '6 days')::date
FROM public.profiles
WHERE total_points > 0;

-- Classement mensuel
INSERT INTO public.rankings (user_id, ranking_type, points, rank, period_start, period_end)
SELECT 
    user_id,
    'monthly',
    FLOOR(total_points * 0.3),
    ROW_NUMBER() OVER (ORDER BY total_points DESC),
    date_trunc('month', CURRENT_DATE)::date,
    (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date
FROM public.profiles
WHERE total_points > 0;

-- =============================================
-- 12. BADGES GAGNÉS
-- =============================================

-- Attribuer les badges de grade
INSERT INTO public.user_badges (user_id, badge_id, earned_at)
SELECT DISTINCT
    p.user_id,
    b.id,
    NOW() - INTERVAL '1 day' * FLOOR(RANDOM() * 30)
FROM public.profiles p
JOIN public.badges b ON b.category = 'milestone'
WHERE p.total_points >= (b.requirement->>'min_points')::int
ON CONFLICT DO NOTHING;

-- =============================================
-- FIN DU SCRIPT DE SEED
-- =============================================

-- Afficher les statistiques
SELECT 'Données insérées avec succès !' AS message;
SELECT COUNT(*) AS nb_profiles FROM public.profiles;
SELECT COUNT(*) AS nb_questions FROM public.questions;
SELECT COUNT(*) AS nb_sessions FROM public.sessions;
SELECT COUNT(*) AS nb_daily_challenges FROM public.daily_challenges;
SELECT COUNT(*) AS nb_rankings FROM public.rankings;