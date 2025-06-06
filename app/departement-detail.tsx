import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Configuration API Hub'Eau
const API_BASE_URL = "https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs";

interface DepartementDetailData {
  code: string;
  nom: string;
  spotsCount: number;
  speciesCount: number;
  spots: Array<{
    code: string;
    name: string;
    commune: string;
    latitude?: number;
    longitude?: number;
    address?: string;
  }>;
  species: Array<{
    commonName: string;
    scientificName: string;
  }>;
}

class ApiEtatPiscicole {
  static async getFullDepartementData(codeDepartement: string): Promise<DepartementDetailData | null> {
    const url = `${API_BASE_URL}?code_departement=${codeDepartement}&size=2000`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      const data = await response.json();
      
      const spotsMap = new Map();
      const especesMap = new Map();
      
      data.data?.forEach((indicateur: any) => {
        // Collecter les spots uniques
        if (indicateur.code_station && !spotsMap.has(indicateur.code_station)) {
          // Créer une adresse approximative à partir des données disponibles
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

          spotsMap.set(indicateur.code_station, {
            code: indicateur.code_station,
            name: indicateur.libelle_station || `Station ${indicateur.code_station}`,
            commune: indicateur.libelle_commune || 'Commune inconnue',
            latitude: indicateur.latitude,
            longitude: indicateur.longitude,
            address: address
          });
        }
        
        // Collecter les espèces uniques
        if (indicateur.ipr_noms_communs_taxon && indicateur.ipr_noms_latins_taxon) {
          indicateur.ipr_noms_communs_taxon.forEach((espece: string, index: number) => {
            if (espece && !especesMap.has(espece)) {
              especesMap.set(espece, {
                commonName: espece,
                scientificName: indicateur.ipr_noms_latins_taxon[index] || ''
              });
            }
          });
        }
      });
      
      const spots = Array.from(spotsMap.values());
      const species = Array.from(especesMap.values());
      
      return {
        code: codeDepartement,
        nom: '', // Sera rempli par les params
        spotsCount: spots.length,
        speciesCount: species.length,
        spots,
        species
      };
      
    } catch (error) {
      console.error(`Erreur pour département ${codeDepartement}:`, error);
      return null;
    }
  }
}

export default function DepartementDetailScreen() {
  const params = useLocalSearchParams();
  const { code, nom } = params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departementData, setDepartementData] = useState<DepartementDetailData | null>(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [currentView, setCurrentView] = useState<'spots' | 'species'>('spots');
  
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (code) {
      loadDepartementData();
    }
  }, [code]);

  const loadDepartementData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ApiEtatPiscicole.getFullDepartementData(code as string);
      
      if (data) {
        data.nom = nom as string;
        setDepartementData(data);
      } else {
        setError('Aucune donnée trouvée pour ce département');
      }
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSpotDetail = (spotCode: string) => {
    router.push({
      pathname: '/detail-location',
      params: { code: spotCode },
    });
  };

  const renderSpot = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.spotCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}
      onPress={() => navigateToSpotDetail(item.code)}
      activeOpacity={0.7}
    >
      <View style={styles.spotHeader}>
        <FontAwesome name="map-marker" size={16} color="#2e78b7" style={styles.spotIcon} />
        <Text style={[styles.spotName, { color: Colors[colorScheme ?? 'light'].text }]}>
          {item.name}
        </Text>
        <FontAwesome name="chevron-right" size={14} color="#999" />
      </View>
      <Text style={[styles.spotCommune, { color: Colors[colorScheme ?? 'light'].text }]}>
        {item.commune}
      </Text>
      <Text style={styles.spotAddress}>
        📍 {item.address || 'Adresse non disponible'}
      </Text>
      <View style={styles.spotFooter}>
        <Text style={styles.spotAction}>
          Appuyez pour voir les détails
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSpecies = ({ item }: { item: any }) => (
    <View style={styles.speciesCard}>
      <Text style={[styles.speciesCommonName, { color: Colors[colorScheme ?? 'light'].text }]}>
        {item.commonName}
      </Text>
      <Text style={styles.speciesScientificName}>
        {item.scientificName}
      </Text>
    </View>
  );

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
            Toutes les espèces - {departementData?.nom}
          </Text>
          <FlatList
            data={departementData?.species || []}
            keyExtractor={(item, index) => `${item.commonName}-${index}`}
            renderItem={renderSpecies}
            contentContainerStyle={styles.speciesList}
            showsVerticalScrollIndicator={false}
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <Stack.Screen options={{ title: `${nom} - Chargement...` }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 20, color: Colors[colorScheme ?? 'light'].text }}>
            Chargement des données de {nom}...
          </Text>
        </View>
      </View>
    );
  }

  if (error || !departementData) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <Stack.Screen options={{ title: `${nom} - Erreur` }} />
        <View style={styles.centerContainer}>
          <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
            {error || 'Aucune donnée disponible'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={loadDepartementData}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Stack.Screen options={{ title: `${departementData.nom} (${departementData.code})` }} />
      
      {/* Statistiques en en-tête */}
      <View style={[styles.statsCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e7f3ff' }]}>
        <Text style={[styles.statsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {departementData.nom} - Statistiques
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{departementData.spotsCount}</Text>
            <Text style={styles.statLabel}>Spots de pêche</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{departementData.speciesCount}</Text>
            <Text style={styles.statLabel}>Espèces</Text>
          </View>
        </View>
      </View>

      {/* Bouton pour voir toutes les espèces */}
      <TouchableOpacity 
        style={[styles.speciesButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
        onPress={() => setShowSpeciesModal(true)}
      >
        <Text style={styles.speciesButtonText}>
          Voir toutes les espèces de poissons
        </Text>
      </TouchableOpacity>

      {/* Tabs de navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, currentView === 'spots' && styles.activeTab]}
          onPress={() => setCurrentView('spots')}
        >
          <Text style={[styles.tabText, currentView === 'spots' && styles.activeTabText]}>
            Spots ({departementData.spotsCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, currentView === 'species' && styles.activeTab]}
          onPress={() => setCurrentView('species')}
        >
          <Text style={[styles.tabText, currentView === 'species' && styles.activeTabText]}>
            Espèces ({departementData.speciesCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste selon l'onglet sélectionné */}
      {currentView === 'spots' ? (
        <FlatList
          data={departementData.spots}
          keyExtractor={(item) => item.code}
          renderItem={renderSpot}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={departementData.species}
          keyExtractor={(item, index) => `${item.commonName}-${index}`}
          renderItem={renderSpecies}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {renderSpeciesModal()}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 15,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  listContainer: {
    paddingBottom: 20,
  },
  spotCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  spotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  spotIcon: {
    marginRight: 8,
  },
  spotName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  spotCommune: {
    fontSize: 14,
    marginBottom: 3,
  },
  spotAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  spotFooter: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  spotAction: {
    fontSize: 12,
    color: '#2e78b7',
    fontWeight: '500',
    textAlign: 'center',
  },
  speciesCard: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  speciesCommonName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  speciesScientificName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
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
    textAlign: 'center',
  },
  speciesList: {
    width: '100%',
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
});