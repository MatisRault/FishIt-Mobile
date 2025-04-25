import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';

interface LocationData {
  libelle_station: string;
  libelle_commune: string;
  libelle_departement: string;
}

const fetchLocationDetails = async (code_operation: string): Promise<LocationData> => {
  const response = await fetch(`https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs?code_operation=${code_operation}`);
  if (!response.ok) throw new Error('Problème lors de la récupération des données');
  const data = await response.json();
  if (!data.data?.[0]) throw new Error('Aucune donnée trouvée pour cet identifiant');
  return data.data[0];
};

const DetailLocation: React.FC = () => {
  const code_operation = '92709';
  
  const {
    data: locationData,
    isLoading,
    error,
  } = useQuery<LocationData, Error>({
    queryKey: ['location', code_operation],
    queryFn: () => fetchLocationDetails(code_operation),
    retry: 2,
  });

  // Afficher le chargement
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Afficher l'erreur
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  // Afficher les données
  return (
    <View style={styles.container}>
      {locationData && (
        <>
          <Text style={styles.title}>{locationData.libelle_station}</Text>
          <Text style={styles.address}>
            {locationData.libelle_commune}, {locationData.libelle_departement}
          </Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  address: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  noData: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  }
});

export default DetailLocation;