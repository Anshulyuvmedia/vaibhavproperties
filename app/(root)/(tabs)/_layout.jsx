import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useEffect } from "react";

const TabIcon = ({ focused, name, title }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const dotOpacity = useSharedValue(0);

    const animatedIconStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value },
        ],
    }));

    const animatedDotStyle = useAnimatedStyle(() => ({
        opacity: dotOpacity.value,
    }));

    useEffect(() => {
        // Icon animation: scale and bounce up when focused
        scale.value = withSpring(focused ? 1.2 : 1, { damping: 12, stiffness: 120 });
        translateY.value = withSpring(focused ? -6 : 0, { damping: 12, stiffness: 120 });
        // Dot animation: fade in when focused, fade out when not focused
        dotOpacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
    }, [focused, scale, translateY, dotOpacity]);

    return (
        <View className="flex-grow flex-col items-center justify-center h-full">
            <Animated.View style={animatedIconStyle}>
                <FontAwesome
                    name={name}
                    size={24}
                    color={focused ? "#234F68" : "#666876"}
                />
            </Animated.View>
            <Animated.View style={[{ marginTop: 4 }, animatedDotStyle]}>
                {focused && (
                    <View
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#234F68",
                        }}
                    />
                )}
            </Animated.View>
        </View>
    );
};

const TabsLayout = () => {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: "#ffffff",
                    position: "absolute",
                    borderTopWidth: 0,
                    elevation: 10,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    height: 70 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 20,
                    borderRadius: 25,
                    marginHorizontal: 10,
                    marginBottom: 12,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} name="home" title="Home" />
                    ),
                }}
            />
            <Tabs.Screen
                name="myproperties"
                options={{
                    title: "My Investments",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} name="building-o" title="My Investments" />
                    ),
                }}
            />
            <Tabs.Screen
                name="mapview"
                options={{
                    title: "Map",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} name="map-o" title="Map" />
                    ),
                }}
            />
            <Tabs.Screen
                name="addproperty"
                options={{
                    title: "Add Property",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} name="plus-square-o" title="Add Property" />
                    ),
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} name="user-o" title="Dashboard" />
                    ),
                }}
            />
        </Tabs>
    );
};

export default TabsLayout;