import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Linking, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';

const globalLocationCache: { [key: string]: any } = {};
const globalGeocodeCache: { [key: string]: any } = {};

interface FilteredLocationData {
  libelle_station: string;
  libelle_commune: string;
  libelle_departement: string;
  latitude: number;
  longitude: number;
  code_commune: string;
  profondeur: number;
  poissons: {
    nom: string;
    nombreTrouve: number;
  }[];
  timestamp?: number;
}

interface UserLocationData {
  latitude: number;
  longitude: number;
  city?: string;
  timestamp?: number;
  latitude: number;
  longitude: number;
  code_commune: string;
  profondeur: number;
  poissons: {
    nom: string;
    nombreTrouve: number;
  }[];
}

interface UserLocationData {
  latitude: number;
  longitude: number;
  city?: string;
}

const DetailLocation: React.FC = () => {
  const params = useLocalSearchParams();
  const code = params.code;
  const { height } = Dimensions.get('window');
  const [locationData, setLocationData] = useState<FilteredLocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  
  const isMounted = useRef(true);
  const fetchCount = useRef(0);
  
  const code_operation = code;
  const LOCATION_CACHE_KEY = `location_${code_operation}`;
  const USER_LOCATION_CACHE_KEY = 'user_location_cache';
  const CACHE_EXPIRY = 60 * 60 * 1000;

  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
    return Promise.race([
      fetch(url, options),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('La requête a expiré')), timeout)
      )
    ]);
  };

  const calculateStraightDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }, []);

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  const saveToAsyncStorage = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data to AsyncStorage:', e);
    }
  };

  const getFromAsyncStorage = async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        return JSON.parse(value);
      }
      return null;
    } catch (e) {
      console.error('Failed to read data from AsyncStorage:', e);
      return null;
    }
  };

  const getCityFromNominatim = useCallback(async (latitude: number, longitude: number): Promise<string | null> => {
    const roundedLat = Math.round(latitude * 10000) / 10000;
    const roundedLon = Math.round(longitude * 10000) / 10000;
    const cacheKey = `geocode_${roundedLat}_${roundedLon}`;
    
    if (globalGeocodeCache[cacheKey]) {
      return globalGeocodeCache[cacheKey];
    }
    
    try {
      if (fetchCount.current > 0) {
        await new Promise(resolve => setTimeout(resolve, 500)); 
      }
      fetchCount.current++;
      
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
      
      const response = await fetchWithTimeout(url, {
        headers: {
          'User-Agent': 'FishIt-Mobile-App'
        }
      }, 3000);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      let city = null;
      if (data.address) {
        const address = data.address;
        city = address.city || address.town || address.village || address.municipality || 
                address.district || address.suburb || address.hamlet || 
                (address.state || '') + (address.county ? `, ${address.county}` : '');
      }
      
      if (!city && data.name) city = data.name;
      
      if (city) {
        globalGeocodeCache[cacheKey] = city;
        const geocodeCache = await getFromAsyncStorage('geocode_cache') || {};
        geocodeCache[cacheKey] = city;
        saveToAsyncStorage('geocode_cache', geocodeCache);
      }
      
      return city;
    } catch (error) {
      console.error("Error getting city from Nominatim:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadGeocodeCache = async () => {
      const cache = await getFromAsyncStorage('geocode_cache');
      if (cache) {
        Object.assign(globalGeocodeCache, cache);
      }
    };
    
    loadGeocodeCache();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const cachedLocationData = await getFromAsyncStorage(LOCATION_CACHE_KEY);
        const cachedUserLocation = await getFromAsyncStorage(USER_LOCATION_CACHE_KEY);
        
        let shouldFetchLocation = true;
        let shouldFetchUserLocation = true;
        
        if (cachedLocationData && cachedLocationData.timestamp) {
          const now = Date.now();
          if (now - cachedLocationData.timestamp < CACHE_EXPIRY) {
            setLocationData(cachedLocationData);
            shouldFetchLocation = false;
          }
        }
        
        if (cachedUserLocation && cachedUserLocation.timestamp) {
          const now = Date.now();
          if (now - cachedUserLocation.timestamp < CACHE_EXPIRY) {
            setUserLocation(cachedUserLocation);
            shouldFetchUserLocation = false;
          }
        }
        
        if (!shouldFetchLocation && !shouldFetchUserLocation) {
          setLoading(false);
        } else {
          if (shouldFetchLocation && shouldFetchUserLocation) {
            fetchAllData();
          } else if (shouldFetchLocation) {
            fetchLocationDetails();
          } else if (shouldFetchUserLocation) {
            getUserLocation();
          }
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données en cache:", err);
        fetchAllData();
      }
    };
    
    loadCachedData();
  }, []);
  
  useEffect(() => {
    if (locationData && userLocation) {
      const straightDist = calculateStraightDistance(
        userLocation.latitude, 
        userLocation.longitude, 
        locationData.latitude, 
        locationData.longitude
      );
      
      const estimatedRouteDist = straightDist * 1.3;
      setRouteDistance(estimatedRouteDist);
    }
  }, [locationData, userLocation, calculateStraightDistance]);

  const getUserLocation = async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const { latitude, longitude } = location.coords;
      
      const roundedLat = Math.round(latitude * 10000) / 10000;
      const roundedLon = Math.round(longitude * 10000) / 10000;
      const cacheKey = `geocode_${roundedLat}_${roundedLon}`;
      
      let city = globalGeocodeCache[cacheKey];
      
      if (!city) {
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude,
            longitude
          });
          
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
        } catch (geoErr) {
          console.error("Error with Expo reverse geocoding:", geoErr);
        }
        
        if (!city) {
          city = await getCityFromNominatim(latitude, longitude);
        }
        
        if (city) {
          globalGeocodeCache[cacheKey] = city;
        }
      }
      
      const userLocationData: UserLocationData = {
        latitude,
        longitude,
        city: city || 'Ville inconnue',
        timestamp: Date.now()
      };
      
      if (isMounted.current) {
        setUserLocation(userLocationData);
        await saveToAsyncStorage(USER_LOCATION_CACHE_KEY, userLocationData);
      }
      
      return userLocationData;
    } catch (err) {
      console.error("Erreur lors de l'obtention de la position de l'utilisateur:", err);
      return null;
    }
  };

  const fetchLocationDetails = async () => {
    try {
      if (globalLocationCache[LOCATION_CACHE_KEY]) {
        setLocationData(globalLocationCache[LOCATION_CACHE_KEY]);
        return globalLocationCache[LOCATION_CACHE_KEY];
      }
      
      if (fetchCount.current > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      fetchCount.current++;
      
      const response = await fetchWithTimeout(
        `https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs?code_operation=${code_operation}`,
        {},
        8000
      );
      
      if (!response.ok) throw new Error('Problème lors de la récupération des données');
      
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const rawData = data.data[0];
        const filteredData: FilteredLocationData = {
          libelle_station: rawData.libelle_station,
          code_commune: rawData.code_commune,
          libelle_commune: rawData.libelle_commune,
          libelle_departement: rawData.libelle_departement,
          latitude: rawData.latitude,
          longitude: rawData.longitude,
          profondeur: rawData.ipr_profondeur,
          poissons: [],
          timestamp: Date.now()
        };
        
        if (rawData.ipr_noms_communs_taxon && rawData.ipr_noms_communs_taxon.length > 0 && rawData.ipr_effectifs_taxon) {
          filteredData.poissons = rawData.ipr_noms_communs_taxon
            .map((nom: string, index: number) => ({
              nom,
              nombreTrouve: rawData.ipr_effectifs_taxon[index] || 0
            }))
            .filter((poisson: { nom: string; nombreTrouve: number }) => poisson.nombreTrouve > 0);
        }
        
        if (isMounted.current) {
          setLocationData(filteredData);
          globalLocationCache[LOCATION_CACHE_KEY] = filteredData;
          await saveToAsyncStorage(LOCATION_CACHE_KEY, filteredData);
        }
        
        return filteredData;
      } else {
        if (isMounted.current) {
          setError('Aucune donnée trouvée pour cet identifiant');
        }
        return null;
      }
    } catch (err) {
      if (isMounted.current) {
        setError((err as Error).message);
      }
      return null;
    }
  };

  const fetchAllData = async () => {
    try {
      const results = await Promise.all([
        fetchLocationDetails(),
        getUserLocation()
      ]);
      
      if (results[0] && results[1] && isMounted.current) {
        const straightDist = calculateStraightDistance(
          results[1].latitude,
          results[1].longitude,
          results[0].latitude,
          results[0].longitude
        );
        
        const estimatedRouteDist = straightDist * 1.3;
        setRouteDistance(estimatedRouteDist);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const openMapsWithDirections = useCallback(() => {
    if (!locationData) return;
    
    const { latitude, longitude } = locationData;
    const label = encodeURIComponent(locationData.libelle_station);
    
    let url;
    let googleMapsUrl;
    
    if (userLocation) {
      const origin = `${userLocation.latitude},${userLocation.longitude}`;
      const destination = `${latitude},${longitude}`;
      
      url = Platform.select({
        ios: `maps:?saddr=${origin}&daddr=${destination}&dirflg=w`,
        android: `google.navigation:q=${destination}&mode=w`
      });
      
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
    } else {
      const latLng = `${latitude},${longitude}`;
      
      url = Platform.select({
        ios: `maps:?q=${label}&ll=${latLng}&dirflg=w`,
        android: `geo:${latLng}?q=${latLng}(${label})&mode=w`
      });
      
      googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&travelmode=walking`;
    }
    
    Linking.canOpenURL(url!)
      .then(supported => {
        if (supported) {
          return Linking.openURL(url!);
        } else {
          return Linking.openURL(googleMapsUrl);
        }
      })
      .catch(err => {
        console.error('An error occurred', err);
      });
  }, [locationData, userLocation]);

  return (
    <ScrollView>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : locationData ? (
          <>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: locationData.latitude,
                  longitude: locationData.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: locationData.latitude,
                    longitude: locationData.longitude,
                  }}
                  title={locationData.libelle_station}
                />
                {userLocation && (
                  <Marker
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                    title="Votre position"
                    pinColor="blue"
                  />
                )}
              </MapView>
            </View>
            <Text style={styles.locationTitle}>{locationData.libelle_station}</Text>
            <Text style={styles.locationAdress}>{locationData.libelle_commune}, {locationData.libelle_departement}</Text>

            <View style={styles.separator} />

            <View style={styles.statsContainer}>
                <View style={styles.uneStat}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#204553' }}>{locationData.poissons.length}</Text>
                    <Text style={{ fontSize: 16, color: '#8299a4', textAlign: 'center' }}>Nb d'espèces</Text>
                </View>
                <View style={styles.uneStat}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#204553' }}>{locationData.profondeur} m</Text>
                    <Text style={{ fontSize: 16, color: '#8299a4', textAlign: 'center' }}>Profondeur</Text>
                </View>
                <View style={styles.uneStat}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#204553' }}>{locationData.code_commune}</Text>
                    <Text style={{ fontSize: 16, color: '#8299a4', textAlign: 'center' }}>Code postal</Text>
                </View>
            </View>
            
            <View style={styles.separator} />

            {userLocation && (
              <>
                <View style={styles.routeContainer}>
                  <View style={styles.travelContainer}>
                    <View style={styles.pinIconContainer}>
                      <View style={styles.pinIcon} />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#204553' }}>Votre position</Text>
                      <Text style={{ fontSize: 16, color: '#8299a4' }}>
                        {userLocation.city}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.routeInfo}>
                    <View style={styles.dottedLine} />
                    {routeDistance !== null && (
                      <Text style={styles.distanceText}>{routeDistance.toFixed(1)} km</Text>
                    )}
                  </View>

                  <View style={styles.travelContainer}>
                    <View style={styles.pinIconContainer}>
                      <View style={[styles.pinIcon, { backgroundColor: 'red' }]} />
                    </View>
                    <View style={{ marginLeft: 10 }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#204553' }}>Point de destination</Text>
                      <Text style={{ fontSize: 16, color: '#8299a4' }}>
                        {locationData.libelle_station}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity 
              style={[styles.directionsButton, { marginTop: 30 }]}
              onPress={openMapsWithDirections}
            >
              <Text style={styles.directionsButtonText}>Y aller avec Google Maps</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text>Aucune donnée disponible</Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 15,
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#204553',
  },
  locationAdress: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    color: '#8299a4',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  mapContainer: {
    height: 150,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  separator: {
    borderBottomColor: '#ccc',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 15,
  },
  statsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uneStat: {
    width: '30%',
    height: 100,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsButton: {
    backgroundColor: '#204553',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  directionsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }, 
  travelContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  }, 
  pinIconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIcon: {
    width: 16,
    height: 16,
    backgroundColor: 'blue',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 5,
  },
  routeContainer: {
    paddingLeft: 25,
    marginBottom: 10,
  },
  routeInfo: {
    marginLeft: 8,
    paddingLeft: 0,
    position: 'relative',
    height: 90,
  },
  dottedLine: {
    position: 'absolute',
    left: -1,
    top: 0,
    bottom: 0,
    width: 0,
    borderLeftWidth: 2,
    borderLeftColor: '#8299a4',
    borderStyle: 'dashed',
    height: '100%',
  },
  distanceText: {
    position: 'absolute',
    left: 28,
    top: '50%',
    transform: [{ translateY: -10 }],
    fontSize: 18,
    fontWeight: 'bold',
    color: '#204553',
  }
});

export default DetailLocation;