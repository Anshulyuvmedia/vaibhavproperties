import { View, Text, Image, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { v4 as uuidv4 } from 'uuid';

const PADDING_HORIZONTAL = scale(15);
const GAP = scale(10);
const LIMIT = 10; // Adjust based on API

const Index = () => {
    const { t, i18n } = useTranslation();
    const handleCardPress = (id) => router.push(`/properties/${id}`);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const [image, setImage] = useState(images.avatar);
    const [listingData, setListingData] = useState([]);
    const [rentListingData, setRentListingData] = useState([]);
    const [featuredData, setFeaturedData] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

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

    const fetchListingData = async (page = 1) => {
        if (!hasMore && page !== 1) return;
        setLoading(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const response = await axios.get(`https://landsquire.in/api/property-listings?page=${page}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
            });

            console.log('Raw API Response:', JSON.stringify(response.data, null, 2));

            const listings = response.data?.data;

            if (Array.isArray(listings)) {
                const idMap = new Map();
                const normalized = listings.map((item, index) => {
                    let uniqueId = item.id && typeof item.id === 'string' && item.id.trim() !== ''
                        ? item.id
                        : uuidv4(); // Use UUID if id is missing or invalid
                    if (idMap.has(uniqueId)) {
                        uniqueId = `${uniqueId}_${index}_${page}`; // Append index and page for uniqueness
                        console.warn(`Duplicate ID detected, assigning new ID: ${uniqueId}`);
                    }
                    idMap.set(uniqueId, true);
                    return {
                        ...item,
                        id: uniqueId,
                        propertyfor: item.propertyfor ? item.propertyfor.toString().toLowerCase() : null,
                        property_name: item.property_name || 'Unnamed Property',
                        thumbnail: item.thumbnail || null,
                        category: item.category || 'N/A',
                        city: item.city || 'Unknown City',
                        price: item.price || 0,
                    };
                });

                // Log normalized data to inspect IDs
                console.log('Normalized Listings:', JSON.stringify(normalized.map(item => ({ id: item.id, property_name: item.property_name })), null, 2));

                const sellListings = normalized.filter(
                    item => item.propertyfor === null || item.propertyfor === 'sell'
                );
                const featuredlist = normalized.filter(
                    item =>
                        (item.propertyfor === null || item.propertyfor === 'sell') &&
                        item.featuredstatus === 'featured'
                );
                const rentListings = normalized.filter(item => item.propertyfor === 'rent');

                // Log filtered featured data
                console.log('Featured Listings:', JSON.stringify(featuredlist.map(item => ({ id: item.id, property_name: item.property_name })), null, 2));

                setListingData(prev => (page === 1 ? sellListings : [...new Set([...prev, ...sellListings].map(item => item.id))].map(id => [...prev, ...sellListings].find(item => item.id === id))));
                setRentListingData(prev => (page === 1 ? rentListings : [...new Set([...prev, ...rentListings].map(item => item.id))].map(id => [...prev, ...rentListings].find(item => item.id === id))));
                setFeaturedData(prev => (page === 1 ? featuredlist : [...new Set([...prev, ...featuredlist].map(item => item.id))].map(id => [...prev, ...featuredlist].find(item => item.id === id))));
                setHasMore(listings.length === LIMIT);
            } else {
                console.error('Unexpected API response format:', response.data);
                setListingData(prev => (page === 1 ? [] : prev));
                setRentListingData(prev => (page === 1 ? [] : prev));
                setFeaturedData(prev => (page === 1 ? [] : prev));
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching listing data:', error);
            setError('Failed to load more properties. Please try again.');
            setHasMore(false);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        setListingData([]);
        setRentListingData([]);
        setFeaturedData([]);
        setHasMore(true);
        fetchUserData();
        fetchListingData(1);
    };

    useEffect(() => {
        fetchUserData();
        fetchListingData(page);
    }, [page]);

    return (
        <View className="flex-1 bg-[#fafafa]">
            <FlatList
                data={listingData}
                renderItem={({ item }) => <Card item={item} onPress={() => handleCardPress(item.id)} />}
                keyExtractor={(item) => `main_${item.id}`}
                numColumns={2}
                contentContainerClassName="pb-[100px] px-[15px]"
                columnWrapperClassName="flex-row gap-[10px]"
                showsVerticalScrollIndicator={false}
                onEndReached={() => {
                    if (hasMore && !loading) {
                        setPage(prev => prev + 1);
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={
                    <>
                        {loading && <ActivityIndicator size="large" color="#4A90E2" />}
                        {error && <Text className="text-red-500 text-center">{error}</Text>}
                    </>
                }
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

                        <View className="my-4 flex-row justify-center space-x-4">
                            {/* ✅ Property Leads for User / Broker */}
                            {["user", "broker"].includes(userData?.user_type?.toLowerCase()) && (
                                <TouchableOpacity
                                    onPress={() => router.push("/myassets/assetScreen")}
                                    className="bg-primary-400 flex-row justify-between px-4 py-4 rounded-2xl shadow-md flex-1 items-center"
                                    activeOpacity={0.8}
                                >
                                    {/* Left side with icon + text */}
                                    <View className="flex-row items-center flex-shrink">
                                        <Ionicons name="home-outline" size={30} color="white" />
                                        <View className="ms-3">
                                            <Text className="text-white font-semibold text-base">
                                                View Property Leads
                                            </Text>
                                            <Text className="text-white/80 text-xs mt-1">
                                                Track and manage enquiries
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Right side: View more icon */}
                                    <Ionicons name="chevron-forward" size={22} color="white" />
                                </TouchableOpacity>
                            )}

                            {/* ✅ Loan Enquiries for Bank Agent */}
                            {userData?.user_type?.toLowerCase() === "bankagent" && (
                                <TouchableOpacity
                                    onPress={() => router.push("/dashboard/loanleads")}
                                    className="bg-green-600 flex-row justify-between px-4 py-4 rounded-2xl shadow-md flex-1 items-center"
                                    activeOpacity={0.8}
                                >
                                    <View className="flex-row items-center flex-shrink">
                                        <MaterialCommunityIcons name="bank-outline" size={30} color="white" />
                                        <View className="ms-3">
                                            <Text className="text-white font-semibold text-base">
                                                View Loan Enquiries
                                            </Text>
                                            <Text className="text-white/80 text-xs mt-1">
                                                Check client loan requests
                                            </Text>
                                        </View>
                                    </View>

                                    <Ionicons name="chevron-forward" size={22} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {featuredData && (
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
                                    data={featuredData}
                                    renderItem={({ item }) => <HorizontalCard item={item} onPress={() => handleCardPress(item.id)} />}
                                    keyExtractor={(item) => `featured_${item.id}`}
                                    horizontal
                                    bounces={false}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerClassName="flex gap-5"
                                    ListFooterComponent={
                                        <>
                                            {loading && <ActivityIndicator size="large" color="#4A90E2" />}
                                            {error && <Text className="text-red-500 text-center">{error}</Text>}
                                        </>
                                    }
                                />
                            </View>
                        )}

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

                        {rentListingData && (
                            <View className="my-5">
                                <View className="flex flex-row items-center justify-between mb-5">
                                    <Text
                                        className={`text-xl ${i18n.language === 'hi' ? 'font-noto-serif-devanagari-bold' : 'font-rubik-bold'} text-black-300`}
                                    >
                                        Rent a property
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
                                    data={rentListingData}
                                    renderItem={({ item }) => <HorizontalCard item={item} onPress={() => handleCardPress(item.id)} />}
                                    keyExtractor={(item) => `rent_${item.id}`}
                                    horizontal
                                    bounces={false}
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerClassName="flex gap-5"
                                    ListFooterComponent={
                                        <>
                                            {loading && <ActivityIndicator size="large" color="#4A90E2" />}
                                            {error && <Text className="text-red-500 text-center">{error}</Text>}
                                        </>
                                    }
                                />
                            </View>
                        )}

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