-- Seed data pour CasqueEnMain
-- Questions de test avec différents thèmes et niveaux de difficulté

-- Supprimer les données existantes
DELETE FROM questions WHERE theme_name IN ('Incendie', 'Secourisme', 'Diverse');

-- Questions Incendie (10 questions)
INSERT INTO questions (question_text, question_type, theme_name, difficulty, correct_answer, options, explanation, created_at) VALUES
-- QCU Facile
('Quelle est la classe de feu pour les liquides inflammables ?', 'QCU', 'Incendie', 1, 'Classe B', 
 '["Classe A", "Classe B", "Classe C", "Classe D"]',
 'Les feux de classe B concernent les liquides inflammables comme l''essence, l''huile, les solvants. Ils nécessitent des extincteurs à mousse ou CO2.', NOW()),

-- QCM Facile
('Quels sont les éléments du triangle du feu ? (Plusieurs réponses)', 'QCM', 'Incendie', 1, '["Combustible", "Comburant", "Chaleur"]',
 '["Combustible", "Comburant", "Chaleur", "Pression", "Électricité"]',
 'Le triangle du feu est composé de trois éléments essentiels : le combustible (matière qui brûle), le comburant (oxygène), et la chaleur (énergie d''activation).', NOW()),

-- QCU Moyen
('Quel est le débit d''une lance de 45mm sous 6 bars ?', 'QCU', 'Incendie', 2, '500 L/min',
 '["250 L/min", "500 L/min", "750 L/min", "1000 L/min"]',
 'Une lance de 45mm sous une pression de 6 bars débite environ 500 litres par minute. Cette connaissance est essentielle pour calculer l''autonomie.', NOW()),

-- QCM Moyen
('Quels sont les types d''extinction possibles ? (Plusieurs réponses)', 'QCM', 'Incendie', 2, '["Refroidissement", "Étouffement", "Inhibition", "Dispersion"]',
 '["Refroidissement", "Étouffement", "Inhibition", "Dispersion", "Compression"]',
 'Les 4 modes d''extinction sont : refroidissement (eau), étouffement (mousse/CO2), inhibition (poudre), et dispersion/dilution du combustible.', NOW()),

-- QCU Difficile
('Quelle est la température d''auto-inflammation du gasoil ?', 'QCU', 'Incendie', 3, '250°C',
 '["150°C", "200°C", "250°C", "350°C"]',
 'Le gasoil s''enflamme spontanément à partir de 250°C environ, sans source d''ignition externe. Cette donnée est importante pour évaluer les risques.', NOW()),

-- QCM Difficile
('Dans le phénomène de flashover, quels signes précurseurs observer ? (Plusieurs réponses)', 'QCM', 'Incendie', 3, 
 '["Roll-over", "Pyrolyse intense", "Fumées denses et noires", "Chaleur rayonnante intense"]',
 '["Roll-over", "Pyrolyse intense", "Fumées denses et noires", "Chaleur rayonnante intense", "Baisse de température"]',
 'Le flashover est précédé de signes : roll-over (flammes au plafond), pyrolyse des matériaux, fumées denses et chaleur intense. La reconnaissance de ces signes peut sauver des vies.', NOW()),

-- QCU Expert
('Quel est le rapport stœchiométrique idéal pour la combustion du méthane ?', 'QCU', 'Incendie', 3, '9.5:1',
 '["5:1", "7.5:1", "9.5:1", "12:1"]',
 'Le méthane (CH4) nécessite 9.5 volumes d''air pour 1 volume de gaz pour une combustion complète. Ce rapport est crucial pour comprendre les explosions.', NOW()),

-- QCM Moyen
('Quels EPI sont obligatoires en intervention feu ? (Plusieurs réponses)', 'QCM', 'Incendie', 2,
 '["Casque F1", "Veste de feu", "ARI", "Gants", "Bottes"]',
 '["Casque F1", "Veste de feu", "ARI", "Gants", "Bottes", "Lampe"]',
 'Les EPI obligatoires en intervention feu comprennent : casque F1, veste et pantalon de feu, ARI (Appareil Respiratoire Isolant), gants ignifugés et bottes de sécurité.', NOW()),

-- QCU Facile
('Quelle est la couleur de l''extincteur à poudre ?', 'QCU', 'Incendie', 1, 'Bleu',
 '["Rouge", "Bleu", "Jaune", "Vert"]',
 'Les extincteurs à poudre sont identifiés par une bande bleue. Rouge = eau, Jaune = mousse, Vert = eau + additif.', NOW()),

-- QCU Moyen
('Quel est le temps d''autonomie d''un ARI de 6L à 300 bars pour une consommation de 60L/min ?', 'QCU', 'Incendie', 2, '30 minutes',
 '["20 minutes", "25 minutes", "30 minutes", "35 minutes"]',
 'Calcul : (6L × 300 bars) / 60L/min = 1800/60 = 30 minutes. Il faut toujours prévoir une marge de sécurité.', NOW()),

-- Questions Secourisme (10 questions)
('Quel est le rythme de compression thoracique en RCP adulte ?', 'QCU', 'Secourisme', 1, '100-120/min',
 '["60-80/min", "80-100/min", "100-120/min", "120-140/min"]',
 'Le rythme recommandé est de 100 à 120 compressions par minute, avec une profondeur de 5-6 cm chez l''adulte.', NOW()),

('Quels sont les signes d''un AVC ? (Plusieurs réponses)', 'QCM', 'Secourisme', 2,
 '["Paralysie faciale", "Trouble de la parole", "Faiblesse d''un membre", "Troubles visuels"]',
 '["Paralysie faciale", "Trouble de la parole", "Faiblesse d''un membre", "Troubles visuels", "Fièvre"]',
 'L''AVC se manifeste par : paralysie faciale, troubles de la parole, faiblesse/paralysie d''un côté, troubles visuels. Méthode FAST : Face, Arms, Speech, Time.', NOW()),

('Quelle est la position d''attente pour une femme enceinte inconsciente qui respire ?', 'QCU', 'Secourisme', 2, 'PLS côté gauche',
 '["PLS côté droit", "PLS côté gauche", "Demi-assise", "Allongée sur le dos"]',
 'La PLS côté gauche évite la compression de la veine cave inférieure par l''utérus, maintenant ainsi le retour veineux.', NOW()),

('Quels sont les critères de gravité d''une brûlure ? (Plusieurs réponses)', 'QCM', 'Secourisme', 3,
 '["Surface > 10%", "Localisation (face, mains)", "Profondeur (2e/3e degré)", "Âge de la victime", "Origine électrique"]',
 '["Surface > 10%", "Localisation (face, mains)", "Profondeur (2e/3e degré)", "Âge de la victime", "Origine électrique", "Douleur intense"]',
 'Les critères de gravité incluent : surface étendue, localisation sensible, profondeur, âges extrêmes, et origine (électrique/chimique). La douleur n''est pas un critère (les brûlures profondes sont indolores).', NOW()),

('Quel est le rapport compression/ventilation en RCP pédiatrique à 2 secouristes ?', 'QCU', 'Secourisme', 3, '15:2',
 '["30:2", "15:2", "5:1", "10:2"]',
 'En RCP pédiatrique à 2 secouristes, le rapport est 15:2. À 1 secouriste, on reste sur 30:2 comme chez l''adulte.', NOW()),

('Quels sont les signes d''un pneumothorax sous tension ? (Plusieurs réponses)', 'QCM', 'Secourisme', 3,
 '["Détresse respiratoire", "Déviation trachéale", "Turgescence jugulaire", "Hypotension", "Emphysème sous-cutané"]',
 '["Détresse respiratoire", "Déviation trachéale", "Turgescence jugulaire", "Hypotension", "Emphysème sous-cutané", "Bradycardie"]',
 'Le pneumothorax sous tension provoque : détresse respiratoire, déviation trachéale controlatérale, turgescence jugulaire, hypotension (par diminution du retour veineux), emphysème sous-cutané. La tachycardie est présente, pas la bradycardie.', NOW()),

('Quelle est la dose d''adrénaline en cas d''arrêt cardiaque chez l''adulte ?', 'QCU', 'Secourisme', 3, '1mg IV/IO toutes les 3-5 min',
 '["0.5mg toutes les 2 min", "1mg toutes les 3-5 min", "2mg toutes les 5 min", "5mg en une fois"]',
 'La dose standard est 1mg IV/IO toutes les 3-5 minutes pendant la RCP. En intra-trachéal, la dose est doublée ou triplée.', NOW()),

('Que faire en premier face à une hémorragie externe ?', 'QCU', 'Secourisme', 1, 'Compression directe',
 '["Garrot", "Compression directe", "Point de compression", "Pansement compressif"]',
 'La compression directe est le premier geste. Le garrot n''est utilisé qu''en cas d''échec ou d''impossibilité de compression directe.', NOW()),

('Quels sont les signes d''une hypothermie sévère ? (Plusieurs réponses)', 'QCM', 'Secourisme', 2,
 '["T° < 28°C", "Absence de frissons", "Troubles de conscience", "Bradycardie", "Rigidité musculaire"]',
 '["T° < 28°C", "Absence de frissons", "Troubles de conscience", "Bradycardie", "Rigidité musculaire", "Hyperventilation"]',
 'L''hypothermie sévère (< 28°C) se caractérise par : arrêt des frissons, troubles de conscience, bradycardie, rigidité. L''hypoventilation est présente, pas l''hyperventilation.', NOW()),

('Quel est le score de Glasgow minimum ?', 'QCU', 'Secourisme', 1, '3',
 '["0", "1", "3", "5"]',
 'Le score de Glasgow va de 3 (coma profond) à 15 (conscience normale). Il évalue : ouverture des yeux (1-4), réponse verbale (1-5), réponse motrice (1-6).', NOW()),

-- Questions Diverses (10 questions)
('Quelle est la hiérarchie des grades pompiers après Sergent ?', 'QCU', 'Diverse', 1, 'Sergent-chef',
 '["Adjudant", "Sergent-chef", "Major", "Lieutenant"]',
 'La progression est : Sergent → Sergent-chef → Adjudant → Adjudant-chef → Lieutenant → Capitaine → Commandant → Lieutenant-colonel → Colonel.', NOW()),

('Quels sont les principes du commandement ? (Plusieurs réponses)', 'QCM', 'Diverse', 2,
 '["Prévoir", "Organiser", "Commander", "Coordonner", "Contrôler"]',
 '["Prévoir", "Organiser", "Commander", "Coordonner", "Contrôler", "Sanctionner"]',
 'Les 5 principes du commandement (POCCC) sont : Prévoir, Organiser, Commander, Coordonner, Contrôler. Sanctionner n''en fait pas partie.', NOW()),

('Quel est le délai légal de départ pour un VSAV en prompt secours ?', 'QCU', 'Diverse', 2, '1 minute',
 '["30 secondes", "1 minute", "2 minutes", "3 minutes"]',
 'Le délai réglementaire de départ est de 1 minute en journée et 3 minutes la nuit pour un prompt secours.', NOW()),

('Quels sont les composants d''un message radio ? (Plusieurs réponses)', 'QCM', 'Diverse', 1,
 '["Indicatif appelé", "Indicatif appelant", "Message", "Accusé réception"]',
 '["Indicatif appelé", "Indicatif appelant", "Message", "Accusé réception", "Heure"]',
 'Un message radio comprend : indicatif appelé, indicatif appelant, le message, et se termine par l''accusé de réception. L''heure n''est pas systématique.', NOW()),

('Quelle est la capacité d''un FPT ?', 'QCU', 'Diverse', 1, '3000-4000 L',
 '["1000-2000 L", "2000-3000 L", "3000-4000 L", "5000-6000 L"]',
 'Un FPT (Fourgon Pompe Tonne) a généralement une capacité de 3000 à 4000 litres d''eau et 200-400 litres d''émulseur.', NOW()),

('Quels sont les éléments d''une MGO ? (Plusieurs réponses)', 'QCM', 'Diverse', 2,
 '["Sauvetages", "Établissements", "Alimentations", "Reconnaissances", "Commandement"]',
 '["Sauvetages", "Établissements", "Alimentations", "Reconnaissances", "Commandement", "Déblai"]',
 'La MGO (Marche Générale des Opérations) comprend : SERAC - Sauvetages, Établissements, Reconnaissances, Alimentations, Commandement. Le déblai intervient après.', NOW()),

('Quelle est la pression de service d''une bouteille ARI ?', 'QCU', 'Diverse', 1, '300 bars',
 '["200 bars", "250 bars", "300 bars", "350 bars"]',
 'Les bouteilles ARI sont gonflées à 300 bars. Le signal sonore se déclenche vers 50-60 bars.', NOW()),

('Quels sont les types de garde en caserne ? (Plusieurs réponses)', 'QCM', 'Diverse', 1,
 '["Garde de 12h", "Garde de 24h", "Astreinte"]',
 '["Garde de 12h", "Garde de 24h", "Astreinte", "Garde de 48h", "Permanence"]',
 'Les types courants sont : garde de 12h (jour/nuit), garde de 24h, et astreinte à domicile. Les gardes de 48h n''existent plus.', NOW()),

('Quel est le numéro d''urgence européen ?', 'QCU', 'Diverse', 1, '112',
 '["15", "18", "112", "911"]',
 'Le 112 est le numéro d''urgence européen, accessible gratuitement dans tous les pays de l''UE. Il redirige vers les services appropriés.', NOW()),

('Quels sont les risques NRBC ? (Plusieurs réponses)', 'QCM', 'Diverse', 2,
 '["Nucléaire", "Radiologique", "Biologique", "Chimique"]',
 '["Nucléaire", "Radiologique", "Biologique", "Chimique", "Bactériologique"]',
 'NRBC signifie : Nucléaire, Radiologique, Biologique, Chimique. Le bactériologique est inclus dans le biologique.', NOW());

-- Créer quelques statistiques de test pour les utilisateurs existants
-- Cette partie sera exécutée uniquement si des utilisateurs existent déjà