import { StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import React, { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function TabOneScreen() {
  const [locationText, setLocationText] = useState('Récupération de votre position...');
  const [searchQuery, setSearchQuery] = useState('');
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
        
        if (existingStatus !== 'granted') {
          setLocationText('Le Bouscat');
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
          setLocationText(city);
        } else {
          setLocationText('Le Bouscat');
        }
      } catch (error) {
        setLocationText('Le Bouscat');
      }
    })();
  }, []);

  const navigateToDetailLocation = () => {
    router.push('/detail-location');
  };

  // Données des spots selon la maquette
  const popularSpots = [
    { 
      id: 1, 
      name: "Étangs de Floirac", 
      subtitle: "à Floirac",
      species: "35 espèces de poissons",
      color: "#4A90A4"
    },
    { 
      id: 2, 
      name: "La Garonne", 
      subtitle: "à Bacalan",
      species: "28 espèces de poissons",
      color: "#8FA4B3"
    },
    { 
      id: 3, 
      name: "Lac de", 
      subtitle: "Lacanau",
      species: "32 espèces de poissons",
      color: "#C5A572"
    },
  ];

  // Poissons de la section "Que vois-tu ?"
  const fishOptions = [
    "🐠", "🐟", "🐠", "🐟"
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header avec localisation */}
        <View style={styles.headerContainer}>
          <View style={styles.locationContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Image
                style={styles.image}
                source={require("../../assets/images/marker.svg")}
                contentFit="cover"
                transition={1000}
              />
            </Animated.View>
            <Text style={styles.locationText}>
              Vous êtes à {locationText}
            </Text>     
          </View>
        </View>

        {/* Titre principal */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>
            <Text style={styles.boldTitle}>Explorer</Text> le monde{"\n"}
            de la pêche
          </Text>
        </View>
        
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <FontAwesome name="search" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Recherche"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Section Places Populaires */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>
              <Text style={styles.boldSectionTitle}>Places</Text> populaires
            </Text>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotsScrollContainer}
          >
            {popularSpots.map((spot, index) => (
              <TouchableOpacity 
                key={spot.id} 
                style={[styles.spotCard, { marginLeft: index === 0 ? 20 : 0 }]}
                onPress={navigateToDetailLocation}
              >
                <View style={[styles.spotImageContainer, { backgroundColor: spot.color }]}>
                  <TouchableOpacity style={styles.bookmarkIcon}>
                    <FontAwesome name="bookmark-o" size={16} color="white" />
                  </TouchableOpacity>
                  
                  {/* Texte superposé en bas de l'image */}
                  <View style={styles.spotTextOverlay}>
                    <Text style={styles.spotName}>{spot.name}</Text>
                    <Text style={styles.spotSubtitle}>{spot.subtitle}</Text>
                    <Text style={styles.spotSpecies}>{spot.species}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Section Que vois-tu ? */}
        <View style={styles.sectionContainer}>
          <View style={styles.fishSectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Que vois-tu ?</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Tout afficher</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.fishGrid}>
            {fishOptions.map((fish, index) => (
              <TouchableOpacity key={index} style={styles.fishCard}>
                <Text style={styles.fishIcon}>{fish}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Espace pour la tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#969FA330',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 30,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  image: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  locationText: {
    fontSize: 16,
    color: '#475569',
    marginLeft: 8,
    fontWeight: '500',
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: '300',
    color: '#204553',
    lineHeight: 40,
  },
  boldTitle: {
    fontWeight: '700',
    color: '#204553',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#204553',
    fontWeight: '400',
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionTitleContainer: {
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: '#204553',
    marginBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  boldSectionTitle: {
    fontWeight: '700',
    color: '#204553',
  },
  spotsScrollContainer: {
    paddingRight: 20,
  },
  spotCard: {
    width: 160,
    marginRight: 16,
    marginBottom: 20,
  },
  spotImageContainer: {
    height: 200,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 15,
  },
  bookmarkIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  spotTextOverlay: {
    backgroundColor: 'transparent',
  },
  spotName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  spotSubtitle: {
    fontSize: 14,
    color: 'white',
    marginBottom: 4,
  },
  spotSpecies: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  fishSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8299a4',
    fontWeight: '500',
  },
  fishGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  fishCard: {
    width: 70,
    height: 70,
    backgroundColor: 'white',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fishIcon: {
    fontSize: 32,
  },
  bottomSpacer: {
    height: 100,
  },
});