// app/index.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Index() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                const userData = await AsyncStorage.getItem("userData");
                // console.log('token', token);
                if (token && userData) {
                    const user = JSON.parse(userData);
                    const userType = user?.user_type?.toLowerCase();

                    if (userType === "user") {
                        router.replace("/mapview");
                    } else if (userType === "broker" || userType === "bankagent") {
                        router.replace("/(root)/(tabs)/home");
                    } else {
                        router.replace("/login");
                    }
                } else {
                    router.replace("/login");
                }
            } catch (err) {
                console.error("Auth check failed:", err);
                router.replace("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#234F68" />
                <Text className="mt-3">Assets are loading...</Text>
            </View>
        );
    }

    return null;
}
