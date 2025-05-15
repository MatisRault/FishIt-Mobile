import { useState, useRef } from 'react';
import { Animated, FlatList, Dimensions, ViewToken } from 'react-native';
import { Slide } from './SlideItem';

const { width } = Dimensions.get('window');

interface ViewableItemsChanged {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

const useOnboarding = (slides: Slide[]) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const goToSlide = (index: number) => {
    if (slidesRef.current) {
      slidesRef.current.scrollToOffset({ 
        offset: index * width,
        animated: true 
      });
    }
  };
  
  const handleViewableItemsChanged = ({ viewableItems }: ViewableItemsChanged) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  };
  
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