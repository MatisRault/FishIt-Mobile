import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ColorSchemeName, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { Image } from 'expo-image'; 
import { useThemeColor } from '@/components/Themed';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export interface Slide {
  id: string;
  title: string;
  description: string;
  image: any;
  showButton?: boolean;
  isLocationSlide?: boolean;
  isAuthSlide?: boolean;  
}

interface SlideItemProps {
  item: Slide;
  colorScheme: ColorSchemeName;
}

const SlideItem: React.FC<SlideItemProps> = ({ item, colorScheme }) => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  
  const textColor = "#FFFFFF"; 
  const darkTealColor = "#204553"; 
  const tintColor = useThemeColor({ light: undefined, dark: undefined }, 'tint');
  
  useEffect(() => {
    if (item.isLocationSlide) {
      checkPermissionStatus();
    }
  }, [item.isLocationSlide]);
  
  const checkPermissionStatus = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
    
    if (status === 'granted') {
      fetchLocationInfo();
    }
  };
  
  const fetchLocationInfo = async () => {
    setIsLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const { latitude, longitude } = location.coords;
      
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      let city = null;
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const addressData = reverseGeocode[0];
        
        if (addressData.city) {
          city = addressData.city;
        } else if (addressData.district) {
          city = addressData.district;
        } else if (addressData.region) {
          city = addressData.region;
        }
      }
      
      if (city) {
        setLocationInfo(`Position détectée : ${city}`);
      } else {
        setLocationInfo("Position détectée");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la localisation:", error);
      setLocationInfo(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état de l\'onboarding:', error);
      router.replace('/(tabs)');
    }
  };
  
  const navigateToLogin = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      router.push('/login'); 
    } catch (error) {
      console.error('Erreur lors de la navigation vers la page de connexion:', error);
      router.push('/(tabs)');
    }
  };
  
  const navigateToSignup = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      router.push('/register'); 
    } catch (error) {
      console.error('Erreur lors de la navigation vers la page d\'inscription:', error);
      router.push('/(tabs)');
    }
  };
  
  const handleRequestLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        fetchLocationInfo();
      } else {
        if (Platform.OS === 'ios' && status === 'denied') {
          Alert.alert(
            "Accès à la localisation refusé",
            "Pour profiter pleinement de Fish It et trouver les meilleurs spots de pêche, nous avons besoin d'accéder à votre position. Vous pouvez l'activer dans les paramètres.",
            [
              { text: "Annuler", style: "cancel" },
              { text: "Ouvrir les paramètres", onPress: () => Linking.openSettings() }
            ]
          );
        } else if (Platform.OS === 'android') {
          const { canAskAgain } = await Location.getForegroundPermissionsAsync();
          if (!canAskAgain) {
            Alert.alert(
              "Accès à la localisation requis",
              "Pour utiliser toutes les fonctionnalités de Fish It, veuillez activer la localisation dans les paramètres de votre appareil.",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Ouvrir les paramètres", onPress: () => Linking.openSettings() }
              ]
            );
          } else {
            Alert.alert(
              "Accès à la localisation refusé",
              "Pour profiter pleinement de Fish It et trouver les meilleurs spots de pêche, nous avons besoin d'accéder à votre position.",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Réessayer", onPress: handleRequestLocation }
              ]
            );
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderLocationContent = () => {
    if (permissionStatus === 'granted') {
      return (
        <Text style={[styles.locationGrantedText, { color: textColor }]}>
          ✓ {locationInfo || "Localisation activée"}
        </Text>
      );
    } else {
      return (
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: darkTealColor }]}
          onPress={handleRequestLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText} numberOfLines={1}>Activer la localisation</Text>
          )}
        </TouchableOpacity>
      );
    }
  };
  
  const renderAuthButtons = () => {
    return (
      <View style={styles.authButtonsContainer}>
        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: darkTealColor, marginBottom: 40 }]}
          onPress={navigateToLogin}
        >
          <Text style={styles.buttonText} numberOfLines={1}>Se connecter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.authButton, { 
            backgroundColor: '#FFFFFF', 
        
          }]}
          onPress={navigateToSignup}
        >
          <Text style={[styles.buttonText, { color: darkTealColor }]} numberOfLines={1}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderNormalButton = () => {
    return (
      <TouchableOpacity
        style={[styles.authButton, { backgroundColor: darkTealColor }]}
        onPress={completeOnboarding}
      >
        <Text style={styles.buttonText} numberOfLines={1}>Commencer</Text>
      </TouchableOpacity>
    );
  };
  
  const renderSlideContent = () => {
    if (item.isLocationSlide) {
      return renderLocationContent();
    } else if (item.isAuthSlide) {
      return renderAuthButtons();
    } else if (item.showButton) {
      return renderNormalButton();
    }
    
    return null;
  };
  
  const getTitleFontSize = () => {
    return item.isAuthSlide ? 60 : 45; 
  };
  
  const getDescriptionFontSize = () => {
    return item.isAuthSlide ? 32 : 20; 
  };
  
  const renderDescription = () => {
    if (item.isAuthSlide) {
      return (
        <Text style={[styles.subtitle, { color: textColor, fontSize: getDescriptionFontSize() }]}>
          Explore les eaux,{"\n"}Capture l'instant.
        </Text>
      );
    } else {
      return (
        <Text style={[styles.description, { color: textColor, textAlign: 'left', fontSize: getDescriptionFontSize() }]}>
          {item.description}
        </Text>
      );
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
        <View style={styles.leftAlignedHeaderContainer}>
          <Text style={[styles.title, { color: textColor, fontSize: getTitleFontSize() }]}>
            {item.isAuthSlide ? "FishIt" : item.title}
          </Text>
          
          {renderDescription()}
        </View>
        
        <View style={styles.buttonContainer}>
          {renderSlideContent()}
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)', 
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 100,
    width: '100%',
    zIndex: 1,
  },
  leftAlignedHeaderContainer: {
    alignItems: 'flex-start', 
    alignSelf: 'flex-start', 
    marginBottom: 20,
    marginLeft: 10,
    marginTop: 40, // Ajout de 40 pixels de marge en haut
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'left', 
  },
  subtitle: {
    textAlign: 'left',
    lineHeight: 40,
    marginTop: 5,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  description: {
    lineHeight: 30, 
    marginTop: 5,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 60,
  },
  authButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    width: "80%", 
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    width: "auto", 
    minWidth: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  authButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  locationGrantedText: {
    fontSize: 24, 
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  }
});

export default SlideItem;import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ColorSchemeName, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { Image } from 'expo-image'; 
import { useThemeColor } from '@/components/Themed';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');

export interface Slide {
  id: string;
  title: string;
  description: string;
  image: any;
  showButton?: boolean;
  isLocationSlide?: boolean;
  isAuthSlide?: boolean;  
}

interface SlideItemProps {
  item: Slide;
  colorScheme: ColorSchemeName;
}

const SlideItem: React.FC<SlideItemProps> = ({ item, colorScheme }) => {
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  
  const textColor = "#FFFFFF"; 
  const darkTealColor = "#204553"; 
  const tintColor = useThemeColor({ light: undefined, dark: undefined }, 'tint');
  
  useEffect(() => {
    if (item.isLocationSlide) {
      checkPermissionStatus();
    }
  }, [item.isLocationSlide]);
  
  const checkPermissionStatus = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status);
    
    if (status === 'granted') {
      fetchLocationInfo();
    }
  };
  
  const fetchLocationInfo = async () => {
    setIsLoading(true);
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const { latitude, longitude } = location.coords;
      
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      let city = null;
      
      if (reverseGeocode && reverseGeocode.length > 0) {
        const addressData = reverseGeocode[0];
        
        if (addressData.city) {
          city = addressData.city;
        } else if (addressData.district) {
          city = addressData.district;
        } else if (addressData.region) {
          city = addressData.region;
        }
      }
      
      if (city) {
        setLocationInfo(`Position détectée : ${city}`);
      } else {
        setLocationInfo("Position détectée");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la localisation:", error);
      setLocationInfo(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'état de l\'onboarding:', error);
      router.replace('/(tabs)');
    }
  };
  
  const navigateToLogin = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      router.replace('/login'); 
    } catch (error) {
      console.error('Erreur lors de la navigation vers la page de connexion:', error);
      router.replace('/(tabs)');
    }
  };
  
  const navigateToSignup = async () => {
    try {
      await AsyncStorage.setItem('@onboarding_completed', 'true');
      router.replace('/register'); 
    } catch (error) {
      console.error('Erreur lors de la navigation vers la page d\'inscription:', error);
      router.replace('/(tabs)');
    }
  };
  
  const handleRequestLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        fetchLocationInfo();
      } else {
        if (Platform.OS === 'ios' && status === 'denied') {
          Alert.alert(
            "Accès à la localisation refusé",
            "Pour profiter pleinement de Fish It et trouver les meilleurs spots de pêche, nous avons besoin d'accéder à votre position. Vous pouvez l'activer dans les paramètres.",
            [
              { text: "Annuler", style: "cancel" },
              { text: "Ouvrir les paramètres", onPress: () => Linking.openSettings() }
            ]
          );
        } else if (Platform.OS === 'android') {
          const { canAskAgain } = await Location.getForegroundPermissionsAsync();
          if (!canAskAgain) {
            Alert.alert(
              "Accès à la localisation requis",
              "Pour utiliser toutes les fonctionnalités de Fish It, veuillez activer la localisation dans les paramètres de votre appareil.",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Ouvrir les paramètres", onPress: () => Linking.openSettings() }
              ]
            );
          } else {
            Alert.alert(
              "Accès à la localisation refusé",
              "Pour profiter pleinement de Fish It et trouver les meilleurs spots de pêche, nous avons besoin d'accéder à votre position.",
              [
                { text: "Annuler", style: "cancel" },
                { text: "Réessayer", onPress: handleRequestLocation }
              ]
            );
          }
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderLocationContent = () => {
    if (permissionStatus === 'granted') {
      return (
        <Text style={[styles.locationGrantedText, { color: textColor }]}>
          ✓ {locationInfo || "Localisation activée"}
        </Text>
      );
    } else {
      return (
        <TouchableOpacity
          style={[styles.locationButton, { backgroundColor: darkTealColor }]}
          onPress={handleRequestLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText} numberOfLines={1}>Activer la localisation</Text>
          )}
        </TouchableOpacity>
      );
    }
  };
  
  const renderAuthButtons = () => {
    return (
      <View style={styles.authButtonsContainer}>
        <TouchableOpacity
          style={[styles.authButton, { backgroundColor: darkTealColor, marginBottom: 40 }]}
          onPress={navigateToLogin}
        >
          <Text style={styles.buttonText} numberOfLines={1}>Se connecter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.authButton, { 
            backgroundColor: '#FFFFFF', 
        
          }]}
          onPress={navigateToSignup}
        >
          <Text style={[styles.buttonText, { color: darkTealColor }]} numberOfLines={1}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderNormalButton = () => {
    return (
      <TouchableOpacity
        style={[styles.authButton, { backgroundColor: darkTealColor }]}
        onPress={completeOnboarding}
      >
        <Text style={styles.buttonText} numberOfLines={1}>Commencer</Text>
      </TouchableOpacity>
    );
  };
  
  const renderSlideContent = () => {
    if (item.isLocationSlide) {
      return renderLocationContent();
    } else if (item.isAuthSlide) {
      return renderAuthButtons();
    } else if (item.showButton) {
      return renderNormalButton();
    }
    
    return null;
  };
  
  const getTitleFontSize = () => {
    return item.isAuthSlide ? 60 : 45; 
  };
  
  const getDescriptionFontSize = () => {
    return item.isAuthSlide ? 32 : 20; 
  };
  
  const renderDescription = () => {
    if (item.isAuthSlide) {
      return (
        <Text style={[styles.subtitle, { color: textColor, fontSize: getDescriptionFontSize() }]}>
          Explore les eaux,{"\n"}Capture l'instant.
        </Text>
      );
    } else {
      return (
        <Text style={[styles.description, { color: textColor, textAlign: 'left', fontSize: getDescriptionFontSize() }]}>
          {item.description}
        </Text>
      );
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
        <View style={styles.leftAlignedHeaderContainer}>
          <Text style={[styles.title, { color: textColor, fontSize: getTitleFontSize() }]}>
            {item.isAuthSlide ? "FishIt" : item.title}
          </Text>
          
          {renderDescription()}
        </View>
        
        <View style={styles.buttonContainer}>
          {renderSlideContent()}
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)', 
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 100,
    width: '100%',
    zIndex: 1,
  },
  leftAlignedHeaderContainer: {
    alignItems: 'flex-start', 
    alignSelf: 'flex-start', 
    marginBottom: 20,
    marginLeft: 10,
    marginTop: 40, // Ajout de 40 pixels de marge en haut
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    textAlign: 'left', 
  },
  subtitle: {
    textAlign: 'left',
    lineHeight: 40,
    marginTop: 5,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  description: {
    lineHeight: 30, 
    marginTop: 5,
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 60,
  },
  authButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    width: "80%", 
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    width: "auto", 
    minWidth: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  authButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  locationGrantedText: {
    fontSize: 24, 
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  }
});

export default SlideItem;