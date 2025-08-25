/**
 * Script de test pour vérifier la création de sessions
 * Usage: node scripts/test-session-creation.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.log('Assurez-vous que votre fichier .env contient:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour générer un UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testSessionCreation() {
  console.log('🧪 Test de création de session...\n');

  try {
    // 1. Récupérer un utilisateur de test
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (userError) {
      console.error('❌ Erreur récupération utilisateur:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé. Créez d\'abord un compte utilisateur.');
      return;
    }

    const testUserId = users[0].user_id;
    console.log('✅ Utilisateur de test trouvé:', testUserId);

    // 2. Créer une session de test
    const sessionId = generateUUID();
    const sessionData = {
      id: sessionId,
      user_id: testUserId,
      config: {
        themes: [{ id: 'mathematiques', name: 'Mathématiques' }],
        questionCount: 10,
        timerEnabled: false,
        timerDuration: null,
        scoring: {
          correct: 1,
          incorrect: -0.5,
          skipped: 0,
          partial: 0.5
        }
      },
      started_at: new Date().toISOString(),
      status: 'in_progress',
      score: 0,
      total_points_earned: 0
    };

    console.log('\n📝 Création de la session avec ID:', sessionId);

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Erreur création session:', sessionError);
      return;
    }

    console.log('✅ Session créée avec succès!');
    console.log('   ID:', session.id);
    console.log('   Status:', session.status);

    // 3. Ajouter une réponse de test
    const answerId = generateUUID();
    const questionId = generateUUID();
    
    const answerData = {
      id: answerId,
      session_id: sessionId,
      question_id: questionId,
      selected_answers: [generateUUID()],
      is_correct: true,
      is_partial: false,
      time_taken: 15,
      points_earned: 1
    };

    console.log('\n📝 Ajout d\'une réponse de test...');

    const { data: answer, error: answerError } = await supabase
      .from('session_answers')
      .insert(answerData)
      .select()
      .single();

    if (answerError) {
      console.error('❌ Erreur création réponse:', answerError);
    } else {
      console.log('✅ Réponse ajoutée avec succès!');
    }

    // 4. Terminer la session
    console.log('\n📝 Finalisation de la session...');

    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        score: 100,
        total_points_earned: 1
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('❌ Erreur finalisation session:', updateError);
    } else {
      console.log('✅ Session finalisée avec succès!');
    }

    // 5. Vérifier les données
    console.log('\n🔍 Vérification des données...');

    const { data: finalSession, error: checkError } = await supabase
      .from('sessions')
      .select(`
        *,
        session_answers (*)
      `)
      .eq('id', sessionId)
      .single();

    if (checkError) {
      console.error('❌ Erreur vérification:', checkError);
    } else {
      console.log('✅ Session complète:');
      console.log('   Status:', finalSession.status);
      console.log('   Score:', finalSession.score);
      console.log('   Points:', finalSession.total_points_earned);
      console.log('   Réponses:', finalSession.session_answers?.length || 0);
    }

    console.log('\n✅ Test terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le test
testSessionCreation();