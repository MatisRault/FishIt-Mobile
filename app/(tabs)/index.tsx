import { StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import React, { useState, useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface FishSpecies {
  commonName: string;
  scientificName: string;
}

interface FishSpot {
  code: string;
  name: string;
  commune: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  speciesCount: number;
}

export default function TabOneScreen() {
  const [locationText, setLocationText] = useState('Le Bouscat');
  const [searchQuery, setSearchQuery] = useState('');
  const [fishSpots, setFishSpots] = useState<FishSpot[]>([]);
  const [fishSpecies, setFishSpecies] = useState<FishSpecies[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAllSpots, setShowAllSpots] = useState(false);
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

  // Données statiques pour démarrage rapide
  const staticSpots: FishSpot[] = [
    { 
      code: '1', 
      name: "Étangs de Floirac", 
      commune: "Floirac",
      coordinates: { latitude: 44.8378, longitude: -0.5792 },
      speciesCount: 35
    },
    { 
      code: '2', 
      name: "La Garonne", 
      commune: "Bacalan",
      coordinates: { latitude: 44.8567, longitude: -0.5555 },
      speciesCount: 28
    },
    { 
      code: '3', 
      name: "Lac de Lacanau", 
      commune: "Lacanau",
      coordinates: { latitude: 45.0053, longitude: -1.1953 },
      speciesCount: 32
    },
    { 
      code: '4', 
      name: "Bassin d'Arcachon", 
      commune: "Arcachon",
      coordinates: { latitude: 44.6574, longitude: -1.1657 },
      speciesCount: 42
    },
    { 
      code: '5', 
      name: "Canal de Garonne", 
      commune: "Bordeaux",
      coordinates: { latitude: 44.8404, longitude: -0.5805 },
      speciesCount: 25
    },
    { 
      code: '6', 
      name: "Étang de Cazaux", 
      commune: "Cazaux",
      coordinates: { latitude: 44.5333, longitude: -1.1167 },
      speciesCount: 38
    },
    { 
      code: '7', 
      name: "Lac d'Hourtin", 
      commune: "Hourtin",
      coordinates: { latitude: 45.1833, longitude: -1.0667 },
      speciesCount: 29
    },
    { 
      code: '8', 
      name: "Dordogne", 
      commune: "Libourne",
      coordinates: { latitude: 44.9139, longitude: -0.2417 },
      speciesCount: 31
    },
    { 
      code: '9', 
      name: "Canal latéral", 
      commune: "Castets",
      coordinates: { latitude: 44.2667, longitude: -0.6167 },
      speciesCount: 22
    },
    { 
      code: '10', 
      name: "Étang de Sanguinet", 
      commune: "Sanguinet",
      coordinates: { latitude: 44.4833, longitude: -1.0667 },
      speciesCount: 27
    }
  ];

  const staticSpecies: FishSpecies[] = [
    { commonName: 'Brochet', scientificName: 'Esox lucius' },
    { commonName: 'Carpe', scientificName: 'Cyprinus carpio' },
    { commonName: 'Sandre', scientificName: 'Sander lucioperca' },
    { commonName: 'Perche', scientificName: 'Perca fluviatilis' }
  ];

  // Initialiser avec des données statiques au démarrage
  useEffect(() => {
    setFishSpots(staticSpots);
    setFishSpecies(staticSpecies);
    
    // Charger les vraies données en arrière-plan après 2 secondes
    const timer = setTimeout(() => {
      loadRealData();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Import dynamique pour éviter le blocage au démarrage
      const { getGirondeFishData } = await import('@/services/FishDataService');
      const data = await getGirondeFishData();
      
      // Limiter à 50 spots pour la performance
      const limitedStations = data.stations.slice(0, 50);
      
      const spots: FishSpot[] = limitedStations.map(station => ({
        code: station.code,
        name: station.name,
        commune: station.commune,
        coordinates: station.coordinates,
        speciesCount: Math.min(data.allPossibleSpecies.length, 50)
      }));

      setFishSpots(spots);
      setFishSpecies(data.allPossibleSpecies.slice(0, 8));
      
    } catch (error) {
      console.error('Erreur lors du chargement des vraies données:', error);
      // Garder les données statiques en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const navigateToDetailLocation = (spot: FishSpot) => {
    router.push('/detail-location');
  };

  const getSpotColor = (index: number): string => {
    const colors = ["#4A90A4", "#8FA4B3", "#C5A572", "#7BA474", "#A47B85", "#6B9BD8", "#D4A574", "#8FA47B"];
    return colors[index % colors.length];
  };

  const getSpeciesEmoji = (index: number): string => {
    const emojis = ["🐠", "🐟", "🦈", "🐡"];
    return emojis[index % emojis.length];
  };

  // Spots à afficher (10 premiers ou tous selon showAllSpots)
  const spotsToShow = showAllSpots ? fishSpots : fishSpots.slice(0, 10);

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
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.boldSectionTitle}>Spots</Text> de pêche
                {loading && <ActivityIndicator size="small" color="#8299a4" style={{ marginLeft: 10 }} />}
              </Text>
            </View>
            {fishSpots.length > 10 && (
              <TouchableOpacity onPress={() => setShowAllSpots(!showAllSpots)}>
                <Text style={styles.seeAllText}>
                  {showAllSpots ? 'Voir plus' : `${fishSpots.length} spots`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotsScrollContainer}
            decelerationRate="fast"
            snapToInterval={180} // Largeur de la card + margin pour effet snap
            snapToAlignment="start"
            pagingEnabled={false}
          >
            {(showAllSpots ? fishSpots : fishSpots.slice(0, 10)).map((spot, index) => (
              <TouchableOpacity 
                key={spot.code} 
                style={[styles.spotCard, { marginLeft: index === 0 ? 20 : 0 }]}
                onPress={() => navigateToDetailLocation(spot)}
              >
                <View style={[styles.spotImageContainer, { backgroundColor: getSpotColor(index) }]}>
                  <TouchableOpacity style={styles.bookmarkIcon}>
                    <FontAwesome name="bookmark-o" size={16} color="white" />
                  </TouchableOpacity>
                  
                  {/* Badge de distance si disponible */}
                  {spot.distance && (
                    <View style={styles.distanceBadge}>
                      <Text style={styles.distanceText}>{spot.distance.toFixed(1)} km</Text>
                    </View>
                  )}
                  
                  {/* Texte superposé en bas de l'image */}
                  <View style={styles.spotTextOverlay}>
                    <Text style={styles.spotName} numberOfLines={1}>{spot.name}</Text>
                    <Text style={styles.spotSubtitle} numberOfLines={1}>à {spot.commune}</Text>
                    <Text style={styles.spotSpecies} numberOfLines={1}>
                      {spot.speciesCount} espèces de poissons
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Card "Voir plus" à la fin */}
            {!showAllSpots && fishSpots.length > 10 && (
              <TouchableOpacity 
                style={[styles.spotCard, styles.seeMoreCard]}
                onPress={() => setShowAllSpots(true)}
              >
                <View style={styles.seeMoreContainer}>
                  <FontAwesome name="plus-circle" size={40} color="#204553" />
                  <Text style={styles.seeMoreText}>Voir plus</Text>
                  <Text style={styles.seeMoreSubtext}>+{fishSpots.length - 10} spots</Text>
                </View>
              </TouchableOpacity>
            )}
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
            {fishSpecies.slice(0, 4).map((species, index) => (
              <TouchableOpacity key={index} style={styles.fishCard}>
                <Text style={styles.fishIcon}>{getSpeciesEmoji(index)}</Text>
                <Text style={styles.fishName} numberOfLines={2}>
                  {species.commonName}
                </Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  sectionTitleContainer: {
    backgroundColor: 'transparent',
    flex: 1,
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
    marginRight: 20,
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
  distanceBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  seeMoreCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  seeMoreContainer: {
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#204553',
    borderStyle: 'dashed',
    width: '100%',
  },
  seeMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#204553',
    marginTop: 10,
  },
  seeMoreSubtext: {
    fontSize: 12,
    color: '#8299a4',
    marginTop: 4,
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
    marginBottom: 2,
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
    height: 90,
    backgroundColor: 'white',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    padding: 8,
  },
  fishIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  fishName: {
    fontSize: 9,
    color: '#204553',
    textAlign: 'center',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
});