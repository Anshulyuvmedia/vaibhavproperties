import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, Linking } from "react-native";

const MasterPlanList = ({ masterPlanDocs }) => {
    const [processedDocs, setProcessedDocs] = useState([]);

    useEffect(() => {
        // console.log("🔹 Received masterPlanDocs:", masterPlanDocs);

        if (typeof masterPlanDocs === "string") {
            setProcessedDocs([masterPlanDocs]); // Convert string to array
        } else if (Array.isArray(masterPlanDocs)) {
            setProcessedDocs(masterPlanDocs);
        } else {
            setProcessedDocs([]); // Handle invalid cases
        }
    }, [masterPlanDocs]);

    const openPdf = (pdfUrl) => {
        Linking.openURL(pdfUrl);
    };

    // console.log("✅ FlatList Data:", processedDocs);

    const renderItem = ({ item }) => {
        // console.log("🔹 Rendering Item:", item);

        const isPdf = item.toLowerCase().endsWith(".pdf");

        return (
            <View className="mb-4">
                {isPdf ? (
                    <TouchableOpacity onPress={() => openPdf(item)}>
                        <View className="p-3 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Image
                                source={{ uri: "https://cdn-icons-png.flaticon.com/512/337/337946.png" }}
                                className="w-20 h-20 rounded-lg border border-gray-300"
                            />
                            <Text className="text-lg mt-2 font-rubik">View PDF</Text>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <View>
                        <Image
                            source={{ uri: item }}
                            className="w-40 h-40 rounded-lg border border-gray-300"
                            resizeMode="cover"
                        />
                        <Text className="text-center text-gray-500 mt-2">Master Plan</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View className="mt-4">
            {processedDocs.length > 0 ? (
                <FlatList
                    data={processedDocs}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 16, paddingVertical: 10 }}
                />
            ) : (
                <Text className="text-gray-500 text-center">No Master Plan Available</Text>
            )}
        </View>
    );
};

export default MasterPlanList;
