import { View, Text, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import images from '@/constants/images';
import icons from '@/constants/icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { settings } from '@/constants/data';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const Dashboard = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [image, setImage] = useState(images.avatar);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const parsedUserData = JSON.parse(await AsyncStorage.getItem('userData'));
        if (!parsedUserData || !parsedUserData.id) {
          await AsyncStorage.removeItem('userData');
          router.push('/signin');
          return;
        }
        // Fetch user data from API
        const response = await axios.get(`https://investorlands.com/api/userprofile?id=${parsedUserData.id}`);
        // console.log('API Response:', response.data);

        if (response.data && response.data.data) {
          const apiData = response.data.data;
          setUserData(apiData);

          // Set Profile Image, ensuring fallback to default avatar
          if (apiData.profile_photo_path) {
            setImage(
              apiData.profile_photo_path.startsWith('http')
                ? apiData.profile_photo_path
                : `https://investorlands.com/assets/images/Users/${apiData.profile_photo_path}`
            );
          } else {
            setImage(images.avatar);
          }
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

  const links = [
    { path: '/privacypolicy', label: 'Privacy Policy' },
    { path: '/termsandconditions', label: 'Terms and Conditions' },
    { path: '/userandagentagreement', label: 'User and Agent Agreement' },
    { path: '/cookiespolicy', label: 'Cookies Policy' },
    { path: '/contentandlistingguidelines', label: 'Content and Listing Guidelines' },
    { path: '/dataretentionanddeletionpolicy', label: 'Data Retention and Deletion Policy' },
  ];

  return (
    <SafeAreaView>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-32 px-7">
        {loading ? (
          <ActivityIndicator size="large" color="#8a4c00" style={{ marginTop: 50 }} />
        ) : (
          <View>
            <View className="flex flex-row items-center justify-between my-5">
              <Text className="text-xl font-rubik-bold upper">Dashboard</Text>

              <TouchableOpacity onPress={() => router.back()} className="flex-row bg-gray-300 rounded-full w-11 h-11 items-center justify-center">
                <Image source={icons.backArrow} className="w-5 h-5" />
              </TouchableOpacity>
            </View>

            <View className="flex flex-row items-center ml-2 justify-start shadow bg-white rounded-2xl p-5">
              <Image
                source={typeof image === 'string' ? { uri: image } : image}
                className="size-12 rounded-full"
              />
              <View className="flex flex-col items-start ml-2 justify-center">
                <Text className="text-2xl font-rubik-bold mt-2 text-yellow-800 capitalize">
                  {userData?.name || 'User'}
                </Text>
                {userData && (
                  <View>
                    <Text className="text-black">Email: {userData.email || 'N/A'}</Text>
                    <Text className="text-black">Mobile: {userData.mobile || 'N/A'}</Text>
                    <Text className="text-black capitalize">Role: {userData.user_type || 'N/A'}</Text>
                  </View>
                )}
              </View>
            </View>

            <View className="flex flex-col mt-10 border-t pt-5 border-primary-200">
              <TouchableOpacity onPress={() => router.push('/dashboard/editprofile')} className="flex flex-row items-center py-3">
                <Image source={icons.person} className="size-6" />
                <Text className="text-lg font-rubik-medium text-black-300 ml-3">Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
              {settings.slice(1).map((item, index) => (
                <TouchableOpacity key={index} onPress={() => router.push(item.onPress)} className="flex flex-row items-center py-3">
                  <Image source={item.icon} className="size-6" />
                  <Text className="text-lg font-rubik-medium text-black-300 ml-3">{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
              <TouchableOpacity onPress={handleLogout} className="flex flex-row items-center py-3">
                <Image source={icons.logout} className="size-6" />
                <Text className="text-lg font-rubik-medium text-danger ml-3">Logout</Text>
              </TouchableOpacity>
            </View>

            <View className="flex flex-col mt-10 border-t border-primary-200 pt-5">
              {links.map(({ path, label }, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => router.push(path)}
                  className="flex flex-row items-center py-3"
                >
                  <Text className="text-sm font-rubik text-gray-500 ml-3">{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
