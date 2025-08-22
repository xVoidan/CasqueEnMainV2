export interface IGrade {
  id: number;
  name: string;
  shortName: string;
  minPoints: number;
  color: string;
  backgroundColor: string;
  icon: string;
  imageName: string;
}

export const FIREFIGHTER_GRADES: IGrade[] = [
  {
    id: 1,
    name: 'Aspirant',
    shortName: 'ASP',
    minPoints: 0,
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    icon: '🎓',
    imageName: '1Aspirant.png',
  },
  {
    id: 2,
    name: 'Sapeur',
    shortName: 'SAP',
    minPoints: 100,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    icon: '⭐',
    imageName: '2Sapeur.png',
  },
  {
    id: 3,
    name: 'Caporal',
    shortName: 'CPL',
    minPoints: 300,
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    icon: '🔸',
    imageName: '3Caporal.png',
  },
  {
    id: 4,
    name: 'Caporal-Chef',
    shortName: 'CCH',
    minPoints: 600,
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    icon: '🔸🔸',
    imageName: '4CaporalChef.png',
  },
  {
    id: 5,
    name: 'Sergent',
    shortName: 'SGT',
    minPoints: 1000,
    color: '#B91C1C',
    backgroundColor: '#FEF2F2',
    icon: '🔹',
    imageName: '5Sergent.png',
  },
  {
    id: 6,
    name: 'Sergent-Chef',
    shortName: 'SCH',
    minPoints: 1500,
    color: '#991B1B',
    backgroundColor: '#FEF2F2',
    icon: '🔹🔹',
    imageName: '6SergentChef.png',
  },
  {
    id: 7,
    name: 'Adjudant',
    shortName: 'ADJ',
    minPoints: 2500,
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
    icon: '🔶',
    imageName: '7Adjudant.png',
  },
  {
    id: 8,
    name: 'Adjudant-Chef',
    shortName: 'ACH',
    minPoints: 4000,
    color: '#D97706',
    backgroundColor: '#FED7AA',
    icon: '🔶🔶',
    imageName: '8AdjudantChef.png',
  },
  {
    id: 9,
    name: 'Lieutenant',
    shortName: 'LTN',
    minPoints: 6000,
    color: '#B45309',
    backgroundColor: '#FED7AA',
    icon: '🏅',
    imageName: '9Lieutenant.png',
  },
  {
    id: 10,
    name: 'Commandant',
    shortName: 'CDT',
    minPoints: 9000,
    color: '#92400E',
    backgroundColor: '#FED7AA',
    icon: '🏅🏅',
    imageName: '10Commandant.png',
  },
  {
    id: 11,
    name: 'Capitaine',
    shortName: 'CPT',
    minPoints: 13000,
    color: '#78350F',
    backgroundColor: '#FEF3C7',
    icon: '🎖️',
    imageName: '11Capitaine.png',
  },
  {
    id: 12,
    name: 'Lieutenant-Colonel',
    shortName: 'LCL',
    minPoints: 18000,
    color: '#451A03',
    backgroundColor: '#FEF3C7',
    icon: '🎖️🎖️',
    imageName: '12LieutenantColonel.png',
  },
  {
    id: 13,
    name: 'Colonel',
    shortName: 'COL',
    minPoints: 25000,
    color: '#1C1917',
    backgroundColor: '#F3F4F6',
    icon: '🌟',
    imageName: '13Colonel.png',
  },
  {
    id: 14,
    name: 'Contrôleur Général',
    shortName: 'CG',
    minPoints: 35000,
    color: '#991B1B',
    backgroundColor: '#DBEAFE',
    icon: '🌟🌟',
    imageName: '14ControleurGeneral.png',
  },
  {
    id: 15,
    name: "Contrôleur Général d'État",
    shortName: 'CGE',
    minPoints: 50000,
    color: '#7C2D12',
    backgroundColor: '#DBEAFE',
    icon: '🌟🌟🌟',
    imageName: '15ControleurGeneralEtat.png',
  },
];

/**
 * Obtient le grade actuel basé sur les points
 */
export function getCurrentGrade(points: number): IGrade {
  for (let i = FIREFIGHTER_GRADES.length - 1; i >= 0; i--) {
    if (points >= FIREFIGHTER_GRADES[i].minPoints) {
      return FIREFIGHTER_GRADES[i];
    }
  }
  return FIREFIGHTER_GRADES[0];
}

/**
 * Obtient le prochain grade à atteindre
 */
export function getNextGrade(points: number): IGrade | null {
  const currentGrade = getCurrentGrade(points);
  const nextIndex = currentGrade.id;

  if (nextIndex < FIREFIGHTER_GRADES.length) {
    return FIREFIGHTER_GRADES[nextIndex];
  }

  return null;
}

/**
 * Calcule la progression vers le prochain grade
 */
export function getProgressToNext(points: number): {
  currentGrade: IGrade;
  nextGrade: IGrade | null;
  progress: number;
  pointsNeeded: number;
} {
  const currentGrade = getCurrentGrade(points);
  const nextGrade = getNextGrade(points);

  if (!nextGrade) {
    return {
      currentGrade,
      nextGrade: null,
      progress: 100,
      pointsNeeded: 0,
    };
  }

  const pointsInCurrentGrade = points - currentGrade.minPoints;
  const pointsNeededForNext = nextGrade.minPoints - currentGrade.minPoints;
  const progress = Math.min(100, (pointsInCurrentGrade / pointsNeededForNext) * 100);
  const pointsNeeded = nextGrade.minPoints - points;

  return {
    currentGrade,
    nextGrade,
    progress,
    pointsNeeded,
  };
}

/**
 * Obtient le grade par ID
 */
export function getGradeById(id: number): IGrade | undefined {
  return FIREFIGHTER_GRADES.find(grade => grade.id === id);
}

/**
 * Vérifie si un niveau a été atteint pour la première fois
 */
export function isNewGradeReached(oldPoints: number, newPoints: number): IGrade | null {
  const oldGrade = getCurrentGrade(oldPoints);
  const newGrade = getCurrentGrade(newPoints);

  if (newGrade.id > oldGrade.id) {
    return newGrade;
  }

  return null;
}

/**
 * Formate les points avec séparateurs de milliers
 */
export function formatPoints(points: number): string {
  return points.toLocaleString('fr-FR');
}
