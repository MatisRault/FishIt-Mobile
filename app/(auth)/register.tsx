import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService } from '@/services/authService'; // Import du service

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Erreur', 'Remplissez tous les champs');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Erreur', 'Email invalide');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await AuthService.register({ name, email, password });
      Alert.alert('Inscription réussie', 'Vous pouvez maintenant vous connecter');
      router.replace('/login');
    } catch (error) {
      Alert.alert(
        'Erreur d\'inscription', 
        error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      );
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <View style={styles.container}>
      {/* Background décoratif */}
      <LinearGradient
        colors={['#E3F2FD', '#BBDEFB']}
        style={styles.background}
      />
      <View style={styles.circleTopLeft} />
      <View style={styles.circleBottomRight} />

      {/* Contenu principal */}
      <Image
        source={require('../../assets/images/logoConne.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Inscription</Text>

      <View style={styles.inputContainer}>
        <Ionicons name="person-outline" size={20} color="#55ACEE" style={styles.inputIcon} />
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Nom"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="mail-outline" size={20} color="#55ACEE" style={styles.inputIcon} />
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputContainer}>
        <Ionicons name="lock-closed-outline" size={20} color="#55ACEE" style={styles.inputIcon} />
        <TextInput
          style={styles.inputWithIcon}
          placeholder="Mot de passe"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity onPress={handleRegister}>
        <Text style={styles.buttonText}>Inscription</Text>
        <LinearGradient
          colors={['#4F97BC', '#446C7C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="arrow-forward" size={22} color="white" style={styles.icon} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  circleTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#B3E5FC',
    opacity: 0.4,
  },
  circleBottomRight: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#81D4FA',
    opacity: 0.4,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#204553',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#55ACEE',
    borderRadius: 16,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    marginBottom: 16,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputWithIcon: {
    flex: 1,
    height: '100%',
  },
  buttonText: {
    color: '#204553',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  buttonGradient: {
    padding: 16,
    borderRadius: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginTop: 1,
  },  
});
