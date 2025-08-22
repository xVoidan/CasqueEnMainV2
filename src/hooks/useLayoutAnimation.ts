import { useCallback } from 'react';
import { LayoutAnimation, Platform } from 'react-native';

/**
 * Hook pour gérer les animations de layout de manière simple et performante
 */
export const useLayoutAnimation = () => {
  // Animation basique easeInEaseOut
  const animateNext = useCallback(() => {
    if (Platform.OS === 'android') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, []);

  // Animation spring (rebond)
  const animateSpring = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  }, []);

  // Animation linéaire
  const animateLinear = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
  }, []);

  // Animation personnalisée
  const animateCustom = useCallback((
    duration: number = 300,
    type: 'spring' | 'linear' | 'easeInEaseOut' = 'easeInEaseOut',
    property: 'opacity' | 'scaleXY' | 'scaleX' | 'scaleY' = 'opacity'
  ) => {
    const animationType = 
      type === 'spring' ? LayoutAnimation.Types.spring :
      type === 'linear' ? LayoutAnimation.Types.linear :
      LayoutAnimation.Types.easeInEaseOut;

    const animationProperty =
      property === 'scaleXY' ? LayoutAnimation.Properties.scaleXY :
      property === 'scaleX' ? LayoutAnimation.Properties.scaleX :
      property === 'scaleY' ? LayoutAnimation.Properties.scaleY :
      LayoutAnimation.Properties.opacity;

    LayoutAnimation.configureNext({
      duration,
      create: {
        type: animationType,
        property: animationProperty,
      },
      update: {
        type: animationType,
      },
      delete: {
        type: animationType,
        property: animationProperty,
      },
    });
  }, []);

  // Animation pour l'ajout d'éléments
  const animateInsert = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  }, []);

  // Animation pour la suppression d'éléments
  const animateDelete = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 200,
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  }, []);

  // Animation pour les changements de taille
  const animateResize = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
    });
  }, []);

  // Animation pour les modales
  const animateModal = useCallback((show: boolean) => {
    LayoutAnimation.configureNext({
      duration: 250,
      create: show ? {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      } : undefined,
      delete: !show ? {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.scaleXY,
      } : undefined,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  }, []);

  // Animation pour les tabs
  const animateTabChange = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 200,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });
  }, []);

  // Wrapper pour animer une fonction setState
  const animateStateChange = useCallback(<T,>(
    setter: React.Dispatch<React.SetStateAction<T>>,
    value: T,
    animationType: 'default' | 'spring' | 'linear' = 'default'
  ) => {
    if (animationType === 'spring') {
      animateSpring();
    } else if (animationType === 'linear') {
      animateLinear();
    } else {
      animateNext();
    }
    setter(value);
  }, [animateNext, animateSpring, animateLinear]);

  return {
    // Animations de base
    animateNext,
    animateSpring,
    animateLinear,
    
    // Animations spécifiques
    animateInsert,
    animateDelete,
    animateResize,
    animateModal,
    animateTabChange,
    
    // Animations personnalisées
    animateCustom,
    animateStateChange,
  };
};