import React from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ColorSchemeName } from 'react-native';
import { Image } from 'expo-image'; 
import { useThemeColor } from '@/components/Themed';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export interface Slide {
  id: string;
  title: string;
  description: string;
  image: any;
  showButton?: boolean;
}

interface SlideItemProps {
  item: Slide;
  colorScheme: ColorSchemeName;
}

const SlideItem: React.FC<SlideItemProps> = ({ item, colorScheme }) => {
  const textColor = "#FFFFFF"; 
  const tintColor = useThemeColor({ light: undefined, dark: undefined }, 'tint');
  
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état de l\'onboarding:', error);
      router.replace('/(tabs)');
    }
  };
  
  return (
    <View style={[styles.slideContainer, { width, height }]}>
      <Image 
        source={item.image}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      
      <View style={styles.overlay} />
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: textColor }]}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: textColor }]}>
          {item.description}
        </Text>
        
        {item.showButton && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: tintColor }]}
            onPress={completeOnboarding}
          >
            <Text style={styles.buttonText}>Commencer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
    zIndex: 1, 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default SlideItem;