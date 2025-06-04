import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Stack } from 'expo-router';

export default function SpotDetailScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const colorScheme = useColorScheme();

  useEffect(() => {
    fetchSpotData();
  }, []);

  const fetchSpotData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs?code_operation=92709');
      
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      
    } catch (err) {
      setError((err as Error).message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const renderDataItem = (label: string, value: any) => (
    <View style={styles.dataRow}>
      <Text style={[styles.dataLabel, { color: Colors[colorScheme ?? 'light'].text }]}>{label}:</Text>
      <Text style={[styles.dataValue, { color: Colors[colorScheme ?? 'light'].text }]}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <Stack.Screen options={{ title: "Détail du spot 92709" }} />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 20, color: Colors[colorScheme ?? 'light'].text }}>
            Chargement des données...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: 'red', textAlign: 'center' }}>
            {error}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#333' : '#f5f5f5' }]}>
            <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              Données de l'API
            </Text>
            
            {data && data.data && data.data.length > 0 ? (
              <View>
                {Object.entries(data.data[0]).map(([key, value], index) => (
                  <View key={index}>
                    {renderDataItem(key, value)}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
                Aucune donnée disponible
              </Text>
            )}
          </View>
        </ScrollView>
      )}
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
  scrollView: {
    flex: 1,
  },
  card: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dataLabel: {
    fontWeight: 'bold',
    flex: 0.4,
  },
  dataValue: {
    flex: 0.6,
  },
});