import { supabase } from '@/src/lib/supabase';

/**
 * Service de vérification des droits admin
 * Utilise la vérification côté serveur Supabase pour la sécurité
 */
export class AdminService {
  /**
   * Vérifie si l'utilisateur actuel est admin
   * Cette vérification se fait côté serveur via Supabase RLS
   */
  static async isUserAdmin(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_is_admin');

      if (error) {
        console.error('Erreur lors de la vérification admin:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Erreur lors de la vérification admin:', error);
      return false;
    }
  }

  /**
   * Récupère la liste des admins (si l'utilisateur est admin)
   */
  static async getAdminsList(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*');

      if (error) {
        console.error('Erreur lors de la récupération des admins:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des admins:', error);
      return [];
    }
  }

  /**
   * Ajoute un nouvel admin (nécessite d'être admin)
   * Cette opération sera bloquée côté serveur si l'utilisateur n'est pas admin
   */
  static async addAdmin(email: string): Promise<boolean> {
    try {
      // D'abord récupérer l'user_id depuis l'email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.error('Utilisateur non trouvé');
        return false;
      }

      const { error } = await supabase
        .from('admins')
        .insert([{
          user_id: userData.id,
          email: email,
        }]);

      if (error) {
        console.error('Erreur lors de l\'ajout de l\'admin:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'admin:', error);
      return false;
    }
  }

  /**
   * Teste les permissions d'écriture
   * Utile pour vérifier que RLS fonctionne correctement
   */
  static async testWritePermissions(): Promise<{
    canInsert: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }> {
    const testThemeName = `__TEST_THEME_${  Date.now()}`;
    let testId: string | null = null;

    const results = {
      canInsert: false,
      canUpdate: false,
      canDelete: false,
    };

    try {
      // Test INSERT
      const { data: insertData, error: insertError } = await supabase
        .from('themes')
        .insert([{ name: testThemeName, icon: '🧪' }])
        .select()
        .single();

      if (!insertError && insertData) {
        results.canInsert = true;
        testId = insertData.id;

        // Test UPDATE
        const { error: updateError } = await supabase
          .from('themes')
          .update({ icon: '✅' })
          .eq('id', testId);

        if (!updateError) {
          results.canUpdate = true;
        }

        // Test DELETE
        const { error: deleteError } = await supabase
          .from('themes')
          .delete()
          .eq('id', testId);

        if (!deleteError) {
          results.canDelete = true;
        }
      }
    } catch (error) {
      console.error('Erreur lors du test des permissions:', error);
    }

    // Nettoyage au cas où
    if (testId && !results.canDelete) {
      try {
        await supabase
          .from('themes')
          .delete()
          .eq('id', testId);
      } catch {}
    }

    return results;
  }
}
