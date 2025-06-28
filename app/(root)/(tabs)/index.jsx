import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import images from '@/constants/images';
import icons from '@/constants/icons';
import Search from '@/components/Search';
import { Card, HorizontalCard } from '@/components/Cards';
import Filters from '@/components/Filters';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// import * as Location from 'expo-location';
// import { useNavigation } from "expo-router"; 
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

import { useNavigation } from "@react-navigation/native";
import HomeCarousel from '@/components/HomeCarousel';
import LocationScroll from '@/components/LocationScroll';
import AgentScroll from '@/components/AgentScroll';

// Get screen width for dynamic card sizing
const PADDING_HORIZONTAL = scale(15);
const GAP = scale(10);


const Index = () => {
    const handleCardPress = (id) => router.push(`/properties/${id}`);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [image, setImage] = useState(images.avatar); // Default avatar
    const [listingData, setListingData] = useState(); // Default avatar
    const navigation = useNavigation();


    // const requestLocationPermission = async () => {
    //     const { status } = await Location.requestForegroundPermissionsAsync();

    //     if (status !== 'granted') {
    //         Alert.alert('Permission Denied', 'Location permission is required to show the map.');
    //         return false; // Return false if permission is denied
    //     }

    //     return true; // Return true if permission is granted
    // };


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

    const fetchListingData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://investorlands.com/api/property-listings`);
            if (response.data.data) {
                const apiData = response.data.data;
                setListingData(apiData);
                // console.log('ApiData: ',apiData);

            } else {
                console.error('Unexpected API response format:', response.data);
            }

        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    }

    // useEffect(() => {
    //     (async () => {
    //         const hasPermission = await requestLocationPermission();
    //         if (hasPermission) {
    //             getLocation(); // Call the function instead of writing logic directly inside useEffect
    //         }
    //     })();
    // }, []);

    // Define the getLocation function
    // const getLocation = async () => {
    //     try {
    //         const location = await Location.getCurrentPositionAsync({
    //             accuracy: Location.Accuracy.High,
    //             timeout: 5000, // Prevents infinite hang
    //         });

    //         console.log("User Location:", location);
    //     } catch (error) {
    //         console.error("Location fetch failed, using fallback:", error);
    //         // You can set a default location or show an alert here
    //     }
    // };

    useEffect(() => {
        fetchUserData();
        fetchListingData();
    }, []);

    // console.log('Api listing data: ',listingData);
    return (
        <View className='bg-white h-full'>
            <FlatList
                data={listingData?.data || []}
                renderItem={({ item }) => <Card item={item} onPress={() => handleCardPress(item.id)} />}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerStyle={styles.flatListContent}
                columnWrapperStyle={styles.flatListColumnWrapper}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View className=''>
                        <View className='flex-row items-center justify-between mt-5'>
                            <View className='flex flex-col items-start ml-2 justify-center'>
                                <Text className='text-2xl '>
                                    Hey, <Text className='font-rubik-medium text-primary-300'>{userData?.name?.split(' ')[0] || 'User'} </Text>
                                </Text>
                                <Text className='text-2xl font-rubik text-black'>
                                    Let's Start Exploring
                                </Text>
                            </View>

                            <View className='flex-row items-start  justify-center'>
                                <TouchableOpacity onPress={() => router.push('/notifications')} className='border px-3 py-3 rounded-full'>
                                    <Image source={icons.bell} className='size-6' />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => router.push('/dashboard')} className='flex flex-row items-center ml-2 justify-center border px-1 py-1 rounded-full'>
                                    <Image source={typeof image === 'string' ? { uri: image } : images.avatar} className='size-10 rounded-full ' />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View className='mt-3'>
                            <Search />
                        </View>

                        <View className='my-3'>
                            <Filters />
                        </View>
                        <HomeCarousel />


                        <View className='my-5'>
                            <View className='flex flex-row items-center justify-between mb-5'>
                                <Text className='text-xl font-rubik-bold text-black-300'>Featured Estate</Text>
                                <TouchableOpacity>
                                    <Text className='text-base font-rubik text-primary-300'>See All</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={listingData?.data || []}
                                renderItem={({ item }) => <HorizontalCard item={item} onPress={() => handleCardPress(item.id)} />}
                                keyExtractor={(item) => item.id.toString()}
                                horizontal
                                bounces={false}
                                showsHorizontalScrollIndicator={false}
                                contentContainerClassName='flex gap-5'
                            />
                        </View>

                        <View className='mt-5'>
                            <View className='flex flex-row items-center justify-between'>
                                <Text className='text-xl font-rubik-bold text-black-300'>Top Locations</Text>
                                <TouchableOpacity>
                                    <Text className='text-base font-rubik text-primary-300'>Explore</Text>
                                </TouchableOpacity>
                            </View>
                            <LocationScroll />
                        </View>

                        <AgentScroll />


                        <View className='my-5'>
                            <View className='flex flex-row items-center justify-between'>
                                <Text className='text-xl font-rubik-bold text-black-300'>Our Recommendation</Text>
                                {/* <TouchableOpacity onPress={}>
                                    <Text className='text-base font-rubik-bold text-yellow-800' style={{ color: Colors.brown }}>See All</Text>
                                </TouchableOpacity> */}
                            </View>
                        </View>


                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flatListContent: {
        paddingBottom: verticalScale(100),
        paddingHorizontal: PADDING_HORIZONTAL,
    },
    flatListColumnWrapper: {
        flexDirection: 'row',
        gap: GAP,
    },
});

export default Index;
