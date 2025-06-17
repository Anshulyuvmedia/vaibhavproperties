import { StyleSheet, View, FlatList, Image } from 'react-native';
import React, { useRef, useState, useEffect, memo } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import axios from 'axios';
import { HorizontalCard } from '@/components/Cards';
import Constants from 'expo-constants';
import debounce from 'lodash.debounce';

// Define parseCoordinates outside Mapview
const parseCoordinates = (maplocations) => {
    try {
        const location = JSON.parse(maplocations);
        return {
            latitude: parseFloat(location.Latitude),
            longitude: parseFloat(location.Longitude),
        };
    } catch (error) {
        console.error('Error parsing maplocations:', error);
        return { latitude: 26.4499, longitude: 74.6399 };
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
    const [listingData, setListingData] = useState(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [region, setRegion] = useState(null);

    // Fetch property data
    const fetchListingData = async (mapRegion) => {
        setLoading(true);
        try {
            const response = await axios.get('https://investorlands.com/api/property-listings', {
                params: {
                    latitude: mapRegion?.latitude,
                    longitude: mapRegion?.longitude,
                    latitudeDelta: mapRegion?.latitudeDelta,
                    longitudeDelta: mapRegion?.longitudeDelta,
                    limit: 50,
                },
            });
            if (response.data.data) {
                setListingData(response.data.data);
                if (!region && response.data.data.length > 0) {
                    const { latitude, longitude } = parseCoordinates(response.data.data[0].maplocations);
                    setRegion({
                        latitude,
                        longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    });
                }
            } else {
                console.error('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListingData();
    }, []);

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
        const index = listingData?.data.findIndex((p) => p.id === property.id);
        if (index !== -1) {
            flatListRef.current?.scrollToIndex({ index, animated: true });
        }
    };

    const handleCardPress = debounce((propertyId) => {
        const property = listingData?.data.find((p) => p.id === propertyId);
        if (property) {
            setSelectedPropertyId(propertyId);
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
        }
    }, 300);

    const handleRegionChange = (newRegion) => {
        setRegion(newRegion);
        // Optionally refetch data based on new region
        // fetchListingData(newRegion);
    };

    const visibleMarkers = listingData?.data?.filter((property) => {
        if (!region) return true;
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

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={region || {
                    latitude: 26.4499,
                    longitude: 74.6399,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                onRegionChangeComplete={handleRegionChange}
                compassEnabled={true}
            >
                {visibleMarkers?.map((property) => (
                    <CustomMarker
                        key={property.id}
                        property={property}
                        isSelected={selectedPropertyId === property.id}
                        onPress={() => handleMarkerPress(property)}
                    />
                ))}
            </MapView>
            <FlatList
                ref={flatListRef}
                data={listingData?.data || []}
                renderItem={({ item }) => (
                    <HorizontalCard item={item} onPress={() => handleCardPress(item.id)} />
                )}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 20, paddingHorizontal: 16 }}
                style={styles.cardList}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
                    }, 500);
                }}
            />
        </View>
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
    cardList: {
        position: 'absolute',
        bottom: 90,
        left: 0,
        right: 0,
    },
    marker: {
        width: 38,
        height: 38,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: '#666876',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },
    markerSelected: {
        borderColor: 'red',
        borderWidth: 3,
        shadowColor: '#3B82F6',
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    markerImage: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
});