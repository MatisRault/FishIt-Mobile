import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity, Image, TextInput, Alert, Modal } from 'react-native';
import { AuthService } from '@/services/authService';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface User {
  name: string;
  email: string;
}

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    router.replace('/login');
  };

  const handleEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const updated = await AuthService.updateUser({ name: editName, email: editEmail });
      setUser(updated);
      setEditMode(false);
      setAlertMsg('Profil mis à jour avec succès');
      setShowAlert(true);
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F97BC" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <CustomAlert message={error} onClose={() => setError('')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F97BC', '#446C7C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={require('../../assets/images/profile-placeholder.png')}
              style={styles.avatar}
            />
          </View>
          {editMode ? (
            <>
              <TextInput
                style={styles.editInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nom"
                placeholderTextColor="#204553"
              />
              <TextInput
                style={styles.editInput}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Email"
                placeholderTextColor="#204553"
                autoCapitalize="none"
              />
            </>
          ) : (
            <>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </>
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {editMode ? (
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={styles.saveText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setEditMode(false)}>
              <Ionicons name="close" size={20} color="#fff" />
              <Text style={styles.saveText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        ) : (<>
          <TouchableOpacity style={styles.menuItem} onPress={handleEdit}>
            <Ionicons name="person-outline" size={24} color="#4F97BC" />
            <Text style={styles.menuText}>Modifier le profil</Text>
            <Ionicons name="chevron-forward" size={20} color="#9A9A9A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#4F97BC" />
            <Text style={styles.menuText}>Aide</Text>
            <Ionicons name="chevron-forward" size={20} color="#9A9A9A" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>Déconnexion</Text>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </>
        )}
      </View>
      <CustomAlert visible={showAlert} message={alertMsg} onClose={() => setShowAlert(false)} />
    </View>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: 'center',
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  content: {
    padding: 20,
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#204553',
    marginLeft: 15,
  },
  editInput: {
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    padding: 10,
    marginVertical: 5,
    width: 220,
    color: '#204553',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F97BC',
    borderRadius: 10,
    padding: 10,
    margin: 10,
    flex: 1,
    justifyContent: 'center',
    elevation: 2,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bbb',
    borderRadius: 10,
    padding: 10,
    margin: 10,
    flex: 1,
    justifyContent: 'center',
    elevation: 2,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    borderRadius: 10,
    padding: 15,
    marginTop: 30,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 10,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
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