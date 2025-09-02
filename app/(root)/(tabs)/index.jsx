import { View, Text, Image, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import images from '@/constants/images';
import icons from '@/constants/icons';
import Search from '@/components/Search';
import { Card, HorizontalCard } from '@/components/Cards';
import Filters from '@/components/Filters';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import HomeCarousel from '@/components/HomeCarousel';
import LocationScroll from '@/components/LocationScroll';
import BrokerScroll from '@/components/BrokerScroll';
import BankScroll from '@/components/BankScroll';
import { useTranslation } from 'react-i18next';

// Get screen width for dynamic card sizing
const PADDING_HORIZONTAL = scale(15);
const GAP = scale(10);

const Index = () => {
    const { t, i18n } = useTranslation();
    const handleCardPress = (id) => router.push(`/properties/${id}`);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const [image, setImage] = useState(images.avatar);
    const [listingData, setListingData] = useState();

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const parsedUserData = JSON.parse(await AsyncStorage.getItem('userData'));
            const token = await AsyncStorage.getItem('userToken');
            if (!parsedUserData || !parsedUserData.id) {
                await AsyncStorage.removeItem('userData');
                router.push('/signin');
                return;
            }

            const response = await axios.get(`https://landsquire.in/api/userprofile?id=${parsedUserData.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
            });

            if (response.data && response.data.data) {
                const apiData = response.data.data;
                setUserData(apiData);
                if (apiData.profile) {
                    setImage(
                        apiData.profile.startsWith('http')
                            ? apiData.profile
                            : `https://landsquire.in/adminAssets/images/Users/${apiData.profile}`
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
            setRefreshing(false);
        }
    };

    const fetchListingData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');

            const response = await axios.get(`https://landsquire.in/api/property-listings`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
            });
            if (response.data.data) {
                const apiData = response.data.data;
                setListingData(apiData);
            } else {
                console.error('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching listing data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchUserData();
        fetchListingData();
    };

    useEffect(() => {
        fetchUserData();
        fetchListingData();
    }, []);

    return (
        <View className="flex-1 bg-[#fafafa]">
            <FlatList
                data={listingData?.data || []}
                renderItem={({ item }) => <Card item={item} onPress={() => handleCardPress(item.id)} />}
                keyExtractor={(item) => item.id.toString()}
                numColumns={2}
                contentContainerClassName="pb-[100px] px-[15px]"
                columnWrapperClassName="flex-row gap-[10px]"
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        <View className="flex-row items-center justify-between mt-5">
                            <View className="flex flex-col items-start ml-2 justify-center">
                                <Text
                                    className={`text-2xl ${i18n.language === 'hi' ? 'font-noto-serif-devanagari-medium' : 'font-rubik'} text-black-300`}
                                >
                                    {t('welcome', { name: userData?.username?.split(' ')[0] || 'User' })}
                                    <Text
                                        className={`${i18n.language === 'hi' ? 'font-noto-serif-devanagari-bold' : 'font-rubik-medium'} text-primary-300`}
                                    >
                                        {userData?.username?.split(' ')[0] || 'User'}
                                    </Text>
                                </Text>
                                <Text
                                    className={`text-2xl ${i18n.language === 'hi' ? 'font-noto-serif-devanagari-medium' : 'font-rubik'} text-black-300`}
                                >
                                    {t('startExploring')}
                                </Text>
                            </View>

                            <View className="flex-row items-start justify-center">
                                <TouchableOpacity
                                    onPress={() => router.push('/notifications')}
                                    className="border px-3 py-3 rounded-full"
                                >
                                    <Image source={icons.bell} className="size-6" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => router.push('/dashboard')}
                                    className="flex flex-row items-center ml-2 justify-center border px-1 py-1 rounded-full"
                                >
                                    <Image
                                        source={typeof image === 'string' ? { uri: image } : images.avatar}
                                        className="size-10 rounded-full"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View className="mt-3">
                            <Search />
                        </View>

                        <View className="my-3">
                            <Filters />
                        </View>
                        {/* <HomeCarousel /> */}

                        <View className="my-5">
                            <View className="flex flex-row items-center justify-between mb-5">
                                <Text
                                    className={`text-xl ${i18n.language === 'hi' ? 'font-noto-serif-devanagari-bold' : 'font-rubik-bold'} text-black-300`}
                                >
                                    {t('featuredEstate')}
                                </Text>
                                <TouchableOpacity onPress={() => router.push('properties/explore')}>
                                    <Text
                                        className={`text-base ${i18n.language === 'hi' ? 'font-noto-serif-devanagari-medium' : 'font-rubik'} text-primary-300`}
                                    >
                                        {t('seeAll')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={listingData?.data || []}
                                renderItem={({ item }) => <HorizontalCard item={item} onPress={() => handleCardPress(item.id)} />}
                                keyExtractor={(item) => item.id.toString()}
                                horizontal
                                bounces={false}
                                showsHorizontalScrollIndicator={false}
                                contentContainerClassName="flex gap-5"
                            />
                        </View>

                        <View className="mt-5">
                            <View className="flex flex-row items-center justify-between">
                                <Text
                                    className={`text-xl ${i18n.language === 'hi' ? 'font-noto-serif-devanagari-bold' : 'font-rubik-bold'} text-black-300`}
                                >
                                    {t('topLocations')}
                                </Text>
                                <TouchableOpacity onPress={() => router.push('properties/alllocations')}>
                                    <Text
                                        className={`text-base ${i18n.language === 'hi' ? 'font-noto-serif-devanagari-medium' : 'font-rubik'} text-primary-300`}
                                    >
                                        {t('seeAll')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <LocationScroll />
                        </View>

                        <BrokerScroll />

                        <View className="my-5">
                            <View className="flex flex-row items-center justify-between">
                                <Text
                                    className={`text-xl ${i18n.language === 'hi' ? 'font-noto-serif-devanagari-bold' : 'font-rubik-bold'} text-black-300`}
                                >
                                    {t('ourRecommendation')}
                                </Text>
                            </View>
                        </View>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4A90E2']}
                        tintColor="#4A90E2"
                    />
                }
            />
        </View>
    );
};

export default Index;