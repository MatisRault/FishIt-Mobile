import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

export default function TabOneScreen() {
  const navigateToDetailLocation = () => {
    router.push('/detail-location');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fish It</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={navigateToDetailLocation}
      >
        <Text style={styles.buttonText}>Voir détails de location</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  button: {
    marginTop: 20,
    backgroundColor: '#2e78b7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});