import { View, TouchableOpacity, ScrollView, TextInput, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, usePathname } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import RBSheet from "react-native-raw-bottom-sheet";
import RNPickerSelect from "react-native-picker-select";
import axios from "axios";
import Ionicons from "@expo/vector-icons/Ionicons";

const Search = () => {
    const path = usePathname();
    const params = useLocalSearchParams();
    const refRBSheet = useRef(null);

    const [categoryData, setCategoryData] = useState([]);
    const [cityData, setCityData] = useState([]);
    const [selectedCity, setSelectedCity] = useState(null);
    const [selectedPropertyTypes, setSelectedPropertyTypes] = useState([]);
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sqftfrom, setsqftfrom] = useState("");
    const [sqftto, setsqftto] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://investorlands.com/api/get-categories`);
            if (response.data?.categories) {
                setCategoryData(response.data.categories);
            } else {
                console.error("Unexpected API response format:", response.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCityListing = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://investorlands.com/api/listingscitywise`);
            if (response.data?.data) {
                setCityData(response.data.data);
            } else {
                console.error("Unexpected API response format:", response.data);
            }
        } catch (error) {
            console.error("Error fetching cities:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchCityListing();
    }, []);

    const handlePropertyTypeToggle = (propertyType) => {
        if (selectedPropertyTypes.includes(propertyType)) {
            setSelectedPropertyTypes(selectedPropertyTypes.filter((type) => type !== propertyType));
        } else {
            setSelectedPropertyTypes([...selectedPropertyTypes, propertyType]);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        const filterParams = {
            city: selectedCity || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            sqftfrom: sqftfrom || undefined,
            sqftto: sqftto || undefined,
            propertyType: selectedPropertyTypes.length > 0 ? selectedPropertyTypes.join(",") : undefined,
        };

        const cleanFilters = Object.fromEntries(
            Object.entries(filterParams).filter(([_, v]) => v !== undefined)
        );

        router.push({
            pathname: "/properties/explore",
            params: cleanFilters,
        });

        refRBSheet.current?.close();
        setLoading(false);
    };

    const handleReset = () => {
        setSelectedCity(null);
        setSelectedPropertyTypes([]);
        setMinPrice("");
        setMaxPrice("");
        setsqftfrom("");
        setsqftto("");
    };

    return (
        <View className="flex-1 bg-white">
            <TouchableOpacity onPress={() => refRBSheet.current?.open()}>
                <View className="flex-row items-center justify-between w-full rounded-xl bg-[#f4f2f7] border border-primary-100 mt-5 py-4 px-4">
                    <View className="flex-row items-center flex-1">
                        <Ionicons name="search-outline" size={20} color="#1F2937" />
                        <TextInput
                            value={selectedCity || ""}
                            editable={false}
                            placeholder="Search House, Apartment, etc"
                            placeholderTextColor="#999"
                            className="text-sm font-rubik text-black-200 ml-2 flex-1"
                        />
                    </View>
                    <Ionicons
                        name="filter-outline"
                        size={20}
                        color="#1F2937"
                        style={{ paddingLeft: 8, borderLeftWidth: 1, borderLeftColor: "#D1D5DB" }}
                    />
                </View>
            </TouchableOpacity>

            <RBSheet
                ref={refRBSheet}
                closeOnDragDown={true}
                closeOnPressMask={true}
                height={550}
                customStyles={{
                    wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
                    container: { borderTopLeftRadius: 35, borderTopRightRadius: 35, padding: 20, paddingBottom: 20, backgroundColor: "white" },
                    draggableIcon: { backgroundColor: "#000", width: 40, height: 5, marginVertical: 10 },
                }}
            >
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-xl font-rubik-bold text-black-300 ">Filter</Text>
                    <TouchableOpacity
                        onPress={handleReset}
                        className="px-5 py-2 rounded-xl bg-white border border-gray-300 mr-3"
                    >
                        <Text className="text-base font-rubik-medium text-black-300 text-center">Reset</Text>
                    </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>

                    <Text className="text-base font-rubik-medium text-black-300 mb-2">City</Text>
                    <View className="flex-row items-center bg-[#f4f2f7] rounded-xl px-4 py-3">
                        <Ionicons name="location-outline" size={20} color="#1F2937" style={{ marginRight: 8 }} />
                        <RNPickerSelect
                            onValueChange={(value) => setSelectedCity(value)}
                            items={cityData.map((city, index) => ({
                                label: city.label || city.name || "Unknown",
                                value: city.label || city.name || "",
                                key: city.id || `city-${index}`,
                            }))}
                            placeholder={{ label: "Choose a City...", value: null }}
                            style={pickerSelectStyles}
                            useNativeAndroidPickerStyle={false}
                        />
                    </View>

                    <Text className="text-base font-rubik-medium text-black-300 mt-5 mb-2">Price Range</Text>
                    <View className="flex-row items-center justify-between">
                        <TextInput
                            placeholder="Min"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={minPrice}
                            onChangeText={setMinPrice}
                            className="rounded-xl p-4 flex-1 bg-[#f4f2f7] text-sm font-rubik text-black-200"
                            style={{ marginRight: 8 }}
                        />
                        <Text className="text-black-200">-</Text>
                        <TextInput
                            placeholder="Max"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={maxPrice}
                            onChangeText={setMaxPrice}
                            className="rounded-xl p-4 flex-1 bg-[#f4f2f7] text-sm font-rubik text-black-200"
                            style={{ marginLeft: 8 }}
                        />
                    </View>

                    <Text className="text-base font-rubik-medium text-black-300 mt-5 mb-2">Square Feet</Text>
                    <View className="flex-row items-center justify-between">
                        <TextInput
                            placeholder="Min"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={sqftfrom}
                            onChangeText={setsqftfrom}
                            className="rounded-xl p-4 flex-1 bg-[#f4f2f7] text-sm font-rubik text-black-200"
                            style={{ marginRight: 8 }}
                        />
                        <Text className="text-black-200">-</Text>
                        <TextInput
                            placeholder="Max"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            value={sqftto}
                            onChangeText={setsqftto}
                            className="rounded-xl p-4 flex-1 bg-[#f4f2f7] text-sm font-rubik text-black-200"
                            style={{ marginLeft: 8 }}
                        />
                    </View>

                    <Text className="text-base font-rubik-medium text-black-300 mt-5 mb-2">Property Type</Text>
                    <ScrollView
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerClassName="flex-row"
                    >
                        {categoryData.map((cat, index) => {
                            const label = cat.label || cat.name || "Unknown";
                            const isSelected = selectedPropertyTypes.includes(label);
                            return (
                                <TouchableOpacity
                                    key={cat.id || `category-${index}`}
                                    onPress={() => handlePropertyTypeToggle(label)}
                                    className={`me-2 px-5 py-4 rounded-xl ${isSelected
                                            ? "bg-[#8bc83f] border-[#8bc83f]"
                                            : "bg-[#f4f2f7] border-[#D1D5DB]"
                                        }`}
                                >
                                    <Text
                                        className={`text-sm font-rubik-medium ${isSelected ? "text-white" : "text-[#1F2937]"
                                            }`}
                                    >
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </ScrollView>

                <View className="flex-row justify-between mt-6">

                    <TouchableOpacity
                        onPress={handleSubmit}
                        className="flex-1 p-4 rounded-xl bg-primary-300"
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-base font-rubik-medium text-white text-center">Apply Filter</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </RBSheet>
        </View>
    );
};

export default Search;

const styles = StyleSheet.create({
    pickerContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f4f2f7",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        marginTop: 8,
    },
    icon: {
        marginRight: 8,
    },
});

const pickerSelectStyles = {
    inputIOS: {
        fontSize: 14,
        color: "#1F2937",
        paddingVertical: 12,
        paddingHorizontal: 10,
        fontFamily: "Rubik-Regular",
    },
    inputAndroid: {
        fontSize: 14,
        color: "#1F2937",
        paddingVertical: 12,
        paddingHorizontal: 10,
        fontFamily: "Rubik-Regular",
    },
    placeholder: {
        color: "#999",
        fontSize: 14,
    },
};