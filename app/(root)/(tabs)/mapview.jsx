import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Text, ActivityIndicator, Pressable } from 'react-native';
import React, { useRef, useState, useEffect, memo } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE, Polygon } from 'react-native-maps';
import axios from 'axios';
import { MapCard } from '@/components/Cards';
import Constants from 'expo-constants';
import debounce from 'lodash.debounce';
import * as Location from 'expo-location';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Parse project coordinates
const parseProjectCoordinates = (coordinatesStr) => {
    try {
        const coords = JSON.parse(coordinatesStr);
        return coords.map(c => ({
            latitude: parseFloat(c.lat),
            longitude: parseFloat(c.lng),
        }));
    } catch (error) {
        console.error('Error parsing project coordinates:', error);
        return [];
    }
};

// Calculate centroid for project polygon
const calculateCentroid = (coords) => {
    if (coords.length === 0) return { latitude: 26.4499, longitude: 74.6399 };
    let latSum = 0, lngSum = 0;
    coords.forEach(c => {
        latSum += c.latitude;
        lngSum += c.longitude;
    });
    return {
        latitude: latSum / coords.length,
        longitude: lngSum / coords.length,
    };
};

const Mapview = () => {
    const GOOGLE_MAPS_API_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
    const mapRef = useRef(null);
    const router = useRouter();
    const flatListRef = useRef(null);
    const [propertiesData, setPropertiesData] = useState([]);
    const [projectsData, setProjectsData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [visibleItems, setVisibleItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [region, setRegion] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [citySuggestions, setCitySuggestions] = useState([]);
    const [selectedCity, setSelectedCity] = useState('Ajmer');
    const [currentLocationName, setCurrentLocationName] = useState('Ajmer');
    const [page, setPage] = useState(1);
    const [itemsPerPage] = useState(8); // Items per page for FlatList
    const [markersPerPage] = useState(10); // Items per page for map
    const [hasMore, setHasMore] = useState(true);
    const [mapType, setMapType] = useState('hybrid');
    const [displayMode, setDisplayMode] = useState('both'); // 'both', 'properties', 'projects'
    const [propertyMode, setPropertyMode] = useState('both'); // 'both', 'sell', 'rent'

    const viewItem = (item) => {
        const route = item.type === 'project' ? `/projects/${item.id}` : `/properties/${item.id}`;
        router.push(route);
    };

    // Toggle map type
    const toggleMapType = () => {
        setMapType((prevType) => {
            if (prevType === 'hybrid') return 'standard';
            if (prevType === 'standard') return 'satellite';
            return 'hybrid';
        });
    };

    // Toggle display mode
    const toggleDisplayMode = () => {
        setDisplayMode((prev) => {
            if (prev === 'both') return 'properties';
            if (prev === 'properties') return 'projects';
            return 'both';
        });
    };

    // Toggle property mode
    const togglePropertyMode = () => {
        setPropertyMode((prev) => {
            if (prev === 'both') return 'sell';
            if (prev === 'sell') return 'rent';
            return 'both';
        });
    };

    // Fetch filtered data based on city
    const fetchFilterData = async (city) => {
        setLoading(true);
        setPropertiesData([]);
        setProjectsData([]);
        setFilteredData([]);
        setVisibleItems([]);
        setError(null);
        setPage(1);
        setHasMore(true);

        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            console.error('No token found in AsyncStorage');
            setError('Please log in to access properties.');
            router.push('/signin');
            setLoading(false);
            return;
        }

        try {
            // Fetch properties with city filter
            const queryParams = new URLSearchParams();
            if (city) queryParams.append("filtercity", city);

            const apiUrl = `https://landsquire.in/api/filterlistings?${queryParams.toString()}`;
            const response = await axios.get(apiUrl, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
            });

            setPropertiesData(response.data?.data || []);

            // Fetch projects with region params
            const projectsResponse = await axios.get('https://landsquire.in/api/upcomingproject', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
                params: {
                    latitude: region?.latitude || 26.4499,
                    longitude: region?.longitude || 74.6399,
                    latitudeDelta: region?.latitudeDelta || 5.0,
                    longitudeDelta: region?.longitudeDelta || 5.0,
                },
            });

            setProjectsData(projectsResponse.data?.projects || []);

            if ((response.data?.data || []).length === 0 && (projectsResponse.data?.projects || []).length === 0) {
                setError("No properties or projects found for the selected city.");
            }
        } catch (error) {
            console.error("Error fetching filtered data:", error.response?.data || error.message);
            setPropertiesData([]);
            setProjectsData([]);
            setFilteredData([]);
            setVisibleItems([]);
            if (error.response?.status === 404) {
                setError("No data found for the selected city.");
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

    // Fetch property and project data
    const fetchListingData = async (mapRegion) => {
        setLoading(true);
        setError(null);

        const token = await AsyncStorage.getItem('userToken');
        if (!token) {
            console.error('No token found in AsyncStorage');
            setError('Please log in to access data.');
            router.push('/signin');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('https://landsquire.in/api/property-listings', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
                params: {
                    latitude: mapRegion?.latitude || 26.4499,
                    longitude: mapRegion?.longitude || 74.6399,
                    latitudeDelta: mapRegion?.latitudeDelta || 5.0,
                    longitudeDelta: mapRegion?.longitudeDelta || 5.0,
                },
            });

            const projectsResponse = await axios.get('https://landsquire.in/api/upcomingproject', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
                params: {
                    latitude: mapRegion?.latitude || 26.4499,
                    longitude: mapRegion?.longitude || 74.6399,
                    latitudeDelta: mapRegion?.latitudeDelta || 5.0,
                    longitudeDelta: mapRegion?.longitudeDelta || 5.0,
                },
            });

            // console.log('projects', projectsResponse.data?.projects);

            setPropertiesData(response.data?.data || []);
            setProjectsData(projectsResponse.data?.projects || []);

            if (!region && ((response.data?.data || []).length > 0 || (projectsResponse.data?.projects || []).length > 0)) {
                let firstCoords;
                if (response.data?.data?.length > 0) {
                    firstCoords = parseCoordinates(response.data.data[0].maplocations);
                } else if (projectsResponse.data?.projects?.length > 0) {
                    const polyCoords = parseProjectCoordinates(projectsResponse.data.projects[0].coordinates);
                    firstCoords = calculateCentroid(polyCoords);
                }
                if (firstCoords) {
                    setRegion({
                        latitude: firstCoords.latitude,
                        longitude: firstCoords.longitude,
                        latitudeDelta: 5.0,
                        longitudeDelta: 5.0,
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setPropertiesData([]);
            setProjectsData([]);
            setFilteredData([]);
            setVisibleItems([]);
            if (error.message.includes("Network Error")) {
                setError("Network error. Please check your internet connection.");
            } else {
                setError("An unexpected error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Compute filteredData based on modes and search
    useEffect(() => {
        let data = [];
        if (displayMode === 'properties' || displayMode === 'both') {
            let props = propertiesData.map(p => ({
                ...p,
                type: 'property',
                propertyfor: p.propertyfor || 'sell', // Treat null propertyfor as 'sell'
            }));
            if (propertyMode !== 'both') {
                props = props.filter(p => p.propertyfor.toLowerCase() === propertyMode.toLowerCase());
            }
            if (searchQuery.trim() !== '') {
                props = props.filter(p =>
                    p.property_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.propertyfor?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            data = [...data, ...props];
        }
        if (displayMode === 'projects' || displayMode === 'both') {
            let projs = projectsData.map(p => ({ ...p, type: 'project' }));
            if (searchQuery.trim() !== '') {
                projs = projs.filter(p =>
                    p.projecttitle?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }
            data = [...data, ...projs];
        }

        const paginatedData = data.slice(0, page * itemsPerPage);
        setFilteredData(paginatedData);
        setHasMore(data.length > paginatedData.length);
    }, [propertiesData, projectsData, displayMode, propertyMode, searchQuery, page]);

    // Load more items for FlatList
    const loadMoreData = () => {
        if (loading || !hasMore) return;
        setLoading(true);
        const nextPage = page + 1;
        setPage(nextPage);
        setLoading(false);
    };

    // Initial load with Rajasthan (Ajmer) coordinates
    useEffect(() => {
        const rajasthanRegion = {
            latitude: 26.4499,
            longitude: 74.6399,
            latitudeDelta: 5.0,
            longitudeDelta: 5.0,
        };
        setRegion(rajasthanRegion);
        fetchListingData(rajasthanRegion);
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
                latitudeDelta: 5.0,
                longitudeDelta: 5.0,
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

            fetchListingData(newRegion);
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
                    latitudeDelta: 5.0,
                    longitudeDelta: 5.0,
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
            setShowSuggestions(true);
            setError(null);
            const ajmerRegion = {
                latitude: 26.4499,
                longitude: 74.6399,
                latitudeDelta: 5.0,
                longitudeDelta: 5.0,
            };
            setRegion(ajmerRegion);
            fetchListingData(ajmerRegion);
            return;
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

    const handleMarkerPress = (item) => {
        setSelectedItemId(item.id);
        let coords;
        if (item.type === 'property') {
            coords = parseCoordinates(item.maplocations);
        } else {
            const polyCoords = parseProjectCoordinates(item.coordinates);
            coords = calculateCentroid(polyCoords);
        }

        mapRef.current?.animateToRegion(
            {
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            },
            500
        );

        const index = filteredData.findIndex((p) => p.id === item.id && p.type === item.type);
        if (index !== -1) {
            try {
                flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
            } catch (error) {
                console.warn('Failed to scroll to index:', error);
                setTimeout(() => {
                    flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
                }, 100);
            }
        } else {
            console.warn('Item not found in filteredData:', item.id, item.type);
            setError('Selected item is not in the current list. Try searching or loading more.');
        }
    };

    const handleCardPress = debounce(async (item) => {
        setSelectedItemId(item.id);
        let coords;
        if (item.type === 'property') {
            coords = parseCoordinates(item.maplocations);
        } else {
            const polyCoords = parseProjectCoordinates(item.coordinates);
            coords = calculateCentroid(polyCoords);
        }

        try {
            const geocode = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.latitude},${coords.longitude}&key=${GOOGLE_MAPS_API_KEY}`
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
            console.error('Error reverse geocoding item location:', error);
            setCurrentLocationName('Unknown Location');
        }

        mapRef.current?.animateToRegion(
            {
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
            },
            500
        );
    }, 300);

    const handleRegionChange = (newRegion) => {
        setRegion(newRegion);
    };

    const updateVisibleItems = () => {
        if (!filteredData || !region) {
            setVisibleItems([]);
            return;
        }

        const latDelta = region.latitudeDelta / 2;
        const lngDelta = region.longitudeDelta / 2;

        const itemsInRegion = filteredData.filter((item) => {
            let coords;
            if (item.type === 'property') {
                coords = parseCoordinates(item.maplocations);
            } else {
                const polyCoords = parseProjectCoordinates(item.coordinates);
                coords = calculateCentroid(polyCoords);
            }
            return (
                coords.latitude >= region.latitude - latDelta &&
                coords.latitude <= region.latitude + latDelta &&
                coords.longitude >= region.longitude - lngDelta &&
                coords.longitude <= region.longitude + lngDelta
            );
        });

        setVisibleItems(itemsInRegion.slice(0, page * markersPerPage));
    };

    useEffect(() => {
        updateVisibleItems();
    }, [filteredData, region, page]);

    return (
        <Pressable style={styles.container} onPress={() => setShowSuggestions(false)}>
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#234F68" />
                    <Text style={styles.loadingText}>Loading data...</Text>
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
                <TouchableOpacity style={styles.mapTypeButton} onPress={toggleMapType}>
                    <Text style={styles.mapTypeButtonText}>
                        {mapType.charAt(0).toUpperCase() + mapType.slice(1)}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search property or project in your city..."
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

            <View style={styles.filterContainer}>
                <TouchableOpacity style={styles.mapTypeButton} onPress={toggleDisplayMode}>
                    <Text style={styles.mapTypeButtonText}>
                        {displayMode.charAt(0).toUpperCase() + displayMode.slice(1)}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapTypeButton} onPress={togglePropertyMode}>
                    <Text style={styles.mapTypeButtonText}>
                        {propertyMode.charAt(0).toUpperCase() + propertyMode.slice(1)}
                    </Text>
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

            {showSuggestions && (
                <View style={styles.overlay} />
            )}

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: 26.4499,
                    longitude: 74.6399,
                    latitudeDelta: 5.0,
                    longitudeDelta: 5.0,
                }}
                onRegionChangeComplete={handleRegionChange}
                compassEnabled={true}
                mapType={mapType}
            >
                {visibleItems.map((item) => {
                    if (item.type === 'property') {
                        const coords = parseCoordinates(item.maplocations);
                        const price =
                            item.price != null && !isNaN(item.price)
                                ? `₹${Number(item.price).toLocaleString('en-IN')}`
                                : 'N/A';

                        return (
                            <Marker
                                key={`property-${item.id}`}
                                coordinate={coords}
                                pinColor="red"
                                onPress={() => handleMarkerPress(item)}
                                anchor={{ x: 0.5, y: 0.5 }}
                            />
                        );
                    } else {
                        const polyCoords = parseProjectCoordinates(item.coordinates);
                        if (polyCoords.length < 3) return null; // Need at least 3 points for polygon
                        const centroid = calculateCentroid(polyCoords);

                        return (
                            <React.Fragment key={`project-${item.id}`}>
                                <Polygon
                                    coordinates={polyCoords}
                                    fillColor="rgba(0, 200, 0, 0.3)"
                                    strokeColor="green"
                                    strokeWidth={2}
                                />
                                <Marker
                                    coordinate={centroid}
                                    pinColor="green"
                                    onPress={() => handleMarkerPress(item)}
                                    anchor={{ x: 0.5, y: 0.5 }}
                                />
                            </React.Fragment>
                        );
                    }
                })}
            </MapView>

            {error && !loading && (
                <View style={styles.errorContainer}>
                    <View style={styles.noResultsContainer}>
                        <Text style={styles.noResultsText}>{error}</Text>
                    </View>
                </View>
            )}
            {!error && !loading && visibleItems.length === 0 && filteredData.length === 0 && (
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
                    <MapCard
                        item={{
                            ...item,
                            property_name: item.property_name || item.projecttitle,
                            description: item.description || item.discription,
                            // Add more field mappings if needed for MapCard
                        }}
                        map={'true'}
                        onPress={() => handleCardPress(item)}
                        onView={() => viewItem(item)}
                    />
                )}
                keyExtractor={(item) => `${item.type}-${item.id}`}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 20, paddingHorizontal: 16 }}
                style={styles.cardList}
                initialNumToRender={itemsPerPage}
                maxToRenderPerBatch={itemsPerPage}
                windowSize={itemsPerPage}
                ListFooterComponent={() => hasMore && !loading ? (
                    <TouchableOpacity style={styles.viewMoreButton} onPress={loadMoreData}>
                        <Text style={styles.viewMoreText}>Load More</Text>
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
        backgroundColor: '#fafafa',
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
    filterContainer: {
        position: 'absolute',
        top: 130,
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
        marginRight: 10,
    },
    nearbyButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    mapTypeButton: {
        backgroundColor: '#234F68',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    mapTypeButtonText: {
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
    markerWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        overflow: 'visible',
    },
    markerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        maxWidth: 250,
    },
    markerText: {
        marginLeft: 6,
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    trianglePointer: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: 'white',
        marginTop: -1,
    },
});