-- Exemple de données pour le mode examen
-- À exécuter après la migration create_exam_mode.sql

-- Insertion d'une annale d'exemple
INSERT INTO exams (id, title, description, year, exam_date, duration_minutes, max_questions, passing_score, is_active, is_practice_mode)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 
   'Concours Externe 2024 - Session 1', 
   'Première session du concours externe de sapeur-pompier professionnel',
   2024, 
   '2024-03-15', 
   60, 
   20, 
   10.0, 
   true, 
   false),
  ('22222222-2222-2222-2222-222222222222', 
   'Examen Blanc - Entraînement', 
   'Examen d''entraînement non comptabilisé dans le classement officiel',
   2024, 
   '2024-01-10', 
   60, 
   20, 
   10.0, 
   true, 
   true);

-- Problème 1 : Mathématiques
INSERT INTO exam_problems (id, exam_id, title, context, order_index, points)
VALUES 
  ('33333333-3333-3333-3333-333333333333',
   '11111111-1111-1111-1111-111111111111',
   'Calculs de débit',
   'Une motopompe débite 1500 litres par minute. Elle alimente une lance qui consomme 500 litres par minute et remplit simultanément une citerne.',
   1,
   4.0);

-- Questions du problème 1
INSERT INTO exam_questions (id, problem_id, question_text, explanation, order_index, points)
VALUES 
  ('44444444-4444-4444-4444-444444444444',
   '33333333-3333-3333-3333-333333333333',
   'Quel est le débit disponible pour remplir la citerne ?',
   'Le débit disponible est la différence entre le débit de la motopompe et la consommation de la lance : 1500 - 500 = 1000 L/min',
   1,
   1.0),
  ('55555555-5555-5555-5555-555555555555',
   '33333333-3333-3333-3333-333333333333',
   'Combien de temps faut-il pour remplir une citerne de 10 000 litres ?',
   'Temps = Volume / Débit = 10 000 / 1000 = 10 minutes',
   2,
   1.0);

-- Options pour la question 1
INSERT INTO exam_question_options (question_id, option_text, is_correct, order_index)
VALUES 
  ('44444444-4444-4444-4444-444444444444', '500 L/min', false, 1),
  ('44444444-4444-4444-4444-444444444444', '1000 L/min', true, 2),
  ('44444444-4444-4444-4444-444444444444', '1500 L/min', false, 3),
  ('44444444-4444-4444-4444-444444444444', '2000 L/min', false, 4);

-- Options pour la question 2
INSERT INTO exam_question_options (question_id, option_text, is_correct, order_index)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '5 minutes', false, 1),
  ('55555555-5555-5555-5555-555555555555', '10 minutes', true, 2),
  ('55555555-5555-5555-5555-555555555555', '15 minutes', false, 3),
  ('55555555-5555-5555-5555-555555555555', '20 minutes', false, 4);

-- Problème 2 : Français
INSERT INTO exam_problems (id, exam_id, title, context, order_index, points)
VALUES 
  ('66666666-6666-6666-6666-666666666666',
   '11111111-1111-1111-1111-111111111111',
   'Compréhension de texte',
   'Le sapeur-pompier doit posséder des qualités physiques et morales exceptionnelles. Il doit faire preuve de courage, de dévouement et d''altruisme dans l''exercice de ses missions.',
   2,
   3.0);

-- Questions du problème 2
INSERT INTO exam_questions (id, problem_id, question_text, explanation, order_index, points)
VALUES 
  ('77777777-7777-7777-7777-777777777777',
   '66666666-6666-6666-6666-666666666666',
   'Quelle qualité n''est PAS mentionnée dans le texte ?',
   'La patience n''est pas mentionnée dans le texte, contrairement au courage, au dévouement et à l''altruisme.',
   1,
   1.0);

-- Options pour la question du problème 2
INSERT INTO exam_question_options (question_id, option_text, is_correct, order_index)
VALUES 
  ('77777777-7777-7777-7777-777777777777', 'Le courage', false, 1),
  ('77777777-7777-7777-7777-777777777777', 'La patience', true, 2),
  ('77777777-7777-7777-7777-777777777777', 'Le dévouement', false, 3),
  ('77777777-7777-7777-7777-777777777777', 'L''altruisme', false, 4);

-- Problème 3 : Connaissances métier
INSERT INTO exam_problems (id, exam_id, title, context, order_index, points)
VALUES 
  ('88888888-8888-8888-8888-888888888888',
   '11111111-1111-1111-1111-111111111111',
   'Grades et hiérarchie',
   'La hiérarchie des sapeurs-pompiers professionnels est organisée en différents grades et échelons.',
   3,
   2.0);

-- Questions du problème 3
INSERT INTO exam_questions (id, problem_id, question_text, explanation, order_index, points)
VALUES 
  ('99999999-9999-9999-9999-999999999999',
   '88888888-8888-8888-8888-888888888888',
   'Quel est le premier grade d''officier chez les sapeurs-pompiers professionnels ?',
   'Le lieutenant est le premier grade d''officier dans la hiérarchie des sapeurs-pompiers professionnels.',
   1,
   1.0);

-- Options pour la question du problème 3
INSERT INTO exam_question_options (question_id, option_text, is_correct, order_index)
VALUES 
  ('99999999-9999-9999-9999-999999999999', 'Sergent', false, 1),
  ('99999999-9999-9999-9999-999999999999', 'Adjudant', false, 2),
  ('99999999-9999-9999-9999-999999999999', 'Lieutenant', true, 3),
  ('99999999-9999-9999-9999-999999999999', 'Capitaine', false, 4);

-- Ajout de quelques sessions et classements d'exemple (optionnel)
-- Ces données simulent des participations précédentes pour avoir un classement

-- Note : Remplacer les user_id par des vrais IDs d'utilisateurs existants
-- INSERT INTO exam_sessions (exam_id, user_id, status, score, max_score, percentage, duration_seconds, completed_at)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'user_id_1', 'completed', 15.5, 20, 77.5, 3200, NOW() - INTERVAL '1 day'),
--   ('11111111-1111-1111-1111-111111111111', 'user_id_2', 'completed', 12.0, 20, 60.0, 3500, NOW() - INTERVAL '2 days'),
--   ('11111111-1111-1111-1111-111111111111', 'user_id_3', 'completed', 18.0, 20, 90.0, 2900, NOW() - INTERVAL '3 days');