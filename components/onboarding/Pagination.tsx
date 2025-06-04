import React from 'react';
import { StyleSheet, View, TouchableOpacity, ColorSchemeName, Animated, Dimensions } from 'react-native';
import { useThemeColor } from '@/components/Themed';
import { Slide } from './SlideItem';

// Obtenir la largeur de l'écran
const { width } = Dimensions.get('window');

// Props pour le composant Pagination
interface PaginationProps {
  slides: Slide[];
  currentIndex: number;
  colorScheme: ColorSchemeName;
  goToSlide: (index: number) => void;
  scrollX: Animated.Value;
}

const Pagination: React.FC<PaginationProps> = ({ 
  slides, 
  currentIndex, 
  colorScheme, 
  goToSlide,
  scrollX
}) => {
  // Utiliser useThemeColor qui est déjà défini dans votre projet
  const tintColor = useThemeColor({ light: undefined, dark: undefined }, 'tint');
  
  return (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => {
        // Créer une plage d'input pour l'animation
        const inputRange = [
          (index - 1) * width,
          index * width,
          (index + 1) * width
        ];
        
        // Animer la largeur du point
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 20, 10],
          extrapolate: 'clamp',
        });
        
        // Animer l'opacité du point
        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });
        
        // Animer la couleur du point
        const backgroundColor = scrollX.interpolate({
          inputRange,
          outputRange: [
            'rgba(158, 150, 150, 0.5)',
            tintColor,
            'rgba(158, 150, 150, 0.5)'
          ],
          extrapolate: 'clamp',
        });
        
        return (
          <TouchableOpacity 
            key={index.toString()}
            style={styles.dotButton}
            onPress={() => goToSlide(index)}
            activeOpacity={0.6}
          >
            <Animated.View
              style={[
                styles.dot,
                { 
                  width: dotWidth, 
                  opacity,
                  backgroundColor
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  paginationContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  dotButton: {
    padding: 10,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  }
});

export default Pagination;
