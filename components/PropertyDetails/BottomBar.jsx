import { View, Text, TouchableOpacity } from "react-native";

const BottomBar = ({ propertyData, loggedinUserId, formatINR, handleEditPress, rbSheetRef, bidStatus }) => {
    return (
        <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-r border-l border-primary-200 px-7 py-4">
            <View className="flex flex-row items-center justify-between gap-4">
                <View className="flex flex-col items-start">
                    <Text className="text-black-200 text-sm font-rubik-medium">Price</Text>
                    <Text numberOfLines={1} className="text-primary-300 text-2xl font-rubik-bold">
                        {formatINR(propertyData.price)}
                    </Text>
                </View>
                {propertyData.roleid == loggedinUserId ? (
                    <TouchableOpacity
                        className="flex-1 flex-row items-center justify-center bg-primary-300 py-5 rounded-2xl shadow-md shadow-black/10"
                        onPress={() => handleEditPress(propertyData.id)}
                    >
                        <Text className="text-white text-lg text-center font-rubik-bold">Edit Property</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => rbSheetRef.current.open()}
                        className={`flex-1 flex-row items-center justify-center bg-primary-400 py-5 rounded-2xl shadow-md shadow-black/10 ${bidStatus?.type === "success" ? "opacity-50" : ""}`}
                        disabled={bidStatus?.type === "success"}
                    >
                        <Text className="text-white text-lg text-center font-rubik-bold">Bid Now</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

export default BottomBar;
