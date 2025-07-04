import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import images from '@/constants/images';
import { useRouter } from 'expo-router';

const BrokerScroll = () => {
    const [brokerList, setBrokerList] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter(); // Initialize router

    const fetchAgenList = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/brokerlist`);
            // console.log('API Response:', response.data);

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                const apiData = response.data.data.map((broker, index) => ({
                    id: broker.id, // Generate unique id using index
                    name: broker.username ? broker.username.split(' ')[0] : 'Unknown broker', // Take first part before space
                    image: broker.profile
                        ? broker.profile.startsWith('http')
                            ? { uri: broker.profile }
                            : { uri: `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Users/${broker.profile}` }
                        : images.avatar, // Use require result directly if local image
                }));
                // console.log('Processed broker List:', apiData);
                setBrokerList(apiData);
            } else {
                console.error('Unexpected API response format:', response.data);
                setBrokerList([]);
            }
        } catch (error) {
            console.error('Error fetching broker data:', error.response ? `${error.response.status} - ${error.response.statusText}` : error.message, error.response ? error.response.data : {});
            setBrokerList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgenList();
    }, []);

    const renderbroker = ({ item }) => (
        
        <TouchableOpacity
            onPress={() => {
                const imageUri = typeof item.image === 'object' && item.image.uri ? item.image.uri : (typeof item.image === 'number' ? images.avatar : item.image);
                router.push({ pathname: `/broker/${item.id}`, params: { name: item.name, image: imageUri } });
            }}
            className="items-center me-3"
        >
            {/* broker Profile Picture */}
            <Image
                source={item.image} // Use the object or require result directly
                className="w-16 h-16 rounded-full bg-white shadow-sm"
                style={{ resizeMode: 'cover' }}
                onError={(error) => console.log('Image load error for', item.name, ':', error.nativeEvent.error)}
            />
            {/* broker Name */}
            <Text className="mt-2 text-sm font-rubik text-black-300">
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="my-5">
                <ActivityIndicator size="large" color="#8bc83f" />
            </View>
        );
    }

    return (
        <View className="my-5">
            {/* Header Section */}
            <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-rubik-bold text-black-300">
                    Top Property Brokers
                </Text>
                <TouchableOpacity onPress={() => router.push('brokers/allbrokers')}>
                    <Text className="text-base font-rubik text-primary-300">
                        Explore
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Horizontal Scroll of brokers */}
            <FlatList
                data={brokerList}
                renderItem={renderbroker}
                keyExtractor={(item) => item.id.toString()} // Ensure id is a string
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <Text className="text-black-300 text-center">No brokers available</Text>
                )}
            />
        </View>
    );
};

export default BrokerScroll;

const styles = StyleSheet.create({});