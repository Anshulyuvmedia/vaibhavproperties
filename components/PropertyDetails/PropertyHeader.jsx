import { View, Image, TouchableOpacity, Text, Platform, Dimensions } from "react-native";
import icons from "@/constants/icons";
import images from "@/constants/images";
import { router } from "expo-router";

const PropertyHeader = ({ propertyThumbnail, propertyData, loggedinUserId, shareProperty }) => {
    return (
        <View className="relative w-full p-2" style={{ height: Dimensions.get("window").height / 2 }}>
            <Image
                source={{ uri: typeof propertyThumbnail === "string" ? propertyThumbnail : images.avatar }}
                className="w-full h-full rounded-[50px]"
                resizeMode="cover"
            />
            <View className="z-50 absolute inset-x-8" style={{ top: Platform.OS === "ios" ? 70 : 25 }}>
                <View className="flex flex-row items-center justify-between w-full">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex flex-row bg-white rounded-full w-11 h-11 items-center justify-center"
                    >
                        <Image
                            source={typeof icons.backArrow === "string" ? { uri: icons.backArrow } : icons.backArrow}
                            className="w-5 h-5"
                        />
                    </TouchableOpacity>
                    <View className="flex flex-row items-center gap-3">
                        {propertyData.roleid === loggedinUserId && (
                            <Text
                                className={`inline-flex items-center rounded-md capitalize px-2 py-1 text-xs font-rubik ring-1 ring-inset ${propertyData.status === "published"
                                        ? "bg-green-50 text-green-700 ring-green-600/20"
                                        : "bg-red-50 text-red-700 ring-red-600/20"
                                    }`}
                            >
                                {propertyData.status}
                            </Text>
                        )}
                        <TouchableOpacity
                            onPress={shareProperty}
                            className="flex flex-row bg-white rounded-full w-11 h-11 items-center justify-center"
                        >
                            <Image
                                source={typeof icons.send === "string" ? { uri: icons.send } : icons.send}
                                className="w-7 h-7"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default PropertyHeader;