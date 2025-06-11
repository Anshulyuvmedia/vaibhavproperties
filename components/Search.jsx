import { View, TouchableOpacity, Image, TextInput, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router, usePathname } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import icons from "@/constants/icons";
import RBSheet from "react-native-raw-bottom-sheet";
import RNPickerSelect from 'react-native-picker-select';
import axios from 'axios';

const Search = () => {
    const path = usePathname();
    const params = useLocalSearchParams();
    const refRBSheet = useRef(null);

    const [categoryData, setCategoryData] = useState([]);
    const [cityData, setCityData] = useState([]);

    const [selectedCity, setSelectedCity] = useState();
    const [selectedPropertyType, setSelectedPropertyType] = useState();

    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sqftfrom, setsqftfrom] = useState("");
    const [sqftto, setsqftto] = useState("");

    const [loading, setLoading] = useState(false);


    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://investorlands.com/api/get-categories`);
            if (response.data && response.data.categories) {
                setCategoryData(response.data.categories);
            } else {
                console.error('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCityListing = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://investorlands.com/api/listingscitywise`);
            if (response.data && response.data.data) {
                setCityData(response.data.data);
            } else {
                console.error('Unexpected API response format:', response.data.data);
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        fetchCityListing();
    }, []);

    const handleSubmit = async () => {
        setLoading(true);

        // Construct query parameters
        const filterParams = {
            city: selectedCity || undefined,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            sqftfrom: sqftfrom || undefined,
            sqftto: sqftto || undefined,
            propertyType: selectedPropertyType || undefined,
        };

        // Remove undefined values from query parameters
        const cleanFilters = Object.fromEntries(
            Object.entries(filterParams).filter(([_, v]) => v !== undefined)
        );

        router.push({
            pathname: "/properties/explore",
            params: cleanFilters,
        });

        setLoading(false);
    };

    return (
        <View className="flex-1">
            <TouchableOpacity onPress={() => refRBSheet.current?.open()}>
                <View className="flex flex-row items-center justify-between w-full px-4 rounded-lg bg-accent-100 border border-primary-100 mt-5 py-2">
                    <View className="flex-1 flex flex-row items-center justify-start">
                        <Image source={icons.search} className="size-5" />
                        <TextInput
                            value={cityData?.city || 'Search...'}
                            editable={false}
                            placeholder="Search..."
                            className="text-sm font-rubik text-black-300 ml-2 flex-1"
                        />
                    </View>
                    <Image source={icons.filter} className="size-5" />
                </View>
            </TouchableOpacity>

            <RBSheet
                ref={refRBSheet}
                closeOnDragDown={true}
                closeOnPressMask={true}
                height={500}
                customStyles={{
                    wrapper: { backgroundColor: "rgba(0,0,0,0.5)" },
                    container: { borderTopLeftRadius: 15, borderTopRightRadius: 15, padding: 20, backgroundColor: "white" },
                    draggableIcon: { backgroundColor: "#000" },
                }}
            >
                <View>
                    <Text className="text-lg font-rubik-bold text-black-300">Filter</Text>
                    <RNPickerSelect
                        onValueChange={(value) => setSelectedCity(value)}
                        items={cityData.length > 0 ? cityData.map((city, index) => ({
                            label: city.label || "Unknown", // Ensure there's a label
                            value: city.label || "", // Ensure 'value' is never undefined
                            key: city.id || `city-${index}`, // Add unique key
                        })) : []}
                        style={pickerSelectStyles}
                        placeholder={{ label: 'Choose a City...', value: null }}
                    />



                    <Text className="text-lg font-rubik-bold text-black-300 mt-5">Price Range</Text>
                    <View className="flex flex-row items-center justify-between mt-2">
                        <TextInput
                            placeholder="Min"
                            keyboardType="numeric"
                            value={minPrice}
                            onChangeText={setMinPrice}
                            className=" rounded p-2 flex-1 bg-blue-50"
                        />
                        <Text className="mx-2">-</Text>
                        <TextInput
                            placeholder="Max"
                            keyboardType="numeric"
                            value={maxPrice}
                            onChangeText={setMaxPrice}
                            className=" rounded p-2 flex-1 bg-blue-50"
                        />
                    </View>

                    <Text className="text-lg font-rubik-bold text-black-300 mt-5">Square Feet</Text>
                    <View className="flex flex-row items-center justify-between mt-2">
                        <TextInput
                            placeholder="Min"
                            keyboardType="numeric"
                            value={sqftfrom}
                            onChangeText={setsqftfrom}
                            className=" rounded p-2 flex-1 bg-blue-50"
                        />
                        <Text className="mx-2">-</Text>
                        <TextInput
                            placeholder="Max"
                            keyboardType="numeric"
                            value={sqftto}
                            onChangeText={setsqftto}
                            className=" rounded p-2 flex-1 bg-blue-50"
                        />
                    </View>

                    <Text className="text-lg font-rubik-bold text-black-300 mt-5">Select Type</Text>
                    <RNPickerSelect
                        onValueChange={(value) => setSelectedPropertyType(value)}
                        items={categoryData.length > 0 ? categoryData.map((cat, index) => ({
                            label: cat.label || "Unknown",
                            value: cat.label || "",
                            key: cat.id || `category-${index}`, // Add unique key
                        })) : []}
                        style={pickerSelectStyles}
                        placeholder={{ label: 'Select investment type', value: null }}
                    />



                    <TouchableOpacity onPress={handleSubmit} className="p-2 rounded-lg bg-yellow-800 mt-5">
                        {loading ? <ActivityIndicator color="white" /> : <Text className="font-rubik-bold text-white text-center">Apply Filters</Text>}
                    </TouchableOpacity>
                </View>
            </RBSheet>
        </View>
    );
};

export default Search;

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingHorizontal: 10,
        backgroundColor: '#edf5ff',
        borderRadius: 20,
        color: 'black',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        backgroundColor: '#edf5ff',
        borderRadius: 20,
        color: 'black',
        paddingRight: 30,
    },
});
