import React from 'react';
import { StyleSheet, View, FlatList, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/components/useColorScheme';

// Importer les composants et hooks d'onboarding
import {
  SlideItem,
  Pagination,
  useOnboarding,
  SLIDES_DATA
} from '@/components/onboarding';

// Obtenir les dimensions de l'écran
const { width } = Dimensions.get('window');

/**
 * Écran d'onboarding avec les slides d'introduction
 */
const Onboarding: React.FC = () => {
  // Obtenir le thème de couleur actuel
  const colorScheme = useColorScheme();
  
  // Utiliser le hook personnalisé pour la logique d'onboarding
  const {
    currentIndex,
    slidesRef,
    scrollX,
    goToSlide,
    handleViewableItemsChanged,
    viewableItemsConfig
  } = useOnboarding(SLIDES_DATA);
  
  // Fonction pour rendre un slide
  const renderSlide = ({ item }: { item: typeof SLIDES_DATA[0] }) => (
    <SlideItem item={item} colorScheme={colorScheme} />
  );
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <FlatList
        data={SLIDES_DATA}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewableItemsConfig}
        ref={slidesRef}
        style={styles.flatList}
        decelerationRate="fast"
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
      />
      
      {/* Pagination positionnée en position absolue en bas de l'écran */}
      <View style={styles.paginationContainer}>
        <Pagination
          slides={SLIDES_DATA}
          currentIndex={currentIndex}
          colorScheme={colorScheme}
          goToSlide={goToSlide}
          scrollX={scrollX}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', // Fond noir pour éviter tout espace blanc
  },
  flatList: {
    flex: 1,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  }
});

export default Onboarding;