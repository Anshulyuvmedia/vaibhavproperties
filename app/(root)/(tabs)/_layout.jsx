import { Tabs } from "expo-router";
import { Image, Text, View } from "react-native";

import icons from "@/constants/icons";

const TabIcon = ({focused, icon, title}) => (
    <View className="flex-1 mt-3 flex flex-col items-center">
        <Image
            source={icon}
            tintColor={focused ? "#726555" : "#666876"}
            resizeMode="contain"
            className="size-6"
        />
        <Text
            className={`${focused
                ? "text-yellow-800 font-rubik-medium"
                : "text-black-200 font-rubik"
                } text-xs w-full text-center mt-1`}
        >
            {title}
        </Text>
    </View>
);

const TabsLayout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarShowLabel: false,
                tabBarStyle: {
                    backgroundColor: "white",
                    position: "absolute",
                    borderTopColor: "#0061FF1A",
                    borderTopWidth: 1,
                    minHeight: 70,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.home} title="Home" />
                    ),
                }}
            />
            <Tabs.Screen
                name="myproperties"
                options={{
                    title: "My Investments",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.search} title="My Investments" />
                    ),
                }}
            />
            
            <Tabs.Screen
                name="addproperty"
                options={{
                    title: "Add Property",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.addproperty} title="Add Property" />
                    ),
                }}
            />
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <TabIcon focused={focused} icon={icons.person} title="Dashboard" />
                    ),
                }}
            />
            
        </Tabs>
    );
};

export default TabsLayout;