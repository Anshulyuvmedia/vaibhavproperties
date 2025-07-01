import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import images from '@/constants/images';
import { useRouter } from 'expo-router';

const AgentScroll = () => {
    const [agentList, setAgentList] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter(); // Initialize router

    const fetchAgenList = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://investorlands.com/api/agentlist`);
            // console.log('API Response:', response.data);

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                const apiData = response.data.data.map((agent, index) => ({
                    id: agent.id, // Generate unique id using index
                    name: agent.name ? agent.name.split(' ')[0] : 'Unknown Agent', // Take first part before space
                    image: agent.profile_photo_path
                        ? agent.profile_photo_path.startsWith('http')
                            ? { uri: agent.profile_photo_path }
                            : { uri: `https://investorlands.com/assets/images/Users/${agent.profile_photo_path}` }
                        : images.avatar, // Use require result directly if local image
                }));
                // console.log('Processed Agent List:', apiData);
                setAgentList(apiData);
            } else {
                console.error('Unexpected API response format:', response.data);
                setAgentList([]);
            }
        } catch (error) {
            console.error('Error fetching agent data:', error.response ? `${error.response.status} - ${error.response.statusText}` : error.message, error.response ? error.response.data : {});
            setAgentList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgenList();
    }, []);

    const renderAgent = ({ item }) => (
        
        <TouchableOpacity
            onPress={() => {
                const imageUri = typeof item.image === 'object' && item.image.uri ? item.image.uri : (typeof item.image === 'number' ? images.avatar : item.image);
                router.push({ pathname: `/agents/${item.id}`, params: { name: item.name, image: imageUri } });
            }}
            className="items-center me-3"
        >
            {/* Agent Profile Picture */}
            <Image
                source={item.image} // Use the object or require result directly
                className="w-16 h-16 rounded-full bg-white shadow-sm"
                style={{ resizeMode: 'cover' }}
                onError={(error) => console.log('Image load error for', item.name, ':', error.nativeEvent.error)}
            />
            {/* Agent Name */}
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
                    Top Estate Agent
                </Text>
                <TouchableOpacity>
                    <Text className="text-base font-rubik text-primary-300">
                        Explore
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Horizontal Scroll of Agents */}
            <FlatList
                data={agentList}
                renderItem={renderAgent}
                keyExtractor={(item) => item.id.toString()} // Ensure id is a string
                horizontal
                showsHorizontalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <Text className="text-black-300 text-center">No agents available</Text>
                )}
            />
        </View>
    );
};

export default AgentScroll;

const styles = StyleSheet.create({});