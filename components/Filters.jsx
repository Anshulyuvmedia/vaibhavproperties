import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';

const Filters = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    
    const [selectedCategory, setSelectedCategory] = useState(params.propertyType || 'All');
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleCategoryPress = (category) => {
        const isRemovingFilter = selectedCategory === category;

        // Prepare new query parameters
        const updatedParams = { ...params };

        if (isRemovingFilter) {
            delete updatedParams.propertyType; // Remove filter if category is already selected
            setSelectedCategory('All');
        } else {
            updatedParams.propertyType = category;
            setSelectedCategory(category);
        }

        // Navigate with updated query parameters
        router.push({
            pathname: "/properties/explore",
            params: updatedParams,
        });
    };

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get("https://investorlands.com/api/get-categories");

            if (response.data && response.data.categories) {
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

    useEffect(() => {
        fetchCategories();
    }, []);

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3 mb-2 pb-3">
            <TouchableOpacity
                key="all"
                onPress={() => handleCategoryPress('All')}
                className={`flex flex-col items-start mr-4 px-4 py-2 rounded-full ${
                    selectedCategory === 'All' ? 'bg-yellow-800' : 'bg-primary-100 border border-primary-200'
                }`}
            >
                <Text className={`text-sm ${selectedCategory === 'All' ? 'text-white font-rubik-bold mt-0.5' : 'text-black-300 font-rubik'}`}>
                    All
                </Text>
            </TouchableOpacity>

            {categoryData.map((item) => (
                <TouchableOpacity
                    key={item.id.toString()} // ✅ Ensure unique key
                    onPress={() => handleCategoryPress(item.label)}
                    className={`flex flex-col items-start mr-4 px-4 py-2 rounded-full ${
                        selectedCategory === item.label ? 'bg-yellow-800' : 'bg-primary-100 border border-primary-200'
                    }`}
                >
                    <Text className={`text-sm ${selectedCategory === item.label ? 'text-white font-rubik-bold mt-0.5' : 'text-black-300 font-rubik'}`}>
                        {item.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

export default Filters;

const styles = StyleSheet.create({});
