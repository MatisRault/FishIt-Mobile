import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { getGirondeFishData } from '@/services/FishDataService';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';

export default function FishDataScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fishData, setFishData] = useState<any>(null);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadFishData();
  }, []);

  const loadFishData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getGirondeFishData();
      setFishData(data);
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderStation = ({ item }: { item: any }) => (
    <View style={[styles.stationCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
      <Text style={[styles.stationName, { color: Colors[colorScheme ?? 'light'].text }]}>
        {item.name}
      </Text>
      <Text style={[styles.communeText, { color: Colors[colorScheme ?? 'light'].text }]}>
        {item.commune} - Station ID: {item.code}
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
            Espèces de poissons en Gironde
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
          onPress={loadFishData}
        >
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Stack.Screen options={{ title: "Spots de pêche - Gironde" }} />
      
      {fishData && (
        <>
          <View style={[styles.statsCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#e7f3ff' }]}>
            <Text style={[styles.statsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Gironde - Statistiques
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
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  communeText: {
    fontSize: 14,
    marginBottom: 5,
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
  }
});