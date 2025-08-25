/**
 * Utilitaire pour convertir les IDs de réponses entre formats
 * Nécessaire car les questions utilisent des IDs simples (a,b,c,d)
 * mais la DB pourrait attendre des UUID
 */

/**
 * Mappe un ID simple vers un UUID factice mais valide
 * Utilise un UUID de base et change le dernier caractère
 */
export function simpleIdToUUID(simpleId: string): string {
  // UUID de base pour les réponses
  const baseUUID = '00000000-0000-4000-8000-000000000000';

  // Mapper les IDs simples vers des UUID uniques
  const mapping: Record<string, string> = {
    'a': '00000000-0000-4000-8000-000000000001',
    'b': '00000000-0000-4000-8000-000000000002',
    'c': '00000000-0000-4000-8000-000000000003',
    'd': '00000000-0000-4000-8000-000000000004',
    'e': '00000000-0000-4000-8000-000000000005',
    'f': '00000000-0000-4000-8000-000000000006',
  };

  return mapping[simpleId.toLowerCase()] || baseUUID;
}

/**
 * Convertit un tableau d'IDs simples en UUID
 */
export function convertAnswerIdsToUUID(simpleIds: string[]): string[] {
  return simpleIds.map(id => simpleIdToUUID(id));
}

/**
 * Convertit un UUID factice vers son ID simple
 */
export function uuidToSimpleId(uuid: string): string {
  const reverseMapping: Record<string, string> = {
    '00000000-0000-4000-8000-000000000001': 'a',
    '00000000-0000-4000-8000-000000000002': 'b',
    '00000000-0000-4000-8000-000000000003': 'c',
    '00000000-0000-4000-8000-000000000004': 'd',
    '00000000-0000-4000-8000-000000000005': 'e',
    '00000000-0000-4000-8000-000000000006': 'f',
  };

  return reverseMapping[uuid] || uuid;
}

/**
 * Vérifie si une chaîne est un ID simple de réponse
 */
export function isSimpleAnswerId(id: string): boolean {
  return /^[a-f]$/i.test(id);
}
