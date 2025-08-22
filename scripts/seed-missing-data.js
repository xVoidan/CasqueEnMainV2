#!/usr/bin/env node

/**
 * Script complémentaire pour ajouter les données manquantes
 * Sessions, user_stats, user_grades, user_challenges, user_badges, session_answers
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
    .select('id, theme, sub_theme, difficulty');
  
  if (error) {
    console.error('Erreur lors de la récupération des questions:', error);
    return [];
  }
  return data;
}

// Créer des sessions avec leurs réponses
async function createSessionsWithAnswers(users, questions) {
  console.log('\n📊 Création des sessions avec réponses détaillées...');
  
  const themes = ['Mathématiques', 'Français', 'Métier'];
  let sessionsCreated = 0;
  
  for (const user of users) {
    // 3-8 sessions par utilisateur
    const sessionCount = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < sessionCount; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      startDate.setHours(Math.floor(Math.random() * 12) + 8);
      
      const selectedTheme = themes[Math.floor(Math.random() * themes.length)];
      const themeQuestions = questions.filter(q => q.theme === selectedTheme);
      
      if (themeQuestions.length === 0) continue;
      
      // Sélectionner 10-20 questions
      const questionCount = Math.floor(Math.random() * 11) + 10;
      const selectedQuestions = themeQuestions
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(questionCount, themeQuestions.length));
      
      const duration = Math.floor(Math.random() * 20) + 10; // 10-30 minutes
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + duration);
      
      // Score basé sur le grade de l'utilisateur
      const baseScore = 50 + (user.current_grade * 3);
      const variation = Math.floor(Math.random() * 20) - 10;
      const score = Math.max(30, Math.min(100, baseScore + variation));
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
        console.error('Erreur création session:', sessionError.message);
        continue;
      }
      
      // Créer les réponses pour cette session
      const answers = [];
      for (let j = 0; j < selectedQuestions.length; j++) {
        const isCorrect = j < correctCount;
        const timeSpent = Math.floor(Math.random() * 45) + 15; // 15-60 secondes
        
        answers.push({
          session_id: session.id,
          question_id: selectedQuestions[j].id,
          user_answer: isCorrect ? 'a' : ['b', 'c', 'd'][Math.floor(Math.random() * 3)],
          is_correct: isCorrect,
          points_earned: isCorrect ? selectedQuestions[j].difficulty : 0,
          time_spent: timeSpent
        });
      }
      
      // Insérer les réponses
      const { error: answersError } = await supabase
        .from('session_answers')
        .insert(answers);
      
      if (answersError) {
        console.error('Erreur insertion réponses:', answersError.message);
      } else {
        sessionsCreated++;
      }
    }
  }
  
  console.log(`✅ ${sessionsCreated} sessions créées avec réponses`);
}

// Créer les statistiques utilisateur
async function createUserStats(users) {
  console.log('\n📈 Création des statistiques utilisateur...');
  
  const stats = [];
  
  for (const user of users) {
    // Récupérer les sessions de l'utilisateur
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.user_id)
      .eq('status', 'completed');
    
    const sessionCount = sessions?.length || 0;
    const totalQuestions = sessions?.reduce((acc, s) => acc + (s.config?.questionCount || 0), 0) || 0;
    const correctAnswers = Math.floor(totalQuestions * 0.7); // 70% de bonnes réponses en moyenne
    
    stats.push({
      user_id: user.user_id,
      total_sessions: sessionCount,
      total_questions_answered: totalQuestions,
      correct_answers: correctAnswers,
      wrong_answers: totalQuestions - correctAnswers,
      average_score: sessionCount > 0 ? 70 + Math.floor(Math.random() * 20) : 0,
      best_streak: Math.floor(Math.random() * 30) + 5,
      current_streak: Math.floor(Math.random() * 10),
      favorite_theme: ['Mathématiques', 'Français', 'Métier'][Math.floor(Math.random() * 3)],
      last_activity: new Date().toISOString()
    });
  }
  
  const { error } = await supabase
    .from('user_stats')
    .upsert(stats, { onConflict: 'user_id' });
  
  if (error) {
    console.error('Erreur création stats:', error.message);
  } else {
    console.log(`✅ ${stats.length} statistiques utilisateur créées`);
  }
}

// Créer l'historique des grades
async function createUserGrades(users) {
  console.log('\n🎖️ Création de l\'historique des grades...');
  
  const grades = [];
  const gradeNames = [
    'Aspirant', 'Sapeur 2e classe', 'Sapeur 1re classe', 'Caporal',
    'Caporal-chef', 'Sergent', 'Sergent-chef', 'Adjudant',
    'Adjudant-chef', 'Major', 'Lieutenant 2e classe', 'Lieutenant 1re classe',
    'Lieutenant hors classe', 'Capitaine', 'Commandant'
  ];
  
  for (const user of users) {
    // Ajouter l'historique de progression
    const currentGrade = user.current_grade;
    
    // Grade actuel
    grades.push({
      user_id: user.user_id,
      grade_id: currentGrade,
      obtained_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      points_at_obtain: Math.floor(user.total_points * 0.9)
    });
    
    // Quelques grades précédents
    if (currentGrade > 1) {
      const previousGrade = currentGrade - 1;
      grades.push({
        user_id: user.user_id,
        grade_id: previousGrade,
        obtained_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        points_at_obtain: Math.floor(user.total_points * 0.6)
      });
    }
    
    if (currentGrade > 3) {
      grades.push({
        user_id: user.user_id,
        grade_id: currentGrade - 3,
        obtained_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        points_at_obtain: Math.floor(user.total_points * 0.3)
      });
    }
  }
  
  const { error } = await supabase
    .from('user_grades')
    .insert(grades);
  
  if (error) {
    console.error('Erreur création grades:', error.message);
  } else {
    console.log(`✅ ${grades.length} historiques de grades créés`);
  }
}

// Créer les participations aux défis
async function createUserChallenges(users) {
  console.log('\n🎯 Création des participations aux défis...');
  
  // Récupérer les défis existants
  const { data: challenges } = await supabase
    .from('daily_challenges')
    .select('*')
    .order('date', { ascending: false })
    .limit(7);
  
  if (!challenges) return;
  
  const userChallenges = [];
  
  for (const user of users) {
    // Participation aux défis récents (50-80% de participation)
    for (const challenge of challenges) {
      if (Math.random() > 0.3) { // 70% de chance de participation
        const score = 60 + Math.floor(Math.random() * 40); // Score entre 60 et 100
        userChallenges.push({
          user_id: user.user_id,
          challenge_id: challenge.id,
          completed_at: new Date(challenge.date + 'T18:00:00').toISOString(),
          score: score,
          points_earned: Math.floor((score / 100) * challenge.reward_points),
          time_spent: Math.floor(Math.random() * 1200) + 300 // 5-25 minutes
        });
      }
    }
  }
  
  const { error } = await supabase
    .from('user_challenges')
    .insert(userChallenges);
  
  if (error) {
    console.error('Erreur création défis utilisateur:', error.message);
  } else {
    console.log(`✅ ${userChallenges.length} participations aux défis créées`);
  }
}

// Créer les badges obtenus
async function createUserBadges(users) {
  console.log('\n🏅 Attribution des badges...');
  
  // Récupérer les badges existants
  const { data: badges } = await supabase
    .from('badges')
    .select('*');
  
  if (!badges) return;
  
  const userBadges = [];
  
  for (const user of users) {
    // Badges basés sur le niveau de l'utilisateur
    const badgeCount = Math.min(Math.floor(user.current_grade / 2) + 1, badges.length);
    const userBadgesList = badges
      .sort(() => 0.5 - Math.random())
      .slice(0, badgeCount);
    
    for (const badge of userBadgesList) {
      userBadges.push({
        user_id: user.user_id,
        badge_id: badge.id,
        obtained_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
  }
  
  const { error } = await supabase
    .from('user_badges')
    .insert(userBadges);
  
  if (error) {
    console.error('Erreur attribution badges:', error.message);
  } else {
    console.log(`✅ ${userBadges.length} badges attribués`);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Ajout des données manquantes...');
  console.log('================================\n');
  
  try {
    const users = await getUsers();
    const questions = await getQuestions();
    
    if (users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé. Exécutez d\'abord seed-database.js');
      return;
    }
    
    // Créer les données manquantes
    await createSessionsWithAnswers(users, questions);
    await createUserStats(users);
    await createUserGrades(users);
    await createUserChallenges(users);
    await createUserBadges(users);
    
    console.log('\n================================');
    console.log('✅ Toutes les données ont été ajoutées !');
    console.log('\n📊 Résumé :');
    console.log('- Sessions avec réponses détaillées');
    console.log('- Statistiques utilisateur complètes');
    console.log('- Historique de progression des grades');
    console.log('- Participations aux défis quotidiens');
    console.log('- Badges obtenus par les utilisateurs');
    console.log('\n🎮 L\'application est maintenant prête avec toutes les données de test !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
  
  process.exit(0);
}

// Lancer le script
main();