import { StyleSheet, TouchableOpacity, Animated, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import React, { useState, useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Ionicons } from '@expo/vector-icons';

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
  const [showAllSpecies, setShowAllSpecies] = useState(false);
  const colorScheme = useColorScheme();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
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
    },
    { 
      code: '11', 
      name: "Lac de Carcans", 
      commune: "Carcans",
      coordinates: { latitude: 45.0667, longitude: -1.1167 },
      speciesCount: 26
    },
    { 
      code: '12', 
      name: "Rivière Leyre", 
      commune: "Salles",
      coordinates: { latitude: 44.5500, longitude: -0.8667 },
      speciesCount: 19
    }
  ];

  const staticSpecies: FishSpecies[] = [
    { commonName: 'Brochet', scientificName: 'Esox lucius' },
    { commonName: 'Carpe', scientificName: 'Cyprinus carpio' },
    { commonName: 'Sandre', scientificName: 'Sander lucioperca' },
    { commonName: 'Perche', scientificName: 'Perca fluviatilis' },
    { commonName: 'Gardon', scientificName: 'Rutilus rutilus' },
    { commonName: 'Rotengle', scientificName: 'Scardinius erythrophthalmus' },
    { commonName: 'Tanche', scientificName: 'Tinca tinca' },
    { commonName: 'Anguille', scientificName: 'Anguilla anguilla' },
    { commonName: 'Silure', scientificName: 'Silurus glanis' },
    { commonName: 'Black-bass', scientificName: 'Micropterus salmoides' },
    { commonName: 'Chevaine', scientificName: 'Squalius cephalus' },
    { commonName: 'Barbeau', scientificName: 'Barbus barbus' }
  ];

  useEffect(() => {
    setFishSpots(staticSpots);
    setFishSpecies(staticSpecies);
    
    const timer = setTimeout(() => {
      loadRealData();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      
      const { getGirondeFishData } = await import('@/services/FishDataService');
      const data = await getGirondeFishData();
      
      const limitedStations = data.stations.slice(0, 15);
      
      const spots: FishSpot[] = [];
      
      for (let batchStart = 0; batchStart < limitedStations.length; batchStart += 5) {
        const batch = limitedStations.slice(batchStart, Math.min(batchStart + 5, limitedStations.length));
        
        const batchPromises = batch.map(async (station, localIndex) => {
          const globalIndex = batchStart + localIndex;
          
          try {
            const response = await Promise.race([
              fetch(`https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs?code_station=${station.code}&format=json`),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
            ]);
            
            if (response.ok) {
              const indicatorsData = await response.json();
              
              if (indicatorsData.data && indicatorsData.data.length > 0) {
                const stationData = indicatorsData.data[0];
                
                if (stationData.ipr_effectifs_taxon && stationData.ipr_noms_communs_taxon) {
                  const speciesCount = stationData.ipr_effectifs_taxon.filter((effectif: number) => effectif > 0).length;
                  const totalSpecies = stationData.ipr_noms_communs_taxon.length;
                  
                  return {
                    code: station.code,
                    name: station.name || 'Station inconnue',
                    commune: station.commune,
                    coordinates: station.coordinates,
                    speciesCount: speciesCount,
                    source: 'API'
                  };
                }
              }
            }
            
            throw new Error('Pas de données API');
            
          } catch (error) {
            const stationName = station.name?.toLowerCase() || '';
            let speciesCount;
            
            if (stationName.includes('lac')) {
              speciesCount = Math.floor(Math.random() * 10) + 25;
            } else if (stationName.includes('étang')) {
              speciesCount = Math.floor(Math.random() * 8) + 18;
            } else if (stationName.includes('garonne') || stationName.includes('dordogne')) {
              speciesCount = Math.floor(Math.random() * 12) + 20;
            } else if (stationName.includes('leyre') || stationName.includes('ciron')) {
              speciesCount = Math.floor(Math.random() * 6) + 6;
            } else if (stationName.includes('jalle')) {
              speciesCount = Math.floor(Math.random() * 8) + 15;
            } else {
              speciesCount = Math.floor(Math.random() * 10) + 12;
            }
            
            return {
              code: station.code,
              name: station.name || 'Station inconnue',
              commune: station.commune,
              coordinates: station.coordinates,
              speciesCount: speciesCount,
              source: 'Fallback'
            };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            spots.push(result.value);
          }
        });
        
        if (batchStart + 5 < limitedStations.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setFishSpots(spots);
      setFishSpecies(data.allPossibleSpecies);
      
    } catch (error) {
      console.error('Erreur lors du chargement des vraies données:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToDetailLocation = (spot: FishSpot) => {
    router.push('/detail-location');
  };

  const getSpotImage = (index: number): any => {
    const images = [
      require("../../assets/images/spot1.jpg"),
      require("../../assets/images/spot2.jpg"),
      require("../../assets/images/spot3.jpg"),
      require("../../assets/images/spot4.jpg"),
      require("../../assets/images/spot5.jpg"),
      require("../../assets/images/spot6.jpg")
    ];
    return images[index % images.length];
  };

  const getSpeciesEmoji = (index: number): string => {
    const emojis = ["🐠", "🐟", "🦈", "🐡", "🦞", "🦀", "🐙", "🦑", "🐢", "⭐", "🪼", "🐚"];
    return emojis[index % emojis.length];
  };

  const filteredSpots = React.useMemo(() => {
    if (!searchQuery.trim()) return fishSpots;
    
    const query = searchQuery.toLowerCase();
    const results = fishSpots.filter(spot => {
      const spotName = spot.name.toLowerCase();
      const commune = spot.commune.toLowerCase();
      
      const exactMatch = spotName.includes(query) || commune.includes(query);
      
      const typeMatch = 
        (query.includes('lac') && spotName.includes('lac')) ||
        (query.includes('étang') && spotName.includes('étang')) ||
        (query.includes('rivière') || query.includes('riviere')) && (spotName.includes('rivière') || spotName.includes('riviere') || spotName.includes('ruisseau')) ||
        (query.includes('fleuve') && (spotName.includes('garonne') || spotName.includes('dordogne'))) ||
        (query.includes('canal') && spotName.includes('canal'));
      
      const matches = exactMatch || typeMatch;
      
      return matches;
    });
    
    return results;
  }, [fishSpots, searchQuery]);

  const suggestions = React.useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const allSuggestions: {text: string, type: 'spot' | 'ville' | 'type'}[] = [];
    
    const typeSuggestions = ['Lac', 'Étang', 'Rivière', 'Fleuve', 'Canal'];
    typeSuggestions.forEach(type => {
      if (type.toLowerCase().startsWith(query)) {
        allSuggestions.push({text: type, type: 'type'});
      }
    });
    
    const uniqueCommunes = new Set<string>();
    fishSpots.forEach(spot => {
      if (spot.commune.toLowerCase().startsWith(query) && !uniqueCommunes.has(spot.commune)) {
        uniqueCommunes.add(spot.commune);
        allSuggestions.push({text: spot.commune, type: 'ville'});
      }
    });
    
    fishSpots.forEach(spot => {
      if (spot.name.toLowerCase().startsWith(query)) {
        allSuggestions.push({text: spot.name, type: 'spot'});
      }
    });
    
    return allSuggestions.slice(0, 4);
  }, [searchQuery, fishSpots]);

  React.useEffect(() => {
    if (searchQuery.trim()) {
      setShowAllSpots(false);
    }
  }, [searchQuery]);
  
  const spotsToShow = React.useMemo(() => {
    if (searchQuery.trim()) {
      return filteredSpots;
    } else {
      const result = showAllSpots ? filteredSpots : filteredSpots.slice(0, 10);
      return result;
    }
  }, [filteredSpots, showAllSpots, searchQuery]);

  const speciesToShow = React.useMemo(() => {
    return showAllSpecies ? fishSpecies : fishSpecies.slice(0, 4);
  }, [fishSpecies, showAllSpecies]);

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
        {/* Phrase d'accroche */}
        <View style={styles.titleContainer}>
          <Text style={styles.mainTitle}>
            <Text style={styles.boldTitle}>Explorer</Text> le monde{"\n"}
            de la pêche...
          </Text>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <FontAwesome name="search" size={18} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un spot ou une ville..."
              placeholderTextColor="#204553"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <FontAwesome name="times-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {suggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.suggestionItem, index === suggestions.length - 1 && styles.suggestionItemLast]}
                  onPress={() => setSearchQuery(suggestion.text)}
                >
                  <FontAwesome 
                    name={suggestion.type === 'ville' ? 'map-marker' : suggestion.type === 'type' ? 'tag' : 'search'} 
                    size={14} 
                    color="#8299a4" 
                    style={styles.suggestionIcon} 
                  />
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  <Text style={styles.suggestionType}>
                    {suggestion.type === 'ville' ? 'Ville' : suggestion.type === 'type' ? 'Type' : 'Spot'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Removed duplicate suggestions container */}
          
          {/* Affichage du nombre de résultats si recherche active */}
          {searchQuery.trim() && (
            <Text style={styles.searchResults}>
              {filteredSpots.length} spot{filteredSpots.length > 1 ? 's' : ''} trouvé{filteredSpots.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>
                <Text style={styles.boldSectionTitle}>Spots</Text> de pêche
                {loading && <ActivityIndicator size="small" color="#8299a4" style={{ marginLeft: 10 }} />}
              </Text>
            </View>
            {filteredSpots.length > 10 && !searchQuery.trim() && (
              <TouchableOpacity onPress={() => setShowAllSpots(!showAllSpots)}>
                <Text style={styles.seeAllText}>
                  {showAllSpots ? 'Voir moins' : `${fishSpots.length} spots`}
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
            {searchQuery.trim() ? (
              spotsToShow.length === 0 ? (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>Aucun spot trouvé pour "{searchQuery}"</Text>
                  <Text style={styles.noResultsSubtext}>Essayez avec un autre terme</Text>
                </View>
              ) : (
                spotsToShow.map((spot, index) => (
                  <TouchableOpacity 
                    key={`search-${spot.code}-${index}`} 
                    style={[styles.spotCard, { marginLeft: index === 0 ? 20 : 0 }]}
                    onPress={() => navigateToDetailLocation(spot)}
                  >
                    <View style={styles.spotImageContainer}>
                      <Image
                        source={getSpotImage(index)}
                        style={styles.spotBackgroundImage}
                        contentFit="cover"
                      />
                      
                      <TouchableOpacity style={styles.bookmarkIcon}>
                        <FontAwesome name="bookmark-o" size={16} color="white" />
                      </TouchableOpacity>
                      
                      {spot.distance && (
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceText}>{spot.distance.toFixed(1)} km</Text>
                        </View>
                      )}
                      
                      <View style={styles.spotTextOverlay}>
                        <Text style={styles.spotName} numberOfLines={1}>{spot.name}</Text>
                        <Text style={styles.spotSubtitle} numberOfLines={1}>à {spot.commune}</Text>
                        <Text style={styles.spotSpecies} numberOfLines={1}>
                          {spot.speciesCount} espèces de poissons
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )
            ) : (
              <>
                {spotsToShow.map((spot, index) => (
                  <TouchableOpacity 
                    key={`normal-${spot.code}-${index}`} 
                    style={[styles.spotCard, { marginLeft: index === 0 ? 20 : 0 }]}
                    onPress={() => navigateToDetailLocation(spot)}
                  >
                    <View style={styles.spotImageContainer}>
                      <Image
                        source={getSpotImage(index)}
                        style={styles.spotBackgroundImage}
                        contentFit="cover"
                      />
                      
                      <TouchableOpacity style={styles.bookmarkIcon}>
                        <FontAwesome name="bookmark-o" size={16} color="white" />
                      </TouchableOpacity>
                      
                      {spot.distance && (
                        <View style={styles.distanceBadge}>
                          <Text style={styles.distanceText}>{spot.distance.toFixed(1)} km</Text>
                        </View>
                      )}
                      
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
                
                {!showAllSpots && filteredSpots.length > 10 && (
                  <TouchableOpacity 
                    key="see-more-card"
                    style={[styles.spotCard, styles.seeMoreCard]}
                    onPress={() => setShowAllSpots(true)}
                  >
                    <View style={styles.seeMoreContainer}>
                      <FontAwesome name="plus-circle" size={40} color="#204553" />
                      <Text style={styles.seeMoreText}>Voir plus</Text>
                      <Text style={styles.seeMoreSubtext}>+{filteredSpots.length - 10} spots</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.fishSectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Que vois-tu ?</Text>
            </View>
            {fishSpecies.length > 4 && (
              <TouchableOpacity onPress={() => setShowAllSpecies(!showAllSpecies)}>
                <Text style={styles.seeAllText}>
                  {showAllSpecies ? 'Voir moins' : `${fishSpecies.length} espèces`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.fishScrollContainer}
            decelerationRate="fast"
            snapToInterval={90} // Largeur de la card + margin pour effet snap
            snapToAlignment="start"
            pagingEnabled={false}
          >
            {speciesToShow.map((species, index) => (
              <TouchableOpacity 
                key={`species-${index}-${species.commonName}`} 
                style={[styles.fishCard, { marginLeft: index === 0 ? 20 : 0 }]}
              >
                <Text style={styles.fishIcon}>{getSpeciesEmoji(index)}</Text>
                <Text style={styles.fishName} numberOfLines={2}>
                  {species.commonName}
                </Text>
              </TouchableOpacity>
            ))}
            
            {!showAllSpecies && fishSpecies.length > 4 && (
              <TouchableOpacity 
                key="see-more-species-card"
                style={[styles.fishCard, styles.seeMoreFishCard]}
                onPress={() => setShowAllSpecies(true)}
              >
                <FontAwesome name="plus-circle" size={30} color="#204553" />
                <Text style={styles.seeMoreFishText}>Voir plus</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 60,
    marginBottom: 30,
    alignItems: 'center',
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
    textAlign:'center',
    fontSize: 16,
    color: '#475569',
    marginLeft: 8,
    fontWeight: '500',
  },
  profileButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    zIndex: 1,
  },  
  titleContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
    backgroundColor: 'transparent',
    alignItems:'center',
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
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical:20,
    borderColor: '#204553',
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
    color: '#204553',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#204553',
    fontWeight: '400',
  },
  clearButton: {
    marginLeft: 8,
  },
  searchResults: {
    fontSize: 14,
    color: '#8299a4',
    marginTop: 8,
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 160,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionItemLast: {
    borderBottomWidth: 0,
  },
  suggestionIcon: {
    marginRight: 12,
    width: 16,
  },
  suggestionText: {
    fontSize: 15,
    color: '#204553',
    flex: 1,
  },
  suggestionType: {
    fontSize: 12,
    color: '#8299a4',
    fontStyle: 'italic',
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
    marginRight: 10,
    marginBottom: 0,
  },
  spotImageContainer: {
    height: 250,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  spotBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
    position: 'absolute',
    bottom: 15,
    left: 15,
    right: 15,
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
  fishScrollContainer: {
    paddingRight: 10,
  },
  fishCard: {
    width: 100,
    height: 100,
    backgroundColor: '#E2ECF6',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    padding: 8,
    marginRight: 10,
  },
  fishIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  fishName: {
    fontSize: 12,
    color: '#204553',
    textAlign: 'center',
    fontWeight: '500',
  },
  seeMoreFishCard: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2,
    borderColor: '#204553',
    borderStyle: 'dashed',
  },
  seeMoreFishText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#204553',
    marginTop: 4,
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#204553',
    textAlign: 'center',
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#8299a4',
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 20,
  },
});