import { useState, useRef } from 'react';
import { Animated, FlatList, Dimensions, ViewToken } from 'react-native';
import { Slide } from './SlideItem';

// Obtenir la largeur de l'écran
const { width } = Dimensions.get('window');

// Interface pour le type d'item visible
interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

/**
 * Hook personnalisé pour gérer la logique d'onboarding
 * @param slides Les données des slides
 * @returns Toutes les fonctions et états nécessaires pour gérer l'onboarding
 */
const useOnboarding = (slides: Slide[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  // Naviguer vers un slide spécifique
  const goToSlide = (index: number) => {
    if (slidesRef.current) {
      slidesRef.current.scrollToOffset({ 
        offset: index * width,
        animated: true 
      });
    }
  };
  
  // Gérer le changement de slide visible
  const handleViewableItemsChanged = ({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  };
  
  // Configuration pour déterminer quand un item est considéré comme "visible"
  const viewableItemsConfig = { viewAreaCoveragePercentThreshold: 50 };
  
  return {
    currentIndex,
    slidesRef,
    scrollX,
    goToSlide,
    handleViewableItemsChanged,
    viewableItemsConfig
  };
};

export default useOnboarding;