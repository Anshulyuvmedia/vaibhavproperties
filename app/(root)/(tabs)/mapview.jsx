import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Text, ActivityIndicator, Pressable } from 'react-native';
import React, { useRef, useState, useEffect, memo } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import { HorizontalCard } from '@/components/Cards';
import Constants from 'expo-constants';
import debounce from 'lodash.debounce';
import * as Location from 'expo-location';
import Ionicons from "@expo/vector-icons/Ionicons";

// Define parseCoordinates outside Mapview
const parseCoordinates = (maplocations) => {
    try {
        const location = JSON.parse(maplocations);
        const latitude = parseFloat(location.Latitude);
        const longitude = parseFloat(location.Longitude);
        if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error('Invalid coordinates');
        }
        return { latitude, longitude };
    } catch (error) {
        console.error('Error parsing maplocations:', error);
        return { latitude: 26.4499, longitude: 74.6399 }; // Default coordinates (Ajmer)
    }
};

// Define CustomMarker component
const CustomMarker = memo(({ property, isSelected, onPress }) => {
    const { latitude, longitude } = parseCoordinates(property.maplocations);
    return (
        <Marker
            key={property.id}
            coordinate={{ latitude, longitude }}
            title={property.property_name}
            description={property.category}
            onPress={onPress}
            anchor={{ x: 0.5, y: 0.5 }}
        />
    );
});

const Mapview = () => {
    const GOOGLE_MAPS_API_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
    const mapRef = useRef(null);
    const flatListRef = useRef(null);
    const [listingData, setListingData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [visibleMarkers, setVisibleMarkers] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [region, setRegion] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [selectedCity, setSelectedCity] = useState('Ajmer');
    const [currentLocationName, setCurrentLocationName] = useState('Ajmer');
    const [page, setPage] = useState(1); // Pagination page
    const [hasMore, setHasMore] = useState(true); // Track if more data is available

    // Fetch filtered data based on city
    const fetchFilterData = async (city) => {
        setLoading(true);
        setListingData([]);
        setFilteredData([]);
        setVisibleMarkers([]);
        setError(null);
        setPage(1);
        setHasMore(true);

        const params = { city };
        // console.log("fetchFilterData params:", params);
        try {
            const queryParams = new URLSearchParams();
            if (params.city) queryParams.append("filtercity", params.city);

            const apiUrl = `https://investorlands.com/api/filterlistings?${queryParams.toString()}`;
            // console.log("Sending API request to:", apiUrl);

            const response = await axios({
                method: "post",
                url: apiUrl,
            });

            // console.log("fetchFilterData response:", response.data);

            if (response.data && Array.isArray(response.data.data)) {
                const data = response.data.data;
                setListingData(data);
                setFilteredData(data.slice(0, 8)); // Limit to 8 items initially
                setHasMore(data.length > 8);

                const limitedMarkers = data.slice(0, 50).map(property => ({
                    ...property,
                    coordinates: parseCoordinates(property.maplocations)
                }));
                setVisibleMarkers(limitedMarkers);

                if (data.length > 0) {
                    const { latitude, longitude } = parseCoordinates(data[0].maplocations);
                    const newRegion = {
                        latitude,
                        longitude,
                        latitudeDelta: 0.5,
                        longitudeDelta: 0.5,
                    };
                    setRegion(newRegion);
                    mapRef.current?.animateToRegion(newRegion, 500);
                }
            } else {
                console.error("Unexpected API response format in fetchFilterData:", response.data);
                setListingData([]);
                setFilteredData([]);
                setVisibleMarkers([]);
                setError("No properties found for the selected city.");
            }
        } catch (error) {
            console.error("Error fetching filtered listings:", error.response?.data || error.message);
            setListingData([]);
            setFilteredData([]);
            setVisibleMarkers([]);
            if (error.response?.status === 404) {
                setError("No properties found for the selected city.");
            } else if (error.response?.status === 500) {
                setError("Server error. Please try again later.");
            } else if (error.message.includes("Network Error")) {
                setError("Network error. Please check your internet connection.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch property data with pagination
    const fetchListingData = async (mapRegion, pageNum = 1) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get('https://investorlands.com/api/property-listings', {
                params: {
                    latitude: mapRegion?.latitude || 26.4499,
                    longitude: mapRegion?.longitude || 74.6399,
                    latitudeDelta: mapRegion?.latitudeDelta || 0.5,
                    longitudeDelta: mapRegion?.longitudeDelta || 0.5,
                    limit: 8, // Fetch 8 items per page
                    page: pageNum,
                },
            });

            // console.log("fetchListingData response:", response.data);

            if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
                const data = response.data.data.data;
                if (pageNum === 1) {
                    setListingData(data);
                    setFilteredData(data); // Initial set of 8 items
                } else {
                    setListingData(prev => [...prev, ...data]);
                    setFilteredData(prev => [...prev, ...data]); // Append new items
                }
                setHasMore(data.length === 8); // If less than 8, assume no more data

                const limitedMarkers = data.slice(0, 50).map(property => ({
                    ...property,
                    coordinates: parseCoordinates(property.maplocations)
                }));
                setVisibleMarkers(limitedMarkers);

                if (!region && data.length > 0) {
                    const { latitude, longitude } = parseCoordinates(data[0].maplocations);
                    setRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.5,
                        longitudeDelta: 0.5,
                    });
                }
            } else {
                console.error('Unexpected API response format in fetchListingData:', response.data);
                setListingData([]);
                setFilteredData([]);
                setVisibleMarkers([]);
                setError("No properties found nearby.");
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setListingData([]);
            setFilteredData([]);
            setVisibleMarkers([]);
            if (error.message.includes("Network Error")) {
                setError("Network error. Please check your internet connection.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Initial load with Ajmer coordinates
    useEffect(() => {
        const ajmerRegion = {
            latitude: 26.4499,
            longitude: 74.6399,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
        };
        setRegion(ajmerRegion);
        fetchListingData(ajmerRegion, 1);
    }, []);

    // Request location permissions and get current location
    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Location permission denied. Please enable location access.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            const newRegion = {
                latitude,
                longitude,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
            };
            setRegion(newRegion);
            setSelectedCity(null);
            mapRef.current?.animateToRegion(newRegion, 500);

            const geocode = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
            );
            if (geocode.data.status === 'OK') {
                const addressComponents = geocode.data.results[0].address_components;
                const cityComponent = addressComponents.find(comp => comp.types.includes('locality'));
                const city = cityComponent ? cityComponent.long_name : 'Unknown Location';
                setCurrentLocationName(city);
            } else {
                setCurrentLocationName('Unknown Location');
            }

            fetchListingData(newRegion, 1);
        } catch (error) {
            console.error('Error getting location:', error);
            setError("Unable to get your location. Please try again.");
        }
    };

    // Fetch city suggestions from Google Places API
    const fetchCitySuggestions = async (query) => {
        if (!query || query.trim() === '') {
            setCitySuggestions([]);
            return;
        }

        try {
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/place/autocomplete/json',
                {
                    params: {
                        input: query,
                        types: '(cities)',
                        key: GOOGLE_MAPS_API_KEY,
                    },
                }
            );

            if (response.data.status === 'OK') {
                setCitySuggestions(response.data.predictions || []);
            } else if (response.data.status === 'REQUEST_DENIED') {
                setError("Google Places API request denied. Please check your API key.");
                setCitySuggestions([]);
            } else {
                console.error('Google Places API error:', response.data.status);
                setCitySuggestions([]);
            }
        } catch (error) {
            console.error('Error fetching city suggestions:', error);
            setCitySuggestions([]);
            setError("Unable to fetch city suggestions. Please try again.");
        }
    };

    const debouncedFetchCitySuggestions = debounce(fetchCitySuggestions, 300);

    const getCityDetails = async (placeId) => {
        try {
            const response = await axios.get(
                'https://maps.googleapis.com/maps/api/place/details/json',
                {
                    params: {
                        place_id: placeId,
                        fields: 'geometry,formatted_address',
                        key: GOOGLE_MAPS_API_KEY,
                    },
                }
            );

            if (response.data.status === 'OK') {
                const { lat, lng } = response.data.result.geometry.location;
                const addressComponents = response.data.result.formatted_address.split(', ');
                const city = addressComponents[0];
                const newRegion = {
                    latitude: lat,
                    longitude: lng,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                };
                setSelectedCity(city);
                setCurrentLocationName(city);
                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 500);
                fetchFilterData(city);
            } else {
                console.error('Google Places Details API error:', response.data.status);
                setError("Unable to fetch city details. Please try again.");
            }
        } catch (error) {
            console.error('Error fetching city coordinates:', error);
            setError("Unable to fetch city details. Please try again.");
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        debouncedFetchCitySuggestions(query);

        if (query.trim() === '') {
            setSelectedCity(null);
            setCurrentLocationName('Ajmer');
            setFilteredData(listingData.slice(0, 8) || []);
            setVisibleMarkers(listingData.slice(0, 50).map(property => ({
                ...property,
                coordinates: parseCoordinates(property.maplocations)
            })));
            setShowSuggestions(true);
            setError(null);
            const ajmerRegion = {
                latitude: 26.4499,
                longitude: 74.6399,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
            };
            setRegion(ajmerRegion);
            fetchListingData(ajmerRegion, 1);
            return;
        }

        if (!selectedCity) {
            const filtered = Array.isArray(listingData) ? listingData.filter((property) =>
                property.property_name?.toLowerCase().includes(query.toLowerCase()) ||
                property.category?.toLowerCase().includes(query.toLowerCase())
            ) : [];
            setFilteredData(filtered.slice(0, 8));
            setVisibleMarkers(filtered.slice(0, 50).map(property => ({
                ...property,
                coordinates: parseCoordinates(property.maplocations)
            })));
        }
        setShowSuggestions(true);
    };

    const handleSuggestionPress = (suggestion, isCity = false) => {
        setSearchQuery(suggestion.description || suggestion);
        if (isCity) {
            getCityDetails(suggestion.place_id);
        } else {
            setSelectedCity(null);
            handleSearch(suggestion);
        }
        setShowSuggestions(false);
    };

    const handleMarkerPress = (property) => {
        setSelectedPropertyId(property.id);
        const { latitude, longitude } = parseCoordinates(property.maplocations);
        mapRef.current?.animateToRegion(
            {
                latitude,
                longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            },
            500
        );
        const index = listingData.findIndex((p) => p.id === property.id);
        if (index !== -1) {
            flatListRef.current?.scrollToIndex({ index, animated: true });
        }
    };

    const handleCardPress = debounce(async (propertyId) => {
        const property = listingData.find((p) => p.id === propertyId);
        if (property) {
            setSelectedPropertyId(propertyId);
            const { latitude, longitude } = parseCoordinates(property.maplocations);

            try {
                const geocode = await axios.get(
                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
                );
                if (geocode.data.status === 'OK') {
                    const addressComponents = geocode.data.results[0].address_components;
                    const cityComponent = addressComponents.find(comp => comp.types.includes('locality'));
                    const city = cityComponent ? cityComponent.long_name : 'Unknown Location';
                    setCurrentLocationName(city);
                } else {
                    setCurrentLocationName('Unknown Location');
                }
            } catch (error) {
                console.error('Error reverse geocoding property location:', error);
                setCurrentLocationName('Unknown Location');
            }

            mapRef.current?.animateToRegion(
                {
                    latitude,
                    longitude,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                },
                500
            );
        }
    }, 300);

    const handleRegionChange = (newRegion) => {
        setRegion(newRegion);
    };

    const updateVisibleMarkers = () => {
        if (!Array.isArray(filteredData) || !region) {
            setVisibleMarkers([]);
            return;
        }

        const markersInRegion = filteredData.filter((property) => {
            const { latitude, longitude } = parseCoordinates(property.maplocations);
            const latDelta = region.latitudeDelta / 2;
            const lngDelta = region.longitudeDelta / 2;
            return (
                latitude >= region.latitude - latDelta &&
                latitude <= region.latitude + latDelta &&
                longitude >= region.longitude - lngDelta &&
                longitude <= region.longitude + lngDelta
            );
        });

        setVisibleMarkers(markersInRegion.slice(0, 50).map(property => ({
            ...property,
            coordinates: parseCoordinates(property.maplocations)
        })));
    };

    const fetchMoreData = () => {
        if (loading || !hasMore) return;
        setLoading(true);
        const nextPage = page + 1;
        fetchListingData(region, nextPage).then(() => {
            setPage(nextPage);
        });
    };

    useEffect(() => {
        updateVisibleMarkers();
    }, [filteredData, region]);

    return (
        <Pressable style={styles.container} onPress={() => setShowSuggestions(false)}>
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#234F68" />
                    <Text style={styles.loadingText}>Loading properties...</Text>
                </View>
            )}

            <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={16} color="#fff" />
                <Text style={styles.locationText}>{currentLocationName}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.nearbyButton} onPress={getCurrentLocation}>
                    <View style={styles.propertyCount}>
                        <Text style={styles.propertyCountText}>{filteredData.length}</Text>
                    </View>
                    <Text style={styles.nearbyButtonText}>Nearby You</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search property in your city..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={handleSearch}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                <TouchableOpacity style={styles.searchIcon}>
                    <Ionicons name="search-outline" size={20} color="#1F2937" />
                </TouchableOpacity>
            </View>

            {showSuggestions && (
                <View style={styles.suggestionsContainer}>
                    {citySuggestions.length > 0 && (
                        <>
                            <Text style={styles.suggestionsTitle}>Cities</Text>
                            {citySuggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionItem}
                                    onPress={() => handleSuggestionPress(suggestion, true)}
                                >
                                    <Text style={styles.suggestionText}>{suggestion.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </View>
            )}

            {/* Overlay to fade background when search is focused */}
            {showSuggestions && (
                <View style={styles.overlay} />
            )}

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={region || {
                    latitude: 26.4499,
                    longitude: 74.6399,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                }}
                onRegionChangeComplete={handleRegionChange}
                compassEnabled={true}
            >
                {visibleMarkers.map((property) => (
                    <CustomMarker
                        key={property.id}
                        property={property}
                        isSelected={selectedPropertyId === property.id}
                        onPress={() => handleMarkerPress(property)}
                    />
                ))}
            </MapView>

            {error && !loading && (
                <View style={styles.errorContainer}>
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>{error}</Text>
                    </View>
                </View>
            )}
            {!error && !loading && visibleMarkers.length === 0 && filteredData.length === 0 && (
                <View style={styles.errorContainer}>
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>Can't find real estate nearby you</Text>
                    </View>
                </View>
            )}

            <FlatList
                ref={flatListRef}
                data={filteredData || []}
                renderItem={({ item }) => (
                    <HorizontalCard item={item} onPress={() => handleCardPress(item.id)} />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 20, paddingHorizontal: 16 }}
                style={styles.cardList}
                initialNumToRender={8}
                maxToRenderPerBatch={8}
                windowSize={8}
                onEndReached={fetchMoreData}
                onEndReachedThreshold={0.5}
                ListFooterComponent={() => hasMore && !loading ? (
                    <TouchableOpacity style={styles.viewMoreButton} onPress={fetchMoreData}>
                        <Text style={styles.viewMoreText}>View More</Text>
                    </TouchableOpacity>
                ) : null}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    }, 500);
                }}
            />
        </Pressable>
    );
};

export default Mapview;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    map: {
        flex: 1,
    },
    searchContainer: {
        position: 'absolute',
        top: 60,
        left: 15,
        right: 15,
        zIndex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 15,
        paddingVertical: 20,
        shadowColor: 'green',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    searchIcon: {
        marginLeft: 10,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 130,
        left: 16,
        right: 16,
        zIndex: 2,
        backgroundColor: '#e0e6e9',
        borderRadius: 25,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    suggestionsTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    suggestionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e6e9',
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    propertyCount: {
        backgroundColor: 'lightgreen',
        borderRadius: 10,
        paddingInline: 7,
        marginRight: 7,
    },
    propertyCountText: {
        color: '#000',
        fontSize: 14,
    },
    errorContainer: {
        position: 'absolute',
        bottom: 100,
        left: 10,
        right: 10,
        zIndex: 1,
        alignItems: 'center',
    },
    nearbyButton: {
        backgroundColor: '#234F68',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    nearbyButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    noResultsContainer: {
        backgroundColor: '#234F68',
        borderRadius: 25,
        paddingVertical: 12,
        paddingHorizontal: 20,
    },
    noResultsText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
    },
    cardList: {
        position: 'absolute',
        bottom: 90,
        left: 0,
        right: 0,
    },
    loadingContainer: {
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        zIndex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#234F68',
    },
    locationContainer: {
        position: 'absolute',
        top: 10,
        left: 16,
        zIndex: 1,
        backgroundColor: '#234F68',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 5,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1,
    },
    viewMoreButton: {
        backgroundColor: '#234F68',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 10,
    },
    viewMoreText: {
        color: '#fff',
        fontSize: 14,
    },
});