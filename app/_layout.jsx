import { SplashScreen, Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "@/constants/i18n"; // Import centralized i18next config
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import './globals.css';

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        "NotoSerifDevanagari": require("../assets/fonts/NotoSerifDevanagari-Regular.ttf"),
        "Rubik-Bold": require("../assets/fonts/Rubik-Bold.ttf"),
        "Rubik-ExtraBold": require("../assets/fonts/Rubik-ExtraBold.ttf"),
        "Rubik-Medium": require("../assets/fonts/Rubik-Medium.ttf"),
        "Rubik-Light": require("../assets/fonts/Rubik-Light.ttf"),
        "Rubik-Regular": require("../assets/fonts/Rubik-Regular.ttf"),
        "Rubik-SemiBold": require("../assets/fonts/Rubik-SemiBold.ttf"),
    });

    const [appIsReady, setAppIsReady] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const checkAuthSession = async () => {
            try {
                await SplashScreen.preventAutoHideAsync();

                if (fontsLoaded) {
                    // Load saved language
                    const savedLanguage = await AsyncStorage.getItem('appLanguage');
                    if (savedLanguage) {
                        await i18n.changeLanguage(savedLanguage);
                    }

                    const token = await AsyncStorage.getItem("userToken");
                    const userData = await AsyncStorage.getItem("userData");
                    const parsedUserData = userData ? JSON.parse(userData) : null;
                    if (!token || !parsedUserData || !parsedUserData.id) {
                        await AsyncStorage.removeItem("userData");
                        setIsAuthenticated(false);
                    } else {
                        setIsAuthenticated(true);
                    }
                }
            } catch (error) {
                console.error("Error during authentication check:", error);
            } finally {
                setAppIsReady(true);
                await SplashScreen.hideAsync();
            }
        };

        checkAuthSession();
    }, [fontsLoaded]);

    useEffect(() => {
        if (appIsReady && isAuthenticated !== null) {
            requestAnimationFrame(() => {
                if (isAuthenticated) {
                    router.replace("/mapview");
                } else {
                    router.replace("/signin");
                }
            });
        }
    }, [appIsReady, isAuthenticated]);

    if (!appIsReady) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }} />
                <Toast />
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}