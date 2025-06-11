import { StyleSheet, Text, TouchableOpacity, View, Image, FlatList } from 'react-native'
import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import icons from '@/constants/icons';

const Notifications = () => {
    const [notificationData, setNotificationData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [readStatus, setReadStatus] = useState({});

    // Function to Fetch Notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const parsedUserData = JSON.parse(await AsyncStorage.getItem('userData'));
            const response = await axios.get(`https://investorlands.com/api/usernotifications/?user_type=${parsedUserData.user_type}`);

            if (response.data?.notifications) {
                const apiData = response.data.notifications;
                setNotificationData(apiData);
                // console.log('notificationData', notificationData);
                // Load read/unread status from AsyncStorage
                const storedStatus = await AsyncStorage.getItem('readStatus');
                if (storedStatus) {
                    setReadStatus(JSON.parse(storedStatus));
                } else {
                    // Initialize readStatus state based on API data
                    const initialStatus = {};
                    apiData.forEach((item) => {
                        initialStatus[item.id] = false; // Default unread
                    });
                    setReadStatus(initialStatus);
                }
            } else {
                console.error('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Function to Toggle Read/Unread Status
    const toggleReadStatus = async (id) => {
        const updatedStatus = { ...readStatus, [id]: !readStatus[id] };
        setReadStatus(updatedStatus);
        await AsyncStorage.setItem('readStatus', JSON.stringify(updatedStatus));
    };

    // Function to Mark All as Read
    const markAllAsRead = async () => {
        const updatedStatus = {};
        notificationData.forEach((item) => {
            updatedStatus[item.id] = true;
        });
        setReadStatus(updatedStatus);
        await AsyncStorage.setItem('readStatus', JSON.stringify(updatedStatus));
    };

    return (
        <SafeAreaView className="bg-white h-full px-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-3">
                <TouchableOpacity onPress={() => router.back()} className="flex-row bg-gray-300 rounded-full w-11 h-11 items-center justify-center">
                    <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
                </TouchableOpacity>
                <Text className="text-lg text-gray-700 font-rubik-bold">Notifications</Text>
                <TouchableOpacity onPress={markAllAsRead}>
                    <Text className="text-blue-600">Mark all read</Text>
                </TouchableOpacity>
            </View>

            {/* Notifications List */}
            <FlatList
                data={notificationData}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                    const imageUrl = `https://investorlands.com/assets/images/Notificaitons/${item.notificationimg}`;
                    const isRead = readStatus[item.id] || false;

                    return (
                        <View className={`flex-row my-2 p-3 rounded-lg  ${isRead ? ' bg-white-500 border-gray-300 border' : 'bg-blue-50 border border-blue-400'}`}>
                            {/* Notification Image */}
                            <View className="w-20 h-20 rounded-lg overflow-hidden border border-gray-300">
                                <Image source={{ uri: imageUrl }} className="w-full h-full object-cover" />
                            </View>

                            {/* Notification Details */}
                            <View className="ml-4 flex-1">
                                <View className="flex-row justify-between">
                                    <Text className={`text-lg   ${isRead ? ' text-blue-900 font-rubik-bold' : 'text-gray-900 font-rubik-bold'}`}>{item.notificationname}</Text>
                                    <TouchableOpacity onPress={() => toggleReadStatus(item.id)}>
                                        <View className={`w-5 h-5 border rounded-full ${isRead ? 'bg-green-600 border-green-400' : 'bg-white border-gray-300'}`} />
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-sm text-gray-500 mt-1">{item.notificationdes}</Text>
                                <Text className="text-xs text-gray-400 mt-2">{new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString()}</Text>
                            </View>
                        </View>
                    );
                }}
            />
        </SafeAreaView>
    );
};

export default Notifications;

const styles = StyleSheet.create({});
