import { StyleSheet, Text, View, Image, TouchableOpacity, FlatList, Dimensions, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import images from '@/constants/images';
import icons from '@/constants/icons'; // Ensure this contains heart, location, and noResultFound images
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/Cards';

// Get screen width for dynamic card sizing
const { width: screenWidth } = Dimensions.get('window');
const PADDING_HORIZONTAL = scale(0);
const GAP = scale(10);
const CARD_WIDTH = (screenWidth - 2 * PADDING_HORIZONTAL - GAP) / 2;

const Broker = () => {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [userPropertyData, setUserPropertyData] = useState([]);
    const [brokerData, setBrokerData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchbrokerProfile = async () => {
        setLoading(true);
        setError(null);
        // console.log('Fetching broker profile for id:', id);
        try {
            const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/brokerprofile?id=${id}`);
            // console.log('API Response:', response.data);
            if (response.data.success) {
                if (response.data.brokerdata && response.data.brokerdata.length > 0) {
                    setBrokerData(response.data.brokerdata[0]);
                }
                if (response.data.allproperties) {
                    const formattedProperties = response.data.allproperties.map((item, index) => ({
                        id: item.id || `property_${index}`,
                        property_name: item.property_name || item.title || 'Unnamed Property',
                        address: item.address || 'N/A',
                        price: item.price || 'N/A',
                        status: item.status || 'N/A',
                        category: item.category || 'N/A',
                        thumbnail: item.thumbnail,
                        city: item.city || 'N/A',
                    }));
                    // console.log('Formatted Properties:', formattedProperties);
                    setUserPropertyData(formattedProperties);
                }
            } else {
                throw new Error(response.data.message || 'Failed to fetch broker profile');
            }
        } catch (error) {
            console.error('Error fetching user data:', error.message, 'Response:', error.response?.data);
            setError(error.message);
            setUserPropertyData([]);
            setBrokerData(null);
        } finally {
            setLoading(false);
            setRefreshing(false); // Reset refreshing state when done
        }
    };

    useEffect(() => {
        fetchbrokerProfile();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchbrokerProfile();
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Image source={icons.noResultFound} style={styles.emptyImage} />
            <Text style={styles.emptyTitle}>
                Listing <Text style={styles.emptyHighlight}>not found</Text>
            </Text>
            <Text style={styles.emptySubtitle}>
                Sorry, we can't find the real estate from the broker.
            </Text>
        </View>
    );

    const getProfileImageUri = () => {
        let baseUri = brokerData?.profile
            ? brokerData.profile.startsWith('http')
                ? brokerData.profile
                : `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Users/${brokerData.profile}`
            : images.avatar;
        // console.log('Profile Image URI:', baseUri);
        return baseUri.toString();
    };

    const handleCardPress = (id) => router.push(`/properties/${id}`);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Broker Profile</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
                    <MaterialIcons name="arrow-back" size={moderateScale(20, 0.3)} color="#4B5563" />
                </TouchableOpacity>
            </View>
            {brokerData ? (
                <>
                    <Image
                        source={{ uri: getProfileImageUri() }}
                        style={styles.profileImage}
                        onError={(error) => console.log('Image load error for', brokerData.username, ':', error.nativeEvent.error)}
                    />
                    <Text style={styles.name}>{brokerData.username}</Text>
                    <Text style={styles.email}>{brokerData.email}</Text>
                </>
            ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <View style={styles.listingsSection}>
                <Text style={styles.listingsTitle}>{userPropertyData.length} listings</Text>
                {loading ? (
                    <Text style={styles.loadingText}>Loading...</Text>
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <FlatList
                        data={userPropertyData}
                        renderItem={({ item }) => <Card item={item} onPress={() => handleCardPress(item.id)} style={styles.card} />}
                        keyExtractor={(item) => item.id.toString()}
                        numColumns={2}
                        contentContainerStyle={styles.flatListContent}
                        columnWrapperStyle={styles.flatListColumnWrapper}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={!loading && userPropertyData.length === 0 ? renderEmptyComponent : null}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#234F68']}
                                progressBackgroundColor="#f4f2f7"
                            />
                        }
                    />
                )}
            </View>
            {/* <TouchableOpacity style={styles.chatButton} onPress={handleChatPress}>
                <Text style={styles.chatButtonText}>Start Chat</Text>
            </TouchableOpacity> */}
        </View>
    );
};

export default Broker;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        paddingHorizontal: scale(15),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: verticalScale(12),
    },
    headerText: {
        fontSize: moderateScale(18, 0.3),
        fontFamily: 'Rubik-Bold',
        color: '#234F68',
    },
    backButton: {
        backgroundColor: '#f4f2f7',
        borderRadius: moderateScale(20, 0.3),
        width: moderateScale(40, 0.3),
        height: moderateScale(40, 0.3),
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: scale(75),
        height: scale(75),
        borderRadius: moderateScale(50, 0.3),
        alignSelf: 'center',
        marginBottom: verticalScale(10),
    },
    name: {
        fontSize: moderateScale(22, 0.3),
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#000',
        marginBottom: verticalScale(5),
    },
    email: {
        fontSize: moderateScale(14, 0.3),
        textAlign: 'center',
        color: '#666',
        marginBottom: verticalScale(15),
    },

    listingsSection: {
        marginBottom: verticalScale(20),
    },
    listingsTitle: {
        fontSize: moderateScale(18, 0.3),
        fontWeight: 'bold',
        color: '#000',
        marginBottom: verticalScale(10),
    },
    flatListContent: {
        paddingBottom: verticalScale(32),
        paddingHorizontal: PADDING_HORIZONTAL,
    },
    flatListColumnWrapper: {
        flexDirection: 'row',
        gap: GAP,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: moderateScale(10, 0.3),
        width: CARD_WIDTH,
        marginBottom: verticalScale(15),
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: moderateScale(4, 0.3),
    },
    chatButton: {
        backgroundColor: '#8bc83f',
        padding: moderateScale(15, 0.3),
        borderRadius: moderateScale(10, 0.3),
        alignItems: 'center',
        marginTop: verticalScale(10),
    },
    chatButtonText: {
        color: '#fff',
        fontSize: moderateScale(16, 0.3),
        fontWeight: 'bold',
    },
    loadingText: {
        textAlign: 'center',
        color: '#666',
    },
    errorText: {
        textAlign: 'center',
        color: 'red',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: verticalScale(20),
    },
    emptyImage: {
        width: scale(160),
        height: scale(160),
    },
    emptyTitle: {
        fontSize: moderateScale(24, 0.3),
        fontFamily: 'Rubik-Bold',
        color: '#4B5563',
        textAlign: 'center',
        marginTop: verticalScale(10),
    },
    emptyHighlight: {
        color: '#234F68',
    },
    emptySubtitle: {
        fontSize: moderateScale(16, 0.3),
        fontFamily: 'Rubik-Regular',
        color: '#6B7280',
        textAlign: 'center',
        marginTop: verticalScale(5),
    },
});