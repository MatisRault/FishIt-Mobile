import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, Alert, Dimensions, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthService } from '@/services/authService';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const router = useRouter();

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const showAlert = (msg: string) => {
    setAlertMsg(msg);
    setAlertVisible(true);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      showAlert('Remplissez tous les champs');
      return;
    }

    if (!validateEmail(email)) {
      showAlert('Email invalide');
      return;
    }

    if (!validatePassword(password)) {
      showAlert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await AuthService.register({ name, email, password });
      showAlert('Inscription réussie ! Vous pouvez maintenant vous connecter');
      setTimeout(() => {
        setAlertVisible(false);
        router.replace('/login');
      }, 1000);
    } catch (error) {
      showAlert(
        error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Background décoratif */}
        <LinearGradient
          colors={['#4F97BC', '#446C7C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={['rgba(19,152,218,0.6)', 'rgba(39,94,114,0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Logo et titre */}
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/logoConne.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Inscription</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#9A9A9A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nom"
              placeholderTextColor="#275E72"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#9A9A9A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#275E72"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#9A9A9A" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor="#275E72"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity 
            style={styles.buttonContainer} 
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>S'inscrire</Text>
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
        <CustomAlert visible={alertVisible} message={alertMsg} onClose={() => setAlertVisible(false)} />
      </View>
    </ScrollView>
  );
}

// Composant d'alerte customisé
function CustomAlert({ visible = true, message, onClose }: { visible?: boolean, message: string, onClose: () => void }) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={alertStyles.overlay}>
        <View style={alertStyles.alertBox}>
          <Text style={alertStyles.alertText}>{message}</Text>
          <TouchableOpacity onPress={onClose} style={alertStyles.closeBtn}>
            <Text style={alertStyles.closeText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    minHeight: height,
  },
  vectorBackground1: {
    position: 'absolute',
    width: width * 1.05,
    height: height * 0.17,
    left: -width * 0.025,
    top: 0,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  vectorBackground2: {
    position: 'absolute',
    width: width * 1.3,
    height: height * 0.45,
    left: -width * 0.65,
    top: height * 0.82,
    borderTopLeftRadius: 200,
    borderTopRightRadius: 200,
    transform: [{ rotate: '5deg' }],
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.05,
    marginBottom: height * 0.05,
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#204553',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#55ACEE',
    borderRadius: 40,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    marginBottom: 20,
    height: 55,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 5,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: '#275E72',
  },
  buttonContainer: {
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#204553',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    marginRight: 10,
  },
  buttonGradient: {
    borderRadius: 18,
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginLeft: 6,
  },

});

// Styles pour l'alerte customisée
const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#4F97BC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 220,
  },
  alertText: {
    color: '#204553',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  closeBtn: {
    backgroundColor: '#4F97BC',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 18,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
