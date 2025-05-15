import { StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import React, { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabOneScreen() {
  const [locationText, setLocationText] = useState('Récupération de votre position...');
  const colorScheme = useColorScheme();
  
  // Animation pour l'effet de pulsation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Démarrer l'animation de pulsation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const getCityFromNominatim = async (latitude: number, longitude: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'FishIt-Mobile-App'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.address) {
        const address = data.address;
        const city = address.city || address.town || address.village || address.municipality || 
                     address.district || address.suburb || address.hamlet || 
                     (address.state || '') + (address.county ? `, ${address.county}` : '');
        
        if (city) return city;
      }
      
      if (data.name) return data.name;
      
      return null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
        
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Location.requestForegroundPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          setLocationText('Permission d\'accès à la localisation refusée');
          return;
        }

        let location = await Location.getCurrentPositionAsync({
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
        
        if (!city) {
          city = await getCityFromNominatim(latitude, longitude);
        }
        
        if (city) {
          setLocationText(`Vous êtes à ${city}`);
        } else {
          setLocationText(`Localisation non disponible`);
        }
      } catch (error) {
        if (error instanceof Error) {
          setLocationText(`Erreur: ${error.message}`);
        } else {
          setLocationText('Une erreur inconnue est survenue');
        }
      }
    })();
  }, []);

  const navigateToDetailLocation = () => {
    router.push('/detail-location');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.locationContainer, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}>
        <Image
          style={styles.image}
          source={require("../../assets/images/marker.svg")}
          contentFit="cover"
          transition={1000}
        />
        <Text style={styles.locationText}>
          {locationText}
        </Text>     
      </View>

      
<Text style={{ fontSize: 34, color: '#204553', marginBottom: 20 }}>
        <Text style={{ fontWeight: 'bold' }}>Explorer</Text> le monde de la pêche
      </Text>
      
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}
          onPress={navigateToDetailLocation}
        >
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Détails spot</Text>
          <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
            Voir les informations détaillées du spot actuel
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0' }]}
        >
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>Spots proches</Text>
          <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].text }]}>
            Découvrez des spots de pêche à proximité
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
        onPress={navigateToDetailLocation}
      >
        <Text style={styles.buttonText}>Voir détails de location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  welcomeCard: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  image: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 16,
    flex: 1,
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
  },
  cardsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    width: '48%',
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});