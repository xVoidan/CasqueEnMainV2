#!/usr/bin/env node

/**
 * Script de seed pour la base de données CasqueEnMain
 * Crée des utilisateurs de test et insère des données d'exemple
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Charger les variables d'environnement
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  console.error('Assurez-vous d\'avoir EXPO_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans votre .env');
  process.exit(1);
}

// Client Supabase avec la clé service (admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Interface pour les questions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

// Utilisateurs de test
const TEST_USERS = [
  {
    email: 'commandant@test.com',
    password: 'Test123!',
    profile: {
      username: 'CommandantDupont',
      department: '75 - Paris',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
      total_points: 45000,
      current_grade: 14,
      streak_days: 127
    }
  },
  {
    email: 'capitaine@test.com',
    password: 'Test123!',
    profile: {
      username: 'CapitaineLegrand',
      department: '13 - Bouches-du-Rhône',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
      total_points: 28500,
      current_grade: 12,
      streak_days: 45
    }
  },
  {
    email: 'lieutenant@test.com',
    password: 'Test123!',
    profile: {
      username: 'LieutenantMartin',
      department: '69 - Rhône',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
      total_points: 18750,
      current_grade: 11,
      streak_days: 23
    }
  },
  {
    email: 'adjudant@test.com',
    password: 'Test123!',
    profile: {
      username: 'AdjudantRousseau',
      department: '59 - Nord',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
      total_points: 8500,
      current_grade: 9,
      streak_days: 12
    }
  },
  {
    email: 'sergent.chef@test.com',
    password: 'Test123!',
    profile: {
      username: 'SergentChefBernard',
      department: '33 - Gironde',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
      total_points: 4200,
      current_grade: 7,
      streak_days: 7
    }
  },
  {
    email: 'sergent@test.com',
    password: 'Test123!',
    profile: {
      username: 'SergentDubois',
      department: '06 - Alpes-Maritimes',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6',
      total_points: 2800,
      current_grade: 6,
      streak_days: 3
    }
  },
  {
    email: 'caporal.chef@test.com',
    password: 'Test123!',
    profile: {
      username: 'CaporalChefMoreau',
      department: '67 - Bas-Rhin',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7',
      total_points: 1500,
      current_grade: 5,
      streak_days: 15
    }
  },
  {
    email: 'caporal@test.com',
    password: 'Test123!',
    profile: {
      username: 'CaporalLaurent',
      department: '31 - Haute-Garonne',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8',
      total_points: 750,
      current_grade: 4,
      streak_days: 2
    }
  },
  {
    email: 'sapeur1@test.com',
    password: 'Test123!',
    profile: {
      username: 'Sapeur1Garcia',
      department: '44 - Loire-Atlantique',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9',
      total_points: 350,
      current_grade: 3,
      streak_days: 1
    }
  },
  {
    email: 'sapeur2@test.com',
    password: 'Test123!',
    profile: {
      username: 'Sapeur2Martinez',
      department: '34 - Hérault',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10',
      total_points: 180,
      current_grade: 2,
      streak_days: 0
    }
  },
  {
    email: 'aspirant1@test.com',
    password: 'Test123!',
    profile: {
      username: 'AspirantThomas',
      department: '38 - Isère',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=11',
      total_points: 50,
      current_grade: 1,
      streak_days: 1
    }
  },
  {
    email: 'aspirant2@test.com',
    password: 'Test123!',
    profile: {
      username: 'AspirantRobert',
      department: '21 - Côte-d\'Or',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=12',
      total_points: 25,
      current_grade: 1,
      streak_days: 0
    }
  }
];

// Questions complètes avec réponses
const QUESTIONS_DATA = [
  // Mathématiques - Géométrie
  {
    theme: 'Mathématiques',
    sub_theme: 'Géométrie',
    question_text: 'Quelle est la formule pour calculer l\'aire d\'un cercle ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'L\'aire d\'un cercle se calcule avec la formule A = πr² où r est le rayon du cercle.',
    difficulty: 1,
    answers: [
      { id: 'a', text: 'πr²', isCorrect: true },
      { id: 'b', text: '2πr', isCorrect: false },
      { id: 'c', text: 'πd', isCorrect: false },
      { id: 'd', text: 'r²/π', isCorrect: false }
    ]
  },
  {
    theme: 'Mathématiques',
    sub_theme: 'Géométrie',
    question_text: 'Quel est le périmètre d\'un rectangle de longueur 8m et de largeur 5m ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Le périmètre d\'un rectangle se calcule avec P = 2(L + l) = 2(8 + 5) = 26m',
    difficulty: 1,
    answers: [
      { id: 'a', text: '18m', isCorrect: false },
      { id: 'b', text: '26m', isCorrect: true },
      { id: 'c', text: '40m', isCorrect: false },
      { id: 'd', text: '13m', isCorrect: false }
    ]
  },
  {
    theme: 'Mathématiques',
    sub_theme: 'Géométrie',
    question_text: 'Combien de côtés possède un hexagone ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Un hexagone possède 6 côtés. Le préfixe "hexa" signifie six en grec.',
    difficulty: 1,
    answers: [
      { id: 'a', text: '4', isCorrect: false },
      { id: 'b', text: '5', isCorrect: false },
      { id: 'c', text: '6', isCorrect: true },
      { id: 'd', text: '8', isCorrect: false }
    ]
  },
  // Mathématiques - Pourcentages
  {
    theme: 'Mathématiques',
    sub_theme: 'Pourcentages',
    question_text: 'Un article coûte 80€. Il est soldé à -25%. Quel est son nouveau prix ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Réduction = 80 × 0,25 = 20€. Nouveau prix = 80 - 20 = 60€',
    difficulty: 1,
    answers: [
      { id: 'a', text: '60€', isCorrect: true },
      { id: 'b', text: '55€', isCorrect: false },
      { id: 'c', text: '65€', isCorrect: false },
      { id: 'd', text: '70€', isCorrect: false }
    ]
  },
  {
    theme: 'Mathématiques',
    sub_theme: 'Pourcentages',
    question_text: 'Sur 120 candidats, 90 ont réussi l\'examen. Quel est le taux de réussite ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Taux = (90 / 120) × 100 = 75%',
    difficulty: 2,
    answers: [
      { id: 'a', text: '70%', isCorrect: false },
      { id: 'b', text: '75%', isCorrect: true },
      { id: 'c', text: '80%', isCorrect: false },
      { id: 'd', text: '85%', isCorrect: false }
    ]
  },
  {
    theme: 'Mathématiques',
    sub_theme: 'Pourcentages',
    question_text: 'Une entreprise augmente ses prix de 10%. De quel pourcentage doit-elle les baisser pour revenir au prix initial ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Si un prix augmente de 10%, il faut le baisser de 9,09% pour revenir au prix initial (100/110 ≈ 0,9091)',
    difficulty: 3,
    answers: [
      { id: 'a', text: '10%', isCorrect: false },
      { id: 'b', text: '9,09%', isCorrect: true },
      { id: 'c', text: '11%', isCorrect: false },
      { id: 'd', text: '9%', isCorrect: false }
    ]
  },
  // Mathématiques - Fractions
  {
    theme: 'Mathématiques',
    sub_theme: 'Fractions',
    question_text: 'Quelle est la somme de 3/4 et 1/2 ?',
    question_type: 'QCU',
    type: 'single',
    explanation: '3/4 + 1/2 = 3/4 + 2/4 = 5/4',
    difficulty: 2,
    answers: [
      { id: 'a', text: '5/4', isCorrect: true },
      { id: 'b', text: '4/6', isCorrect: false },
      { id: 'c', text: '1', isCorrect: false },
      { id: 'd', text: '3/2', isCorrect: false }
    ]
  },
  {
    theme: 'Mathématiques',
    sub_theme: 'Fractions',
    question_text: 'Simplifiez la fraction 18/24',
    question_type: 'QCU',
    type: 'single',
    explanation: '18/24 = (18÷6)/(24÷6) = 3/4',
    difficulty: 1,
    answers: [
      { id: 'a', text: '3/4', isCorrect: true },
      { id: 'b', text: '9/12', isCorrect: false },
      { id: 'c', text: '2/3', isCorrect: false },
      { id: 'd', text: '6/8', isCorrect: false }
    ]
  },
  // Français - Grammaire
  {
    theme: 'Français',
    sub_theme: 'Grammaire',
    question_text: 'Quel est le participe passé du verbe "acquérir" ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Le participe passé du verbe "acquérir" est "acquis" (acquise au féminin).',
    difficulty: 2,
    answers: [
      { id: 'a', text: 'Acquis', isCorrect: true },
      { id: 'b', text: 'Acquéri', isCorrect: false },
      { id: 'c', text: 'Acquiert', isCorrect: false },
      { id: 'd', text: 'Acqueru', isCorrect: false }
    ]
  },
  {
    theme: 'Français',
    sub_theme: 'Grammaire',
    question_text: 'Quel est le pluriel de "un cheval" ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Le pluriel de "cheval" est "chevaux" (pluriel irrégulier en -aux).',
    difficulty: 1,
    answers: [
      { id: 'a', text: 'Chevals', isCorrect: false },
      { id: 'b', text: 'Chevaux', isCorrect: true },
      { id: 'c', text: 'Chevaus', isCorrect: false },
      { id: 'd', text: 'Cheval', isCorrect: false }
    ]
  },
  // Français - Culture générale
  {
    theme: 'Français',
    sub_theme: 'Culture générale',
    question_text: 'Qui a écrit "Les Misérables" ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Victor Hugo est l\'auteur des Misérables, publié en 1862.',
    difficulty: 1,
    answers: [
      { id: 'a', text: 'Victor Hugo', isCorrect: true },
      { id: 'b', text: 'Émile Zola', isCorrect: false },
      { id: 'c', text: 'Alexandre Dumas', isCorrect: false },
      { id: 'd', text: 'Honoré de Balzac', isCorrect: false }
    ]
  },
  // Métier - Culture administrative
  {
    theme: 'Métier',
    sub_theme: 'Culture administrative',
    question_text: 'Que signifie SDIS ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'SDIS signifie Service Départemental d\'Incendie et de Secours.',
    difficulty: 1,
    answers: [
      { id: 'a', text: 'Service Départemental d\'Incendie et de Secours', isCorrect: true },
      { id: 'b', text: 'Syndicat Départemental d\'Intervention et de Sauvetage', isCorrect: false },
      { id: 'c', text: 'Service de Défense Incendie et Secours', isCorrect: false },
      { id: 'd', text: 'Système Départemental d\'Intervention Sécurisée', isCorrect: false }
    ]
  },
  {
    theme: 'Métier',
    sub_theme: 'Culture administrative',
    question_text: 'Quel est le numéro d\'urgence européen ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Le 112 est le numéro d\'urgence européen valable dans tous les pays de l\'UE.',
    difficulty: 1,
    answers: [
      { id: 'a', text: '15', isCorrect: false },
      { id: 'b', text: '18', isCorrect: false },
      { id: 'c', text: '112', isCorrect: true },
      { id: 'd', text: '17', isCorrect: false }
    ]
  },
  // Métier - Techniques opérationnelles (QCM)
  {
    theme: 'Métier',
    sub_theme: 'Techniques opérationnelles',
    question_text: 'Quels sont les éléments du triangle du feu ?',
    question_type: 'QCM',
    type: 'multiple',
    explanation: 'Le triangle du feu comprend : combustible, comburant (oxygène) et énergie d\'activation (chaleur).',
    difficulty: 1,
    answers: [
      { id: 'a', text: 'Combustible', isCorrect: true },
      { id: 'b', text: 'Comburant (oxygène)', isCorrect: true },
      { id: 'c', text: 'Énergie d\'activation', isCorrect: true },
      { id: 'd', text: 'Eau', isCorrect: false }
    ]
  },
  // Métier - Secours à personne
  {
    theme: 'Métier',
    sub_theme: 'Secours à personne',
    question_text: 'Quelle est la fréquence des compressions thoraciques lors d\'un massage cardiaque ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Les compressions doivent être effectuées à une fréquence de 100 à 120 par minute.',
    difficulty: 1,
    answers: [
      { id: 'a', text: '100 à 120 par minute', isCorrect: true },
      { id: 'b', text: '60 à 80 par minute', isCorrect: false },
      { id: 'c', text: '140 à 160 par minute', isCorrect: false },
      { id: 'd', text: '80 à 100 par minute', isCorrect: false }
    ]
  },
  {
    theme: 'Métier',
    sub_theme: 'Secours à personne',
    question_text: 'Que signifie PLS ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'PLS signifie Position Latérale de Sécurité.',
    difficulty: 1,
    answers: [
      { id: 'a', text: 'Position Latérale de Sécurité', isCorrect: true },
      { id: 'b', text: 'Premiers Lieux de Secours', isCorrect: false },
      { id: 'c', text: 'Plan Local de Sauvetage', isCorrect: false },
      { id: 'd', text: 'Protocole de Levage Sécurisé', isCorrect: false }
    ]
  },
  // Métier - Matériel et équipements
  {
    theme: 'Métier',
    sub_theme: 'Matériel et équipements',
    question_text: 'Quelle est la capacité d\'une bouteille ARI standard ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Une bouteille ARI standard a une capacité de 6,8 litres à 300 bars.',
    difficulty: 2,
    answers: [
      { id: 'a', text: '6,8 litres à 300 bars', isCorrect: true },
      { id: 'b', text: '9 litres à 200 bars', isCorrect: false },
      { id: 'c', text: '6 litres à 350 bars', isCorrect: false },
      { id: 'd', text: '7 litres à 250 bars', isCorrect: false }
    ]
  },
  {
    theme: 'Métier',
    sub_theme: 'Matériel et équipements',
    question_text: 'Quels sont les différents types de lances incendie ?',
    question_type: 'QCM',
    type: 'multiple',
    explanation: 'Les principaux types sont : lance à main, lance queue de paon, lance canon et lance monitor.',
    difficulty: 2,
    answers: [
      { id: 'a', text: 'Lance à main', isCorrect: true },
      { id: 'b', text: 'Lance queue de paon', isCorrect: true },
      { id: 'c', text: 'Lance canon', isCorrect: true },
      { id: 'd', text: 'Lance thermique', isCorrect: false }
    ]
  },
  // Métier - Hydraulique
  {
    theme: 'Métier',
    sub_theme: 'Hydraulique',
    question_text: 'Quelle est la pression normale de service d\'une motopompe ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'La pression normale de service est généralement de 8 bars.',
    difficulty: 2,
    answers: [
      { id: 'a', text: '6 bars', isCorrect: false },
      { id: 'b', text: '8 bars', isCorrect: true },
      { id: 'c', text: '10 bars', isCorrect: false },
      { id: 'd', text: '12 bars', isCorrect: false }
    ]
  },
  // Métier - Risques chimiques
  {
    theme: 'Métier',
    sub_theme: 'Risques chimiques',
    question_text: 'Que signifie l\'acronyme NRBC ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'NRBC signifie Nucléaire, Radiologique, Biologique et Chimique.',
    difficulty: 1,
    answers: [
      { id: 'a', text: 'Nucléaire, Radiologique, Biologique, Chimique', isCorrect: true },
      { id: 'b', text: 'Nouveau Règlement de Base Chimique', isCorrect: false },
      { id: 'c', text: 'Normes de Risques Biologiques et Chimiques', isCorrect: false },
      { id: 'd', text: 'Neutralisation des Risques Bactériologiques et Chimiques', isCorrect: false }
    ]
  },
  // Français - Orthographe
  {
    theme: 'Français',
    sub_theme: 'Orthographe',
    question_text: 'Quelle est la bonne orthographe ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'On écrit "quoique" en un mot quand il signifie "bien que".',
    difficulty: 2,
    answers: [
      { id: 'a', text: 'Quoiqu\'il soit tard, je continue', isCorrect: true },
      { id: 'b', text: 'Quoi qu\'il soit tard, je continue', isCorrect: false },
      { id: 'c', text: 'Quoit qu\'il soit tard, je continue', isCorrect: false },
      { id: 'd', text: 'Quoique il soit tard, je continue', isCorrect: false }
    ]
  },
  {
    theme: 'Français',
    sub_theme: 'Orthographe',
    question_text: 'Comment s\'écrit le pluriel de "garde-fou" ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Les noms composés avec "garde" prennent un "s" au deuxième élément : garde-fous.',
    difficulty: 3,
    answers: [
      { id: 'a', text: 'garde-fous', isCorrect: true },
      { id: 'b', text: 'gardes-fous', isCorrect: false },
      { id: 'c', text: 'garde-fou', isCorrect: false },
      { id: 'd', text: 'gardes-fou', isCorrect: false }
    ]
  },
  // Français - Conjugaison
  {
    theme: 'Français',
    sub_theme: 'Conjugaison',
    question_text: 'Conjuguez le verbe "résoudre" au passé simple, 3e personne du singulier.',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Le verbe résoudre au passé simple : il résolut.',
    difficulty: 3,
    answers: [
      { id: 'a', text: 'Il résolut', isCorrect: true },
      { id: 'b', text: 'Il résolva', isCorrect: false },
      { id: 'c', text: 'Il résolvit', isCorrect: false },
      { id: 'd', text: 'Il résout', isCorrect: false }
    ]
  },
  // Mathématiques - Calcul mental
  {
    theme: 'Mathématiques',
    sub_theme: 'Calcul mental',
    question_text: 'Calculez mentalement : 17 × 11',
    question_type: 'QCU',
    type: 'single',
    explanation: '17 × 11 = 17 × 10 + 17 = 170 + 17 = 187',
    difficulty: 2,
    answers: [
      { id: 'a', text: '187', isCorrect: true },
      { id: 'b', text: '177', isCorrect: false },
      { id: 'c', text: '197', isCorrect: false },
      { id: 'd', text: '167', isCorrect: false }
    ]
  },
  {
    theme: 'Mathématiques',
    sub_theme: 'Calcul mental',
    question_text: 'Quel est le carré de 15 ?',
    question_type: 'QCU',
    type: 'single',
    explanation: '15² = 225 (astuce : 15² = (10+5)² = 100 + 2×10×5 + 25 = 225)',
    difficulty: 1,
    answers: [
      { id: 'a', text: '225', isCorrect: true },
      { id: 'b', text: '215', isCorrect: false },
      { id: 'c', text: '235', isCorrect: false },
      { id: 'd', text: '125', isCorrect: false }
    ]
  },
  // Métier - Grades et hiérarchie
  {
    theme: 'Métier',
    sub_theme: 'Grades et hiérarchie',
    question_text: 'Combien y a-t-il de grades dans la hiérarchie des sapeurs-pompiers professionnels ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Il y a 15 grades dans la hiérarchie des sapeurs-pompiers professionnels.',
    difficulty: 1,
    answers: [
      { id: 'a', text: '15', isCorrect: true },
      { id: 'b', text: '12', isCorrect: false },
      { id: 'c', text: '18', isCorrect: false },
      { id: 'd', text: '10', isCorrect: false }
    ]
  },
  {
    theme: 'Métier',
    sub_theme: 'Grades et hiérarchie',
    question_text: 'Quel est le premier grade d\'officier chez les sapeurs-pompiers ?',
    question_type: 'QCU',
    type: 'single',
    explanation: 'Le premier grade d\'officier est Lieutenant de 2e classe.',
    difficulty: 2,
    answers: [
      { id: 'a', text: 'Lieutenant de 2e classe', isCorrect: true },
      { id: 'b', text: 'Sous-lieutenant', isCorrect: false },
      { id: 'c', text: 'Aspirant', isCorrect: false },
      { id: 'd', text: 'Major', isCorrect: false }
    ]
  }
];

async function createUsers() {
  console.log('\n📱 Création des utilisateurs de test...');
  const createdUsers = [];

  for (const userData of TEST_USERS) {
    try {
      // Créer l'utilisateur avec l'API Auth Admin
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          username: userData.profile.username
        }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  ${userData.email} existe déjà`);
          // Récupérer l'utilisateur existant
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === userData.email);
          if (existingUser) {
            createdUsers.push({ ...userData, id: existingUser.id });
          }
        } else {
          console.error(`❌ Erreur pour ${userData.email}:`, authError.message);
        }
      } else {
        console.log(`✅ ${userData.email} créé`);
        createdUsers.push({ ...userData, id: authData.user.id });
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${userData.email}:`, error.message);
    }
  }

  return createdUsers;
}

async function insertProfiles(users) {
  console.log('\n👤 Insertion des profils...');
  
  for (const user of users) {
    if (!user.id) continue;
    
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: user.id,
        ...user.profile
      }, { onConflict: 'user_id' });

    if (error) {
      console.error(`❌ Erreur profil ${user.profile.username}:`, error.message);
    } else {
      console.log(`✅ Profil ${user.profile.username} créé`);
    }
  }
}

async function insertQuestions() {
  console.log('\n❓ Insertion des questions...');
  
  for (const question of QUESTIONS_DATA) {
    const { error } = await supabase
      .from('questions')
      .insert({
        ...question,
        answers: JSON.stringify(question.answers),
        points: question.difficulty,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Erreur question:`, error.message);
    }
  }
  
  console.log(`✅ ${QUESTIONS_DATA.length} questions insérées`);
}

async function insertSessions(users) {
  console.log('\n📊 Création de sessions d\'exemple...');
  
  const themes = ['Mathématiques', 'Français', 'Métier'];
  const subThemes = {
    'Mathématiques': ['Géométrie', 'Pourcentages', 'Fractions', 'Calcul mental'],
    'Français': ['Grammaire', 'Orthographe', 'Conjugaison', 'Culture générale'],
    'Métier': ['Culture administrative', 'Techniques opérationnelles', 'Secours à personne', 'Matériel et équipements', 'Hydraulique', 'Risques chimiques', 'Grades et hiérarchie']
  };
  
  for (const user of users) { // Tous les utilisateurs
    if (!user.id) continue;
    
    // Créer 5-10 sessions par utilisateur
    const sessionCount = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < sessionCount; i++) {
      // Sessions réparties sur les 60 derniers jours
      const daysAgo = Math.floor(Math.random() * 60);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      startDate.setHours(Math.floor(Math.random() * 14) + 8); // Entre 8h et 22h
      startDate.setMinutes(Math.floor(Math.random() * 60));
      
      // Durée de session entre 5 et 45 minutes
      const duration = Math.floor(Math.random() * 40) + 5;
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);
      
      // Sélection aléatoire des thèmes (1 à 3 thèmes)
      const themeCount = Math.floor(Math.random() * 3) + 1;
      const selectedThemes = themes.sort(() => 0.5 - Math.random()).slice(0, themeCount);
      
      // Score basé sur le niveau de l'utilisateur
      const baseScore = 50 + (user.profile.current_grade * 3); // Plus le grade est élevé, meilleur est le score de base
      const variation = Math.floor(Math.random() * 30) - 15; // ±15 points de variation
      const score = Math.max(20, Math.min(100, baseScore + variation));
      
      // Points basés sur le score et le nombre de questions
      const questionCount = [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)];
      const points = Math.floor((score / 100) * questionCount * 3);
      
      // Ajouter quelques sessions en cours pour les utilisateurs actifs
      const isCurrentUser = i === 0 && daysAgo < 2;
      const status = isCurrentUser && Math.random() > 0.7 ? 'in_progress' : 'completed';
      
      const { error } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          config: {
            themes: selectedThemes,
            subThemes: selectedThemes.reduce((acc, theme) => {
              acc[theme] = subThemes[theme].sort(() => 0.5 - Math.random()).slice(0, 2);
              return acc;
            }, {}),
            questionCount: questionCount,
            timerEnabled: Math.random() > 0.3,
            timerDuration: [20, 30, 40, 60][Math.floor(Math.random() * 4)],
            difficulty: Math.ceil(Math.random() * 3), // 1-3
            scoring: {
              correct: 1,
              incorrect: -0.25,
              skipped: 0,
              partial: 0.5
            }
          },
          started_at: startDate.toISOString(),
          ended_at: status === 'completed' ? endDate.toISOString() : null,
          score: status === 'completed' ? score : null,
          total_points_earned: status === 'completed' ? points : 0,
          status: status
        });

      if (error) {
        console.error(`❌ Erreur session:`, error.message);
      }
    }
  }
  
  // Ajouter quelques sessions récentes (aujourd'hui et hier) pour les utilisateurs les plus actifs
  const activeUsers = users.slice(0, 3);
  for (const user of activeUsers) {
    if (!user.id) continue;
    
    // Session d'aujourd'hui
    const todaySession = new Date();
    todaySession.setHours(14, 30, 0, 0);
    
    await supabase.from('sessions').insert({
      user_id: user.id,
      config: {
        themes: ['Métier'],
        subThemes: { 'Métier': ['Secours à personne', 'Techniques opérationnelles'] },
        questionCount: 20,
        timerEnabled: true,
        timerDuration: 30,
        difficulty: 2,
        scoring: { correct: 1, incorrect: -0.25, skipped: 0, partial: 0.5 }
      },
      started_at: todaySession.toISOString(),
      ended_at: new Date(todaySession.getTime() + 25 * 60000).toISOString(),
      score: 85,
      total_points_earned: 51,
      status: 'completed'
    });
    
    // Session d'hier
    const yesterdaySession = new Date();
    yesterdaySession.setDate(yesterdaySession.getDate() - 1);
    yesterdaySession.setHours(19, 15, 0, 0);
    
    await supabase.from('sessions').insert({
      user_id: user.id,
      config: {
        themes: ['Mathématiques', 'Français'],
        subThemes: { 
          'Mathématiques': ['Pourcentages', 'Calcul mental'],
          'Français': ['Grammaire', 'Orthographe']
        },
        questionCount: 30,
        timerEnabled: false,
        difficulty: 1,
        scoring: { correct: 1, incorrect: -0.25, skipped: 0, partial: 0.5 }
      },
      started_at: yesterdaySession.toISOString(),
      ended_at: new Date(yesterdaySession.getTime() + 35 * 60000).toISOString(),
      score: 78,
      total_points_earned: 70,
      status: 'completed'
    });
  }
  
  console.log('✅ Sessions créées avec données récentes');
}

async function insertDailyChallenges() {
  console.log('\n🎯 Création des défis quotidiens...');
  
  const themes = ['Mathématiques', 'Français', 'Métier'];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const theme = themes[i % 3];
    
    // Récupérer des questions aléatoires pour ce thème
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('theme', theme)
      .limit(10);
    
    if (questions && questions.length > 0) {
      const { error } = await supabase
        .from('daily_challenges')
        .insert({
          date: date.toISOString().split('T')[0],
          theme: theme,
          questions_ids: questions.map(q => q.id),
          reward_points: 100 + (i === 0 ? 50 : 0) // Bonus aujourd'hui
        });

      if (error && !error.message.includes('duplicate')) {
        console.error(`❌ Erreur défi:`, error.message);
      }
    }
  }
  
  console.log('✅ Défis quotidiens créés');
}

async function insertRankings(users) {
  console.log('\n🏆 Création des classements...');
  
  // Trier les utilisateurs par points
  const sortedUsers = users
    .filter(u => u.id)
    .sort((a, b) => b.profile.total_points - a.profile.total_points);
  
  // Classement global
  for (let i = 0; i < sortedUsers.length; i++) {
    const user = sortedUsers[i];
    
    await supabase.from('rankings').insert({
      user_id: user.id,
      ranking_type: 'global',
      points: user.profile.total_points,
      rank: i + 1,
      period_start: '2025-01-01',
      period_end: '2025-12-31'
    });
    
    // Classement hebdomadaire
    await supabase.from('rankings').insert({
      user_id: user.id,
      ranking_type: 'weekly',
      points: Math.floor(user.profile.total_points * 0.1),
      rank: i + 1,
      period_start: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())).toISOString().split('T')[0],
      period_end: new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 6)).toISOString().split('T')[0]
    });
  }
  
  console.log('✅ Classements créés');
}

async function main() {
  console.log('🚀 Démarrage du seed de la base de données CasqueEnMain');
  console.log('================================================\n');

  const response = await question('⚠️  Cela va créer/modifier des données. Continuer ? (o/n) ');
  
  if (response.toLowerCase() !== 'o') {
    console.log('❌ Seed annulé');
    process.exit(0);
  }

  try {
    // 1. Créer les utilisateurs
    const users = await createUsers();
    
    // 2. Créer les profils
    await insertProfiles(users);
    
    // 3. Insérer les questions
    await insertQuestions();
    
    // 4. Créer des sessions
    await insertSessions(users);
    
    // 5. Créer les défis quotidiens
    await insertDailyChallenges();
    
    // 6. Créer les classements
    await insertRankings(users);
    
    console.log('\n================================================');
    console.log('✅ Seed terminé avec succès !');
    console.log('\n📧 Comptes de test créés :');
    console.log('------------------------------------------------');
    TEST_USERS.forEach(user => {
      console.log(`${user.profile.username}: ${user.email} / ${user.password}`);
    });
    console.log('------------------------------------------------');
    console.log('\n💡 Vous pouvez maintenant vous connecter avec ces comptes !');
    
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Lancer le script
main();