import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import React, { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Image } from 'expo-image';


export default function TabOneScreen() {
  const [locationText, setLocationText] = useState('Récupération de votre position...');

  const getCityFromNominatim = async (latitude, longitude) => {
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
        setLocationText(`Erreur: ${error.message}`);
      }
    })();
  }, []);

  const navigateToDetailLocation = () => {
    router.push('/detail-location');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fish It</Text>
      
      <View style={styles.locationContainer}>
      <Image
        style={styles.image}
        source={require("../../assets/images/marker.svg")}
        contentFit="cover"
        transition={1000}
      />
        <Text style={styles.locationText}>
          {locationText}</Text>
      </View>
      
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      
      <EditScreenInfo path="app/(tabs)/index.tsx" />
      
      <TouchableOpacity
        style={styles.button}
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  image: {
    width: 20,
    height: 20,
  },
  locationContainer: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    width: '80%',
    marginTop: 10,
  },
  locationText: {
    fontSize: 16,
    textAlign: 'center',
  },
  separator: {
    marginVertical: 20,
    height: 1,
    width: '80%',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#2e78b7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});