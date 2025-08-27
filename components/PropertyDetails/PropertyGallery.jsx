import { View, FlatList, TouchableOpacity } from "react-native";
import { Image as ExpoImage } from "expo-image";
import images from "@/constants/images";

const PropertyGallery = ({ propertyGallery, windowWidth, openLightbox }) => {
    if (!propertyGallery?.length) return null;

    return (
        <View className="mt-4 p-4 border-t border-primary-200">
            <FlatList
                data={propertyGallery}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <TouchableOpacity onPress={() => openLightbox(index)} style={{ width: windowWidth / 2 }}>
                        <ExpoImage
                            source={{ uri: typeof item.image === "string" ? item.image : images.avatar }}
                            style={{ width: windowWidth / 2, height: 150, borderRadius: 20 }}
                            contentFit="cover"
                        />
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
                getItemLayout={(data, index) => ({
                    length: windowWidth / 2,
                    offset: (windowWidth / 2) * index,
                    index,
                })}
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={5}
            />
        </View>
    );
};

export default PropertyGallery;