import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { getGirondeFishData } from '@/services/FishDataService';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';

// Configuration API Hub'Eau
const API_BASE_URL = "https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs";

// Mapping des départements avec coordonnées pour la géolocalisation
const DEPARTEMENTS_COORDS = {
  "75": { nom: "Paris", bounds: { minLat: 48.815, maxLat: 48.902, minLng: 2.224, maxLng: 2.470 } },
  "33": { nom: "Gironde", bounds: { minLat: 44.200, maxLat: 45.570, minLng: -1.388, maxLng: 0.042 } },
  "13": { nom: "Bouches-du-Rhône", bounds: { minLat: 43.157, maxLat: 43.758, minLng: 4.628, maxLng: 5.735 } },
  "69": { nom: "Rhône", bounds: { minLat: 45.455, maxLat: 46.305, minLng: 4.247, maxLng: 5.161 } },
  "59": { nom: "Nord", bounds: { minLat: 50.006, maxLat: 51.088, minLng: 2.043, maxLng: 4.234 } },
  "06": { nom: "Alpes-Maritimes", bounds: { minLat: 43.476, maxLat: 44.367, minLng: 6.611, maxLng: 7.737 } },
  // Ajoutez d'autres départements selon vos besoins
};

function getDepartementFromCoords(latitude: number, longitude: number): string | null {
  for (const [code, data] of Object.entries(DEPARTEMENTS_COORDS)) {
    const { bounds } = data;
    if (latitude >= bounds.minLat && latitude <= bounds.maxLat && 
        longitude >= bounds.minLng && longitude <= bounds.maxLng) {
      return code;
    }
  }
  return null;
}

// Liste des départements français
const DEPARTEMENTS_FRANCAIS = [
  { code: "01", nom: "Ain" },
  { code: "02", nom: "Aisne" },
  { code: "03", nom: "Allier" },
  { code: "04", nom: "Alpes-de-Haute-Provence" },
  { code: "05", nom: "Hautes-Alpes" },
  { code: "06", nom: "Alpes-Maritimes" },
  { code: "07", nom: "Ardèche" },
  { code: "08", nom: "Ardennes" },
  { code: "09", nom: "Ariège" },
  { code: "10", nom: "Aube" },
  { code: "11", nom: "Aude" },
  { code: "12", nom: "Aveyron" },
  { code: "13", nom: "Bouches-du-Rhône" },
  { code: "14", nom: "Calvados" },
  { code: "15", nom: "Cantal" },
  { code: "16", nom: "Charente" },
  { code: "17", nom: "Charente-Maritime" },
  { code: "18", nom: "Cher" },
  { code: "19", nom: "Corrèze" },
  { code: "21", nom: "Côte-d'Or" },
  { code: "22", nom: "Côtes-d'Armor" },
  { code: "23", nom: "Creuse" },
  { code: "24", nom: "Dordogne" },
  { code: "25", nom: "Doubs" },
  { code: "26", nom: "Drôme" },
  { code: "27", nom: "Eure" },
  { code: "28", nom: "Eure-et-Loir" },
  { code: "29", nom: "Finistère" },
  { code: "30", nom: "Gard" },
  { code: "31", nom: "Haute-Garonne" },
  { code: "32", nom: "Gers" },
  { code: "33", nom: "Gironde" },
  { code: "34", nom: "Hérault" },
  { code: "35", nom: "Ille-et-Vilaine" },
  { code: "36", nom: "Indre" },
  { code: "37", nom: "Indre-et-Loire" },
  { code: "38", nom: "Isère" },
  { code: "39", nom: "Jura" },
  { code: "40", nom: "Landes" },
  { code: "41", nom: "Loir-et-Cher" },
  { code: "42", nom: "Loire" },
  { code: "43", nom: "Haute-Loire" },
  { code: "44", nom: "Loire-Atlantique" },
  { code: "45", nom: "Loiret" },
  { code: "46", nom: "Lot" },
  { code: "47", nom: "Lot-et-Garonne" },
  { code: "48", nom: "Lozère" },
  { code: "49", nom: "Maine-et-Loire" },
  { code: "50", nom: "Manche" },
  { code: "51", nom: "Marne" },
  { code: "52", nom: "Haute-Marne" },
  { code: "53", nom: "Mayenne" },
  { code: "54", nom: "Meurthe-et-Moselle" },
  { code: "55", nom: "Meuse" },
  { code: "56", nom: "Morbihan" },
  { code: "57", nom: "Moselle" },
  { code: "58", nom: "Nièvre" },
  { code: "59", nom: "Nord" },
  { code: "60", nom: "Oise" },
  { code: "61", nom: "Orne" },
  { code: "62", nom: "Pas-de-Calais" },
  { code: "63", nom: "Puy-de-Dôme" },
  { code: "64", nom: "Pyrénées-Atlantiques" },
  { code: "65", nom: "Hautes-Pyrénées" },
  { code: "66", nom: "Pyrénées-Orientales" },
  { code: "67", nom: "Bas-Rhin" },
  { code: "68", nom: "Haut-Rhin" },
  { code: "69", nom: "Rhône" },
  { code: "70", nom: "Haute-Saône" },
  { code: "71", nom: "Saône-et-Loire" },
  { code: "72", nom: "Sarthe" },
  { code: "73", nom: "Savoie" },
  { code: "74", nom: "Haute-Savoie" },
  { code: "75", nom: "Paris" },
  { code: "76", nom: "Seine-Maritime" },
  { code: "77", nom: "Seine-et-Marne" },
  { code: "78", nom: "Yvelines" },
  { code: "79", nom: "Deux-Sèvres" },
  { code: "80", nom: "Somme" },
  { code: "81", nom: "Tarn" },
  { code: "82", nom: "Tarn-et-Garonne" },
  { code: "83", nom: "Var" },
  { code: "84", nom: "Vaucluse" },
  { code: "85", nom: "Vendée" },
  { code: "86", nom: "Vienne" },
  { code: "87", nom: "Haute-Vienne" },
  { code: "88", nom: "Vosges" },
  { code: "89", nom: "Yonne" },
  { code: "90", nom: "Territoire de Belfort" },
  { code: "91", nom: "Essonne" },
  { code: "92", nom: "Hauts-de-Seine" },
  { code: "93", nom: "Seine-Saint-Denis" },
  { code: "94", nom: "Val-de-Marne" },
  { code: "95", nom: "Val-d'Oise" }
];

interface DepartementData {
  code: string;
  nom: string;
  spotsCount: number;
  speciesCount: number;
  loading: boolean;
}

class ApiEtatPiscicole {
  static async getIndicateursByDepartement(codeDepartement: string) {
    const url = `${API_BASE_URL}?code_departement=${codeDepartement}&size=1000`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      const data = await response.json();
      
      // Calculer le nombre de spots uniques et d'espèces
      const spotsUniques = new Set();
      const especesUniques = new Set();
      const spotsDetails: any[] = [];
      const especesDetails: any[] = [];
      
      data.data?.forEach((indicateur: any) => {
        if (indicateur.code_station) {
          spotsUniques.add(indicateur.code_station);
          
          // Créer une adresse approximative
          let address = '';
          if (indicateur.libelle_commune) {
            address = indicateur.libelle_commune;
            if (indicateur.libelle_departement) {
              address += `, ${indicateur.libelle_departement}`;
            }
          } else if (indicateur.latitude && indicateur.longitude) {
            address = `${indicateur.latitude.toFixed(4)}, ${indicateur.longitude.toFixed(4)}`;
          } else {
            address = 'Adresse non disponible';
          }
          
          // Ajouter les détails du spot
          spotsDetails.push({
            code: indicateur.code_station,
            name: indicateur.libelle_station || `Station ${indicateur.code_station}`,
            commune: indicateur.libelle_commune || 'Commune inconnue',
            latitude: indicateur.latitude,
            longitude: indicateur.longitude,
            address: address
          });
        }
        if (indicateur.ipr_noms_communs_taxon && indicateur.ipr_noms_latins_taxon) {
          indicateur.ipr_noms_communs_taxon.forEach((espece: string, index: number) => {
            if (espece && !especesUniques.has(espece)) {
              especesUniques.add(espece);
              especesDetails.push({
                commonName: espece,
                scientificName: indicateur.ipr_noms_latins_taxon[index] || ''
              });
            }
          });
        }
      });
      
      // Dédupliquer les spots par code
      const uniqueSpots = spotsDetails.filter((spot, index, self) => 
        index === self.findIndex(s => s.code === spot.code)
      );
      
      return {
        success: true,
        spotsCount: spotsUniques.size,
        speciesCount: especesUniques.size,
        totalIndicateurs: data.count || 0,
        spots: uniqueSpots,
        species: especesDetails
      };
    } catch (error) {
      console.error(`Erreur pour département ${codeDepartement}:`, error);
      return {
        success: false,
        spotsCount: 0,
        speciesCount: 0,
        spots: [],
        species: [],
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }
}

export default function FishDataScreen() {
  // États existants pour la région locale
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fishData, setFishData] = useState<any>(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  
  // Nouveaux états pour la géolocalisation
  const [currentDepartement, setCurrentDepartement] = useState<{code: string, nom: string} | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  
  // Nouveaux états pour les départements
  const [currentView, setCurrentView] = useState<'local' | 'departements'>('local');
  const [searchQuery, setSearchQuery] = useState('');
  const [departementsData, setDepartementsData] = useState<DepartementData[]>([]);
  
  const colorScheme = useColorScheme();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentView === 'local' && currentDepartement) {
      loadLocalFishData();
    } else if (currentView === 'departements') {
      initializeDepartements();
    }
  }, [currentView, currentDepartement]);

  // Nouvelle fonction pour obtenir la localisation
  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Fallback vers Gironde si pas de permission
        setCurrentDepartement({ code: '33', nom: 'Gironde' });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      
      const { latitude, longitude } = location.coords;
      const departementCode = getDepartementFromCoords(latitude, longitude);
      
      if (departementCode) {
        const departementInfo = DEPARTEMENTS_FRANCAIS.find(d => d.code === departementCode);
        setCurrentDepartement({ 
          code: departementCode, 
          nom: departementInfo?.nom || DEPARTEMENTS_COORDS[departementCode as keyof typeof DEPARTEMENTS_COORDS]?.nom || 'Département inconnu'
        });
      } else {
        // Fallback vers Gironde si département non trouvé
        setCurrentDepartement({ code: '33', nom: 'Gironde' });
      }
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      // Fallback vers Gironde en cas d'erreur
      setCurrentDepartement({ code: '33', nom: 'Gironde' });
    } finally {
      setLocationLoading(false);
    }
  };

  // Fonction modifiée pour charger les données de la région locale
  const loadLocalFishData = async () => {
    if (!currentDepartement) return;
    
    try {
      setLoading(true);
      setError(null);
      
      if (currentDepartement.code === '33') {
        // Utiliser l'ancien service pour la Gironde
        const data = await getGirondeFishData();
        setFishData(data);
      } else {
        // Utiliser la nouvelle API pour les autres départements
        const result = await ApiEtatPiscicole.getIndicateursByDepartement(currentDepartement.code);
        if (result.success) {
          setFishData({
            spotCount: result.spotsCount,
            allPossibleSpecies: result.species,
            stations: result.spots
          });
        } else {
          setError(result.error || 'Erreur lors du chargement des données');
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Nouvelles fonctions pour les départements
  const initializeDepartements = () => {
    const initialData = DEPARTEMENTS_FRANCAIS.map(dept => ({
      code: dept.code,
      nom: dept.nom,
      spotsCount: 0,
      speciesCount: 0,
      loading: false
    }));
    setDepartementsData(initialData);
    setLoading(false);
  };

  const loadDepartementData = async (departementCode: string) => {
    setDepartementsData(prev => 
      prev.map(dept => 
        dept.code === departementCode 
          ? { ...dept, loading: true }
          : dept
      )
    );

    const result = await ApiEtatPiscicole.getIndicateursByDepartement(departementCode);
    
    setDepartementsData(prev => 
      prev.map(dept => 
        dept.code === departementCode 
          ? { 
              ...dept, 
              loading: false,
              spotsCount: result.spotsCount,
              speciesCount: result.speciesCount
            }
          : dept
      )
    );

    if (!result.success) {
      Alert.alert('Erreur', `Impossible de charger les données pour ${departementCode}`);
    }
  };

  const handleDepartementPress = (departement: DepartementData) => {
    if (!departement.loading) {
      // Navigation vers la page de détail du département
      router.push({
        pathname: '/departement-detail',
        params: { 
          code: departement.code, 
          nom: departement.nom 
        }
      });
    }
  };

  const getDepartementImage = (index: number): any => {
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

  const filteredDepartements = React.useMemo(() => {
    if (!searchQuery.trim()) return departementsData;
    
    const query = searchQuery.toLowerCase();
    return departementsData.filter(dept => 
      dept.nom.toLowerCase().includes(query) || 
      dept.code.includes(query) ||
      `${dept.code} - ${dept.nom}`.toLowerCase().includes(query)
    );
  }, [departementsData, searchQuery]);

  // Navigation vers les détails d'un spot
  const navigateToSpotDetail = (spotCode: string) => {
    router.push({
      pathname: '/detail-location',
      params: { code: spotCode },
    });
  };

  // Composant existant pour la station
  const renderStation = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.stationCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}
      onPress={() => navigateToSpotDetail(item.code)}
      activeOpacity={0.7}
    >
      <View style={styles.stationHeader}>
        <Text style={[styles.stationName, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.name}
        </Text>
        <FontAwesome name="chevron-right" size={14} color="#999" />
      </View>
      <Text style={[styles.communeText, { color: Colors[colorScheme ?? 'light'].text }]}>
        {item.commune}
      </Text>
      <Text style={styles.stationAddress}>
        📍 {item.address || 'Adresse non disponible'}
      </Text>
      <View style={styles.stationFooter}>
        <Text style={styles.stationAction}>
          Appuyez pour voir les détails
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Modal existante pour les espèces
  const renderSpeciesModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showSpeciesModal}
      onRequestClose={() => setShowSpeciesModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colorScheme === 'dark' ? '#444' : '#fff' }]}>
          <Text style={[styles.modalTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Espèces de poissons en {currentDepartement?.nom || 'région locale'}
          </Text>
          <FlatList
            data={fishData?.allPossibleSpecies}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={styles.speciesItem}>
                <Text style={[styles.speciesCommonName, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {item.commonName}
                </Text>
                <Text style={styles.speciesScientificName}>
                  {item.scientificName}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.speciesList}
          />
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => setShowSpeciesModal(false)}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Vue région locale (anciennement Gironde)
  const renderLocalView = () => {
    if (locationLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 20, color: Colors[colorScheme ?? 'light'].text }}>
            Détection de votre localisation...
          </Text>
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 20, color: Colors[colorScheme ?? 'light'].text }}>
            Récupération des données piscicoles...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={loadLocalFishData}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView>
        {fishData && (
          <>
            <View style={[styles.statsCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e7f3ff' }]}>
              <Text style={[styles.statsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                {currentDepartement?.nom || 'Région locale'} - Statistiques
              </Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{fishData.spotCount}</Text>
                  <Text style={styles.statLabel}>Spots</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{fishData.allPossibleSpecies.length}</Text>
                  <Text style={styles.statLabel}>Espèces</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.speciesButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={() => setShowSpeciesModal(true)}
            >
              <Text style={styles.speciesButtonText}>
                Voir toutes les espèces de poissons
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Liste des spots
            </Text>

            {fishData.stations.map((station: any, index: number) => (
              <View key={index}>
                {renderStation({ item: station })}
              </View>
            ))}

            {renderSpeciesModal()}
          </>
        )}
      </ScrollView>
    );
  };

  // Nouvelle vue départements
  const renderDepartementsView = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <FontAwesome name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un département..."
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
        
        {searchQuery.trim() && (
          <Text style={styles.searchResults}>
            {filteredDepartements.length} département{filteredDepartements.length > 1 ? 's' : ''} trouvé{filteredDepartements.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Grid des départements */}
      <View style={styles.departementsGrid}>
        {filteredDepartements.map((departement, index) => (
          <TouchableOpacity 
            key={departement.code}
            style={styles.departementCard}
            onPress={() => handleDepartementPress(departement)}
            disabled={departement.loading}
          >
            <View style={styles.departementImageContainer}>
              <Image
                source={getDepartementImage(index)}
                style={styles.departementBackgroundImage}
                contentFit="cover"
              />
              
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{departement.code}</Text>
              </View>
              
              <View style={styles.departementTextOverlay}>
                <Text style={styles.departementName} numberOfLines={2}>
                  {departement.nom}
                </Text>
                <Text style={styles.departementStats} numberOfLines={1}>
                  Appuyez pour explorer
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Stack.Screen options={{ title: "Spots de pêche" }} />
      
      {/* Tabs de navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, currentView === 'local' && styles.activeTab]}
          onPress={() => setCurrentView('local')}
        >
          <Text style={[styles.tabText, currentView === 'local' && styles.activeTabText]}>
            {currentDepartement?.nom || 'Ma région'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, currentView === 'departements' && styles.activeTab]}
          onPress={() => setCurrentView('departements')}
        >
          <Text style={[styles.tabText, currentView === 'departements' && styles.activeTabText]}>
            Départements
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Contenu selon l'onglet sélectionné */}
      {currentView === 'local' ? renderLocalView() : renderDepartementsView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  // Styles existants
  statsCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e78b7',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  stationCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  communeText: {
    fontSize: 14,
    marginBottom: 3,
  },
  stationAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  stationFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  stationAction: {
    fontSize: 12,
    color: '#2e78b7',
    fontWeight: '500',
    textAlign: 'center',
  },
  speciesButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 15,
    alignSelf: 'center',
  },
  speciesButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  speciesList: {
    width: '100%',
  },
  speciesItem: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  speciesCommonName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  speciesScientificName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  // Nouveaux styles pour les tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#204553',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  
  // Nouveaux styles pour les départements
  searchContainer: {
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderColor: '#204553',
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
    color: '#204553',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#204553',
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
  departementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  departementCard: {
    width: '48%',
    marginBottom: 15,
  },
  departementImageContainer: {
    height: 150,
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  departementBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(32, 69, 83, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  codeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  departementTextOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'transparent',
  },
  departementName: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  departementStats: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 1,
  },
});