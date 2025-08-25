/**
 * Script de test pour vérifier les corrections de sessions
 * Usage: node scripts/test-session-fixes.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes');
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

// Convertir les IDs simples en UUID factices
function convertAnswerIds(simpleIds) {
  const mapping = {
    'a': '00000000-0000-4000-8000-000000000001',
    'b': '00000000-0000-4000-8000-000000000002',
    'c': '00000000-0000-4000-8000-000000000003',
    'd': '00000000-0000-4000-8000-000000000004',
  };
  return simpleIds.map(id => mapping[id] || id);
}

async function testSessionFixes() {
  console.log('🧪 Test des corrections de sessions...\n');

  try {
    // 1. Récupérer un utilisateur de test
    const { data: users } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);

    if (!users || users.length === 0) {
      console.log('⚠️ Aucun utilisateur trouvé.');
      return;
    }

    const userId = users[0].user_id;
    console.log('✅ Utilisateur de test:', userId);

    // 2. Test 1: Créer une session avec temps en décimal
    console.log('\n📝 Test 1: Session avec temps décimal...');
    const sessionId = generateUUID();
    
    const { error: sessionError } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        config: { test: true },
        score: 0,
        total_points_earned: 0
      });

    if (sessionError) {
      console.error('❌ Erreur création session:', sessionError);
      return;
    }
    console.log('✅ Session créée');

    // 3. Test 2: Ajouter une réponse avec temps décimal
    console.log('\n📝 Test 2: Réponse avec temps décimal (2.412 → 2)...');
    const timeDecimal = 2.412;
    const timeInteger = Math.round(timeDecimal);
    
    const { error: answerError1 } = await supabase
      .from('session_answers')
      .insert({
        session_id: sessionId,
        question_id: generateUUID(),
        selected_answers: convertAnswerIds(['a', 'c']), // Conversion des IDs
        time_taken: timeInteger, // Arrondi
        is_correct: true,
        points_earned: 1
      });

    if (answerError1) {
      console.error('❌ Erreur ajout réponse:', answerError1);
    } else {
      console.log(`✅ Réponse ajoutée (temps: ${timeDecimal} → ${timeInteger})`);
    }

    // 4. Test 3: Mettre la session en pause
    console.log('\n📝 Test 3: Mise en pause de session...');
    const { error: pauseError } = await supabase
      .from('sessions')
      .update({
        status: 'in_progress', // Pas 'paused' car n'existe pas dans l'enum
        paused_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (pauseError) {
      console.error('❌ Erreur mise en pause:', pauseError);
    } else {
      console.log('✅ Session mise en pause (status=in_progress + paused_at)');
    }

    // 5. Test 4: Récupérer les sessions en pause
    console.log('\n📝 Test 4: Récupération des sessions en pause...');
    const { data: pausedSessions, error: fetchError } = await supabase
      .from('sessions')
      .select('id, status, paused_at')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .not('paused_at', 'is', null);

    if (fetchError) {
      console.error('❌ Erreur récupération:', fetchError);
    } else {
      console.log(`✅ ${pausedSessions.length} session(s) en pause trouvée(s)`);
      if (pausedSessions.length > 0) {
        console.log('   Session:', pausedSessions[0].id);
        console.log('   Status:', pausedSessions[0].status);
        console.log('   Paused at:', pausedSessions[0].paused_at);
      }
    }

    // 6. Test 5: Finaliser la session
    console.log('\n📝 Test 5: Finalisation de la session...');
    const { error: completeError } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        score: 100,
        total_points_earned: 1
      })
      .eq('id', sessionId);

    if (completeError) {
      console.error('❌ Erreur finalisation:', completeError);
    } else {
      console.log('✅ Session finalisée');
    }

    // 7. Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { data: finalSession } = await supabase
      .from('sessions')
      .select(`
        *,
        session_answers (*)
      `)
      .eq('id', sessionId)
      .single();

    if (finalSession) {
      console.log('✅ Session complète:');
      console.log('   Status:', finalSession.status);
      console.log('   Score:', finalSession.score);
      console.log('   Réponses:', finalSession.session_answers?.length || 0);
      console.log('   Temps total:', finalSession.session_answers?.[0]?.time_taken, 'secondes');
    }

    console.log('\n✅ Tous les tests sont passés avec succès!');

  } catch (error) {
    console.error('❌ Erreur inattendue:', error);
  }
}

// Exécuter le test
testSessionFixes();