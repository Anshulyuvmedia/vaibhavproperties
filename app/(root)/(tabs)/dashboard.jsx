import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import images from '@/constants/images';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [image, setImage] = useState(images.avatar);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const parsedUserData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!parsedUserData || !parsedUserData.id) {
        await AsyncStorage.removeItem('userData');
        router.push('/signin');
        return;
      }
      const response = await axios.get(`https://investorlands.com/api/userprofile?id=${parsedUserData.id}`);

      if (response.data && response.data.data) {
        const apiData = response.data.data;
        setUserData(apiData);
        setImage(
          apiData.profile_photo_path
            ? apiData.profile_photo_path.startsWith('http')
              ? apiData.profile_photo_path
              : `https://investorlands.com/assets/images/Users/${apiData.profile_photo_path}`
            : images.avatar
        );
      } else {
        console.error('Unexpected API response format:', response.data);
        setImage(images.avatar);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setImage(images.avatar);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Logged Out', 'You have been logged out successfully.');
      router.push('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  React.useLayoutEffect(() => {
    if (userData?.name) {
      router.setParams?.({ title: userData.name + "'s Dashboard" });
    } else {
      router.setParams?.({ title: 'Dashboard' });
    }
  }, [userData?.name]);

  const links = [
    { path: '/privacypolicy', label: 'Privacy Policy', icon: 'policy' },
    { path: '/termsandconditions', label: 'Terms and Conditions', icon: 'description' },
    { path: '/userandagentagreement', label: 'User and Agent Agreement', icon: 'handshake' },
    { path: '/cookiespolicy', label: 'Cookies Policy', icon: 'cookie' },
    { path: '/contentandlistingguidelines', label: 'Content and Listing Guidelines', icon: 'list' },
    { path: '/dataretentionanddeletionpolicy', label: 'Data Retention and Deletion Policy', icon: 'delete' },
  ];

  const MenuItem = ({ icon, title, onPress, textColor = '#4B5563' }) => (
    <TouchableOpacity
      onPress={onPress}
      style={styles.menuItem}
      activeOpacity={0.7}
    >
      <MaterialIcons name={icon} size={moderateScale(18, 0.3)} color={textColor} />
      <Text style={[styles.menuText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#234F68"
            style={{ marginTop: verticalScale(150) }}
          />
        ) : (
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerText}>Dashboard</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="arrow-back" size={moderateScale(20, 0.3)} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* User Profile Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileContent}>
                <Image
                  source={typeof image === 'string' ? { uri: image } : image}
                  style={styles.profileImage}
                />
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {userData?.name || 'User'}
                  </Text>
                  <Text style={styles.profileDetail}>Email: {userData?.email || 'N/A'}</Text>
                  <View style={styles.profileDetailsRow}>
                    <View>
                      <Text style={styles.profileDetail}>Mobile: {userData?.mobile || 'N/A'}</Text>
                      <Text style={styles.profileDetail}>Role: {userData?.user_type || 'N/A'}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => router.push('/dashboard/editprofile')}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Settings Section */}
            <View style={styles.section}>
              <MenuItem
                icon="notifications"
                title="Notifications"
                onPress={() => router.push('/notifications')}
              />
              <MenuItem
                icon="home"
                title="My Properties"
                onPress={() => router.push('/myproperties')}
              />
            </View>

            {/* Logout Section */}
            <View style={styles.section}>
              <MenuItem
                icon="logout"
                title="Logout"
                onPress={handleLogout}
                textColor="#F75555"
              />
            </View>

            {/* Policies Section (Commented Out) */}
            {/* <View style={styles.policyCard}>
              <Text style={styles.sectionTitle}>Policies</Text>
              {links.map(({ path, label, icon }, index) => (
                <MenuItem
                  key={index}
                  icon={icon}
                  title={label}
                  onPress={() => router.push(path)}
                  textColor="#6B7280"
                />
              ))}
            </View> */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // bg-gray-50
  },
  scrollContent: {
    paddingBottom: verticalScale(60),
    paddingHorizontal: scale(12),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: verticalScale(12),
  },
  headerText: {
    fontSize: moderateScale(20, 0.3),
    fontFamily: 'Rubik-Bold',
    color: '#234F68', // primary-300
  },
  backButton: {
    backgroundColor: '#E5E7EB', // primary-100
    borderRadius: moderateScale(999, 0.3),
    padding: moderateScale(6, 0.3),
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12, 0.3),
    padding: moderateScale(12, 0.3),
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(3, 0.3),
    elevation: 2,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: scale(48),
    height: scale(48),
    borderRadius: moderateScale(24, 0.3),
    borderWidth: 1.5,
    borderColor: '#E5E7EB', // gray-200
  },
  profileInfo: {
    marginLeft: scale(12),
    flex: 1,
  },
  profileName: {
    fontSize: moderateScale(16, 0.3),
    fontFamily: 'Rubik-Bold',
    color: '#1F2937', // gray-800
    textTransform: 'capitalize',
  },
  profileDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: verticalScale(3),
  },
  profileDetail: {
    fontSize: moderateScale(12, 0.3),
    color: '#6B7280', // gray-600
    textTransform: 'capitalize',
  },
  editButton: {
    backgroundColor: '#E5E7EB', // primary-200
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(6, 0.3),
  },
  editButtonText: {
    fontSize: moderateScale(12, 0.3),
    fontFamily: 'Rubik-Medium',
    color: '#234F68', // primary-300
  },
  section: {
    marginBottom: verticalScale(12),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(12),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(10, 0.3),
    marginBottom: verticalScale(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(3, 0.3),
    elevation: 2,
  },
  menuText: {
    marginLeft: scale(10),
    fontSize: moderateScale(14, 0.3),
    fontFamily: 'Rubik-Medium',
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12, 0.3),
    padding: moderateScale(12, 0.3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(3, 0.3),
    elevation: 2,
  },
  sectionTitle: {
    fontSize: moderateScale(16, 0.3),
    fontFamily: 'Rubik-Bold',
    color: '#1F2937', // gray-800
    marginBottom: verticalScale(8),
    paddingHorizontal: scale(6),
  },
});

export default Dashboard;