import { View, Text, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";

const PropertyMap = ({ coordinates, region, address }) => {
    return (
        <View className="px-5 mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">Location</Text>
            <View className="flex flex-row items-center justify-start my-4 gap-2 mr-3">
                <Ionicons name="location-outline" size={22} color="#234F68" />
                <Text className="text-black-200 text-sm font-rubik-medium flex-1">{address}</Text>
            </View>
            <View>
                <MapView style={{ height: 350, borderRadius: 10 }} region={region} initialRegion={region} mapType="hybrid">
                    {coordinates.latitude && coordinates.longitude && (
                        <Marker
                            coordinate={{
                                latitude: parseFloat(coordinates.latitude),
                                longitude: parseFloat(coordinates.longitude),
                            }}
                        />
                    )}
                </MapView>
                <TouchableOpacity
                    onPress={() =>
                        Linking.openURL(
                            `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`
                        )
                    }
                    disabled={!coordinates.latitude || !coordinates.longitude}
                >
                    <Text
                        className={`text-black-300 text-center font-rubik-medium mt-2 bg-blue-100 flex-grow p-2 rounded-full ${!coordinates.latitude || !coordinates.longitude ? "opacity-50" : ""
                            }`}
                    >
                        View Location
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default PropertyMap;