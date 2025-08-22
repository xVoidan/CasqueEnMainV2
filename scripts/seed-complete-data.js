#!/usr/bin/env node

/**
 * Script final pour compléter toutes les données manquantes
 * Adapté à la structure exacte de la base de données
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Récupérer les utilisateurs existants
async function getUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, username, current_grade, total_points')
    .order('total_points', { ascending: false });
  
  if (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return [];
  }
  return data;
}

// Récupérer les questions
async function getQuestions() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, theme, sub_theme, difficulty, answers');
  
  if (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    return [];
  }
  return data;
}

// Créer des sessions avec leurs réponses
async function createSessionsWithAnswers(users, questions) {
  console.log('\n📊 Création des sessions avec réponses...');
  
  const themes = ['Mathématiques', 'Français', 'Métier'];
  let sessionsCreated = 0;
  let answersCreated = 0;
  
  for (const user of users) {
    // 2-5 sessions par utilisateur
    const sessionCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < sessionCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      startDate.setHours(Math.floor(Math.random() * 12) + 8);
      
      const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
      const themeQuestions = questions.filter(q => q.theme === selectedTheme);
      
      if (themeQuestions.length === 0) continue;
      
      // Sélectionner 5-15 questions
      const questionCount = Math.floor(Math.random() * 11) + 5;
      const selectedQuestions = themeQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(questionCount, themeQuestions.length));
      
      const duration = Math.floor(Math.random() * 20) + 10; // 10-30 minutes
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);
      
      // Score basé sur le grade
      const baseScore = 50 + (user.current_grade * 2);
      const variation = Math.floor(Math.random() * 20) - 10;
      const score = Math.max(30, Math.min(95, baseScore + variation));
      const correctCount = Math.floor((score / 100) * selectedQuestions.length);
      
      // Créer la session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.user_id,
          config: {
            themes: [selectedTheme],
            questionCount: selectedQuestions.length,
            timerEnabled: Math.random() > 0.3,
            timerDuration: 30,
            difficulty: Math.ceil(Math.random() * 3),
            scoring: {
              correct: 1,
              incorrect: -0.25,
              skipped: 0,
              partial: 0.5
            }
          },
          started_at: startDate.toISOString(),
          ended_at: endDate.toISOString(),
          score: score,
          total_points_earned: Math.floor(score * selectedQuestions.length / 10),
          status: 'completed'
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('Erreur session:', sessionError.message);
        continue;
      }
      
      sessionsCreated++;
      
      // Créer les réponses pour cette session
      const answers = [];
      for (let j = 0; j < selectedQuestions.length; j++) {
        const question = selectedQuestions[j];
        const isCorrect = j < correctCount;
        const timeTaken = Math.floor(Math.random() * 45) + 15; // 15-60 secondes
        
        // Extraire les réponses possibles
        let selectedAnswer = 'a';
        if (question.answers && Array.isArray(question.answers)) {
          const correctAnswers = question.answers
            .filter(a => a.isCorrect)
            .map(a => a.id);
          const incorrectAnswers = question.answers
            .filter(a => !a.isCorrect)
            .map(a => a.id);
          
          selectedAnswer = isCorrect && correctAnswers.length > 0 
            ? correctAnswers[0] 
            : incorrectAnswers[Math.floor(Math.random() * incorrectAnswers.length)] || 'b';
        }
        
        answers.push({
          session_id: session.id,
          question_id: question.id,
          selected_answers: [selectedAnswer], // Format tableau
          is_correct: isCorrect,
          is_partial: false,
          time_taken: timeTaken,
          points_earned: isCorrect ? question.difficulty || 1 : 0
        });
      }
      
      // Insérer les réponses
      if (answers.length > 0) {
        const { error: answersError } = await supabase
          .from('session_answers')
          .insert(answers);
        
        if (answersError) {
          console.error('Erreur réponses:', answersError.message);
        } else {
          answersCreated += answers.length;
        }
      }
    }
  }
  
  console.log(`✅ ${sessionsCreated} sessions créées avec ${answersCreated} réponses`);
}

// Créer les statistiques par thème
async function createUserStats(users) {
  console.log('\n📈 Création des statistiques par thème...');
  
  const themes = ['Mathématiques', 'Français', 'Métier'];
  const stats = [];
  
  for (const user of users) {
    for (const theme of themes) {
      const totalQuestions = Math.floor(Math.random() * 100) + 20;
      const correctRate = 0.5 + (user.current_grade * 0.03); // Meilleur taux pour les grades élevés
      const correctAnswers = Math.floor(totalQuestions * correctRate);
      
      stats.push({
        user_id: user.user_id,
        theme: theme,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        avg_time_per_question: Math.floor(Math.random() * 20) + 20, // 20-40 secondes
        last_updated: new Date().toISOString()
      });
    }
  }
  
  const { error } = await supabase
    .from('user_stats')
    .upsert(stats, { onConflict: 'user_id,theme' });
  
  if (error) {
    console.error('Erreur stats:', error.message);
  } else {
    console.log(`✅ ${stats.length} statistiques créées`);
  }
}

// Créer l'historique des grades
async function createUserGrades(users) {
  console.log('\n🎖️ Création de l\'historique des grades...');
  
  const gradeNames = [
    'Aspirant',
    'Sapeur 2e classe',
    'Sapeur 1re classe', 
    'Caporal',
    'Caporal-chef',
    'Sergent',
    'Sergent-chef',
    'Adjudant',
    'Adjudant-chef',
    'Major',
    'Lieutenant 2e classe',
    'Lieutenant 1re classe',
    'Lieutenant hors classe',
    'Capitaine',
    'Commandant'
  ];
  
  const grades = [];
  
  for (const user of users) {
    const currentGrade = user.current_grade;
    
    // Ajouter le grade actuel
    grades.push({
      user_id: user.user_id,
      grade_level: currentGrade,
      grade_name: gradeNames[currentGrade - 1] || gradeNames[0],
      reached_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    // Ajouter 1-2 grades précédents si applicable
    if (currentGrade > 1) {
      grades.push({
        user_id: user.user_id,
        grade_level: currentGrade - 1,
        grade_name: gradeNames[currentGrade - 2] || gradeNames[0],
        reached_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    if (currentGrade > 3) {
      grades.push({
        user_id: user.user_id,
        grade_level: currentGrade - 2,
        grade_name: gradeNames[currentGrade - 3] || gradeNames[0],
        reached_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }
  
  const { error } = await supabase
    .from('user_grades')
    .insert(grades);
  
  if (error) {
    console.error('Erreur grades:', error.message);
  } else {
    console.log(`✅ ${grades.length} grades créés`);
  }
}

// Créer les participations aux défis
async function createUserChallenges(users) {
  console.log('\n🎯 Création des participations aux défis...');
  
  const { data: challenges } = await supabase
    .from('daily_challenges')
    .select('*')
    .order('date', { ascending: false })
    .limit(7);
  
  if (!challenges || challenges.length === 0) {
    console.log('⚠️  Aucun défi quotidien trouvé');
    return;
  }
  
  const userChallenges = [];
  
  for (const user of users) {
    // Participation variable selon le niveau
    const participationRate = 0.3 + (user.current_grade * 0.05);
    
    for (const challenge of challenges) {
      if (Math.random() < participationRate) {
        const pointsBase = challenge.reward_points || 100;
        const performance = 0.5 + Math.random() * 0.5; // 50-100% de performance
        
        userChallenges.push({
          user_id: user.user_id,
          challenge_id: challenge.id,
          completed_at: new Date(challenge.date + 'T18:00:00').toISOString(),
          points_earned: Math.floor(pointsBase * performance)
        });
      }
    }
  }
  
  const { error } = await supabase
    .from('user_challenges')
    .insert(userChallenges);
  
  if (error) {
    console.error('Erreur défis:', error.message);
  } else {
    console.log(`✅ ${userChallenges.length} participations créées`);
  }
}

// Créer les badges obtenus
async function createUserBadges(users) {
  console.log('\n🏅 Attribution des badges...');
  
  const { data: badges } = await supabase
    .from('badges')
    .select('*');
  
  if (!badges || badges.length === 0) {
    console.log('⚠️  Aucun badge trouvé');
    return;
  }
  
  const userBadges = [];
  
  for (const user of users) {
    // Nombre de badges basé sur le grade
    const badgeCount = Math.min(Math.floor(user.current_grade / 3) + 1, badges.length);
    const selectedBadges = badges
      .sort(() => 0.5 - Math.random())
      .slice(0, badgeCount);
    
    for (const badge of selectedBadges) {
      userBadges.push({
        user_id: user.user_id,
        badge_id: badge.id,
        earned_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }
  
  const { error } = await supabase
    .from('user_badges')
    .insert(userBadges);
  
  if (error) {
    console.error('Erreur badges:', error.message);
  } else {
    console.log(`✅ ${userBadges.length} badges attribués`);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Finalisation des données de test...');
  console.log('====================================\n');
  
  try {
    const users = await getUsers();
    const questions = await getQuestions();
    
    if (users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé');
      console.error('Exécutez d\'abord: node scripts/seed-database.js');
      return;
    }
    
    if (questions.length === 0) {
      console.error('❌ Aucune question trouvée');
      return;
    }
    
    // Créer toutes les données
    await createSessionsWithAnswers(users, questions);
    await createUserStats(users);
    await createUserGrades(users);
    await createUserChallenges(users);
    await createUserBadges(users);
    
    console.log('\n====================================');
    console.log('✅ Base de données complètement initialisée !');
    console.log('\n📊 Données créées :');
    console.log('- Sessions d\'entraînement avec réponses détaillées');
    console.log('- Statistiques par thème pour chaque utilisateur');
    console.log('- Historique de progression des grades');
    console.log('- Participations aux défis quotidiens');
    console.log('- Badges obtenus selon le niveau');
    console.log('\n🎮 Vous pouvez maintenant tester toutes les fonctionnalités !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
  
  process.exit(0);
}

// Lancer le script
main();