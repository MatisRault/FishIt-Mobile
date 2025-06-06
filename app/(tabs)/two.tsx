import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import { getGirondeFishData } from '@/services/FishDataService';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';

interface FishSpecies {
  commonName: string;
  scientificName: string;
}

export default function FishSpeciesScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fishSpecies, setFishSpecies] = useState<FishSpecies[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSpecies, setFilteredSpecies] = useState<FishSpecies[]>([]);
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadFishSpecies();
  }, []);

  useEffect(() => {
    filterSpecies();
  }, [searchQuery, fishSpecies]);

  const loadFishSpecies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getGirondeFishData();
      const sortedSpecies = data.allPossibleSpecies.sort((a, b) => 
        a.commonName.localeCompare(b.commonName)
      );
      
      setFishSpecies(sortedSpecies);
      setFilteredSpecies(sortedSpecies);
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const filterSpecies = () => {
    if (!searchQuery.trim()) {
      setFilteredSpecies(fishSpecies);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = fishSpecies.filter(species =>
      species.commonName.toLowerCase().includes(query) ||
      species.scientificName.toLowerCase().includes(query)
    );
    setFilteredSpecies(filtered);
  };

  const getSpeciesEmoji = (index: number): string => {
    const emojis = ["🐠", "🐟", "🦈", "🐡", "🦞", "🦀", "🐙", "🦑", "🐢", "⭐", "🪼", "🐚"];
    return emojis[index % emojis.length];
  };

  const navigateToSpeciesDetail = (species: FishSpecies, index: number) => {
    router.push({
      pathname: '/species-detail',
      params: { 
        commonName: species.commonName,
        scientificName: species.scientificName,
        emoji: getSpeciesEmoji(index)
      }
    });
  };

  const renderSpeciesCard = ({ item, index }: { item: FishSpecies; index: number }) => (
    <TouchableOpacity 
      style={[styles.speciesCard, { backgroundColor: colorScheme === 'dark' ? '#333' : '#ffffff' }]}
      onPress={() => navigateToSpeciesDetail(item, index)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.emojiContainer}>
          <Text style={styles.speciesEmoji}>{getSpeciesEmoji(index)}</Text>
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.commonName, { color: Colors[colorScheme ?? 'light'].text }]}>
            {item.commonName}
          </Text>
          <Text style={styles.scientificName}>
            {item.scientificName}
          </Text>
        </View>
        
        <FontAwesome name="chevron-right" size={16} color="#999" style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 20, color: Colors[colorScheme ?? 'light'].text }}>
            Chargement des espèces...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.centerContainer}>
          <Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={loadFishSpecies}
          >
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header avec titre et stats */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
          Poissons
        </Text>
        <Text style={styles.subtitle}>
          {filteredSpecies.length} espèce{filteredSpecies.length > 1 ? 's' : ''} trouvée{filteredSpecies.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <FontAwesome name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une espèce..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <FontAwesome name="times-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Liste des espèces */}
      <FlatList
        data={filteredSpecies}
        keyExtractor={(item, index) => `${item.commonName}-${index}`}
        renderItem={renderSpeciesCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={1}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderColor: '#204553',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#204553',
  },
  clearButton: {
    marginLeft: 8,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  speciesCard: {
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E2ECF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  speciesEmoji: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  commonName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  chevron: {
    marginLeft: 10,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});