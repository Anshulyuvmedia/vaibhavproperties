import { View, Text } from "react-native";

const PropertyDescription = ({ description }) => {
    return (
        <View className="px-5 mt-5 flex gap-2">
            <Text className="text-black-300 text-xl font-rubik-bold">Description</Text>
            <Text className="text-black-200 text-base font-rubik my-2">{description}</Text>
        </View>
    );
};

export default PropertyDescription;