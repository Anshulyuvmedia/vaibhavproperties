import { View, Text, Image } from "react-native";

import images from "@/constants/images";
import icons from "@/constants/icons";
import { Models } from "react-native-appwrite";


const Comment = ({ item }) => {
    return (
        <View className="flex flex-col items-start">
            <View className="flex flex-row items-center">
                <Image source={item.user.avatar} className="size-14 rounded-full" />
                <Text className="text-base text-black-300 text-start font-rubik-bold ml-3">
                    {item.user.name}
                </Text>
            </View>

            <Text className="text-black-200 text-base font-rubik mt-2">
                {item.comment}
            </Text>

            <View className="flex flex-row items-center w-full justify-between mt-4">
                <View className="flex flex-row items-center">
                    <Image
                        source={icons.heart}
                        className="size-5"
                        tintColor={"#234F68"}
                    />
                    <Text className="text-black-300 text-sm font-rubik-medium ml-2">
                        120
                    </Text>
                </View>
                <Text className="text-black-100 text-sm font-rubik">
                    {new Date(item.date).toDateString()}
                </Text>
            </View>
        </View>
    );
};

export default Comment;