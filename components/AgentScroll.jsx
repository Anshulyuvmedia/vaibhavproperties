import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity } from 'react-native';
import React from 'react';

// Mock data for agents (replace with actual API data)
const agents = [
    { id: '1', name: 'Amanda', image: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { id: '2', name: 'Anderson', image: 'https://randomuser.me/api/portraits/men/2.jpg' },
    { id: '3', name: 'Samantha', image: 'https://randomuser.me/api/portraits/women/3.jpg' },
    { id: '4', name: 'Andrew', image: 'https://randomuser.me/api/portraits/men/4.jpg' },
    { id: '5', name: 'Samantha', image: 'https://randomuser.me/api/portraits/women/15.jpg' },
    { id: '6', name: 'Andrew', image: 'https://randomuser.me/api/portraits/men/6.jpg' },
    { id: '7', name: 'Samantha', image: 'https://randomuser.me/api/portraits/women/7.jpg' },
    { id: '8', name: 'Andrew', image: 'https://randomuser.me/api/portraits/men/8.jpg' },
];

const AgentScroll = () => {
    const renderAgent = ({ item }) => (
        <View className="items-center me-3">
            {/* Agent Profile Picture */}
            <Image
                source={{ uri: item.image }}
                className="w-16 h-16 rounded-full bg-white shadow-sm"
                style={{ resizeMode: 'cover' }}
            />
            {/* Agent Name */}
            <Text className="mt-2 text-sm font-rubik text-black-300">
                {item.name}
            </Text>
        </View>
    );

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
                data={agents}
                renderItem={renderAgent}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
};

export default AgentScroll;

const styles = StyleSheet.create({});