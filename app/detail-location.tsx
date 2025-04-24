import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Définition du type pour les données de localisation
interface LocationData {
  libelle_station: string;
  libelle_commune: string;
  libelle_departement: string;
}

const DetailLocation: React.FC = () => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Code d'opération fixe
  const code_operation = '92709';
  
  useEffect(() => {
    const fetchLocationDetails = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(`https://hubeau.eaufrance.fr/api/v1/etat_piscicole/indicateurs?code_operation=${code_operation}`);
        
        if (!response.ok) {
          throw new Error('Problème lors de la récupération des données');
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          setLocationData(data.data[0]);
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
  }, []); // Pas besoin de dépendance car le code_operation est fixe
  
  // Afficher le chargement
  if (loading) {
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
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }
  
  // Afficher les données simples (nom et adresse)
  return (
    <View style={styles.container}>
      {locationData ? (
        <>
          <Text style={styles.title}>{locationData.libelle_station}</Text>
          <Text style={styles.address}>
            {locationData.libelle_commune}, {locationData.libelle_departement}
          </Text>
        </>
      ) : (
        <Text style={styles.noData}>Aucune donnée disponible</Text>
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