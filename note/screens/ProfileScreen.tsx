import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { InputWithLabel, AppButton } from '../components/UI';
import { useAuth } from '../AuthContext';
import Config from '../Config';

const ProfileScreen = ({ navigation }: any) => {
  const { user, logout, updateUser } = useAuth();
  const [noteCount, setNoteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Edit profile state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePassword, setChangePassword] = useState(false);

  // Delete account state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = () => {
    if (!user) return;

    fetch(`${Config.settings.serverPath}/api/users/${user.id}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.noteCount !== undefined) {
          setNoteCount(data.noteCount);
        }
      })
      .catch((error) => console.error('Error loading profile:', error));
  };

  // ===== EDIT PROFILE =====
  const openEditModal = () => {
    setEditUsername(user?.username || '');
    setEditEmail(user?.email || '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setChangePassword(false);
    setEditModalVisible(true);
  };

  const handleUpdateProfile = () => {
  if (!editUsername.trim() || !editEmail.trim()) {
    Alert.alert('Error', 'Username and email are required');
    return;
  }

  if (!currentPassword) {
    Alert.alert('Error', 'Please enter your current password');
    return;
  }

  if (changePassword) {
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 3) {
      Alert.alert('Error', 'New password must be at least 3 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
  }

  setIsLoading(true);

  // Build request body
  const requestBody: any = {
    username: editUsername.trim(),
    email: editEmail.trim(),
    currentPassword: currentPassword,
  };

  // Only include newPassword if user wants to change password
  if (changePassword && newPassword) {
    requestBody.newPassword = newPassword;
  }

  const url = `${Config.settings.serverPath}/api/users/${user?.id}`;
  console.log('Update URL:', url);
  console.log('Request body:', { ...requestBody, currentPassword: '***', newPassword: '***' });

  fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })
    .then(async (response) => {
      console.log('Response status:', response.status);
      
      // Get the response text first
      const text = await response.text();
      console.log('Response text:', text);
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Server returned invalid response: ' + text.substring(0, 100));
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }
      
      return data;
    })
    .then((data) => {
      console.log('Update success:', data);
      updateUser({
        id: user?.id || 0,
        username: data.username,
        email: data.email,
      });
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    })
    .catch((error) => {
      console.error('Update error:', error);
      Alert.alert('Update Failed', error.message);
    })
    .finally(() => {
      setIsLoading(false);
    });
};

  // ===== DELETE ACCOUNT =====
  const handleDeleteAccount = () => {
    if (!deletePassword) {
      Alert.alert('Error', 'Please enter your password to delete account');
      return;
    }

    Alert.alert(
      '⚠️ Delete Account',
      'This action is PERMANENT and cannot be undone!\n\n' +
      'All your notes will be deleted.\n\n' +
      'Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE MY ACCOUNT',
          style: 'destructive',
          onPress: () => confirmDeleteAccount(),
        },
      ]
    );
  };

  const confirmDeleteAccount = () => {
    setIsLoading(true);

    fetch(`${Config.settings.serverPath}/api/users/${user?.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ password: deletePassword }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.error || 'Delete failed');
          });
        }
        return response.json();
      })
      .then(() => {
        setDeleteModalVisible(false);
        logout();
        Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      })
      .catch((error) => {
        Alert.alert('Delete Failed', error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: () => {
          logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{noteCount}</Text>
            <Text style={styles.statLabel}>Notes</Text>
          </View>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <InputWithLabel
          label="Username"
          editable={false}
          value={user?.username || ''}
        />
        <InputWithLabel
          label="Email"
          editable={false}
          value={user?.email || ''}
        />
      </View>

      {/* Buttons */}
      <AppButton
        title="✏️ Edit Profile"
        onPress={openEditModal}
        theme="primary"
      />
      <AppButton
        title="🚪 Logout"
        onPress={handleLogout}
        theme="warning"
      />
      <AppButton
        title="🗑️ Delete Account"
        onPress={() => setDeleteModalVisible(true)}
        theme="danger"
      />

      {/* ===== EDIT PROFILE MODAL ===== */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Profile</Text>

              <InputWithLabel
                label="Username"
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Enter username"
              />

              <InputWithLabel
                label="Email"
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter email"
                keyboardType="email-address"
              />

              <InputWithLabel
                label="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Required to save changes"
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.togglePassword}
                onPress={() => setChangePassword(!changePassword)}
              >
                <Text style={styles.togglePasswordText}>
                  {changePassword ? '🔒' : '🔓'} Change Password
                </Text>
              </TouchableOpacity>

              {changePassword && (
                <>
                  <InputWithLabel
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry
                  />
                  <InputWithLabel
                    label="Confirm New Password"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Confirm new password"
                    secureTextEntry
                  />
                </>
              )}

              {isLoading ? (
                <ActivityIndicator size="large" color="#6200ee" style={{ margin: 20 }} />
              ) : (
                <>
                  <AppButton
                    title="💾 Save Changes"
                    onPress={handleUpdateProfile}
                    theme="success"
                  />
                  <AppButton
                    title="❌ Cancel"
                    onPress={() => setEditModalVisible(false)}
                    theme="danger"
                  />
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ===== DELETE ACCOUNT MODAL ===== */}
      <Modal
        visible={deleteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🗑️ Delete Account</Text>
            
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                ⚠️ WARNING: This action is PERMANENT!
              </Text>
              <Text style={styles.warningSubtext}>
                • All your notes will be deleted{'\n'}
                • This cannot be undone{'\n'}
                • You will be logged out immediately
              </Text>
            </View>

            <InputWithLabel
              label="Enter your password to confirm"
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholder="Type your password"
              secureTextEntry
            />

            {isLoading ? (
              <ActivityIndicator size="large" color="#f44336" style={{ margin: 20 }} />
            ) : (
              <>
                <AppButton
                  title="🗑️ DELETE MY ACCOUNT"
                  onPress={handleDeleteAccount}
                  theme="danger"
                />
                <AppButton
                  title="❌ Cancel"
                  onPress={() => setDeleteModalVisible(false)}
                  theme="primary"
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
  },
  profileCard: {
    backgroundColor: '#6200ee',
    borderRadius: 15,
    padding: 25,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#6200ee',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 46,
    fontWeight: 'bold',
    color: 'white',
  },
  username: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
  },
  email: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
  },
  togglePassword: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  togglePasswordText: {
    fontSize: 18,
    color: '#6200ee',
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#fff3e0',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6d00',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 5,
  },
  warningSubtext: {
    fontSize: 16,
    color: '#bf360c',
    lineHeight: 20,
  },
});

export default ProfileScreen;