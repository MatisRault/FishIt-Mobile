import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, Dimensions, TouchableOpacity, Linking, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

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
}

interface UserLocationData {
  latitude: number;
  longitude: number;
  city?: string;
}

const DetailLocation: React.FC = () => {
  const { height } = Dimensions.get('window');
  const [locationData, setLocationData] = useState<FilteredLocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  const code_operation = '92709';

  const calculateStraightDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };

  const getCityFromNominatim = async (latitude: number, longitude: number): Promise<string | null> => {
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
      console.error("Error getting city from Nominatim:", error);
      return null;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        
        const { latitude, longitude } = location.coords;
        
        // First try to get city using Expo's reverseGeocodeAsync
        let city = null;
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
        
        // If Expo geocoding failed, try Nominatim
        if (!city) {
          city = await getCityFromNominatim(latitude, longitude);
        }
        
        setUserLocation({
          latitude,
          longitude,
          city: city || 'Ville inconnue'
        });
      } catch (err) {
        console.error("Erreur lors de l'obtention de la position de l'utilisateur:", err);
      }
    })();
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
  }, [locationData, userLocation]);

  useEffect(() => {
    const fetchLocationDetails = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(`https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs?code_operation=${code_operation}`);
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
            poissons: []
          };
          if (rawData.ipr_noms_communs_taxon && rawData.ipr_noms_communs_taxon.length > 0 && rawData.ipr_effectifs_taxon) {
            filteredData.poissons = rawData.ipr_noms_communs_taxon
              .map((nom: string, index: number) => ({
                nom,
                nombreTrouve: rawData.ipr_effectifs_taxon[index] || 0
              }))
              .filter((poisson: { nom: string; nombreTrouve: number }) => poisson.nombreTrouve > 0);
          }
          setLocationData(filteredData);
        } else {
          setError('Aucune donnée trouvée pour cet identifiant');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchLocationDetails();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        {locationData ? (
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

            {routeDistance !== null && (
              <View style={styles.distanceContainer}>
                <View style={styles.distanceRow}>
                  <Text style={styles.distanceLabel}>Distance approximative :</Text>
                  <Text style={styles.distanceValue}>{routeDistance.toFixed(1)} km</Text>
                </View>
              </View>
            )}

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

            <Text style={styles.sectionTitle}>Votre position :</Text>
            {userLocation && (
              <View style={styles.userLocationContainer}>
                <Text style={styles.userLocationText}>
                  {userLocation.city}
                </Text>
                <Text style={styles.userCoordinates}>
                  {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.directionsButton}
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
  distanceContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f2f8fa',
    borderRadius: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  distanceLabel: {
    fontSize: 16,
    color: '#204553',
    fontWeight: '500',
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#204553',
  },
  loadingContainer: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
    color: '#204553',
  },
  userLocationContainer: {
    backgroundColor: '#f2f8fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  userLocationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#204553',
    marginBottom: 4,
  },
  userCoordinates: {
    fontSize: 14,
    color: '#8299a4',
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
  }
});

export default DetailLocation;