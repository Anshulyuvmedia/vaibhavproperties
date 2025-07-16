import { StyleSheet, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, Dimensions, Linking } from 'react-native';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import images from '@/constants/images';
import { useRouter } from 'expo-router';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Ionicons from '@expo/vector-icons/Ionicons';
import icons from '@/constants/icons';

const PADDING_HORIZONTAL = scale(15);
const GAP = scale(7);

const Allbrokers = () => {
    const [brokerList, setbrokerList] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fetchAgenList = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/brokerlist`);
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                console.log(response.data.data);
                const apiData = response.data.data.map((broker, index) => ({
                    id: broker.id,
                    city: broker.city,
                    name: broker.username ? broker.username.split(' ')[0] : 'Unknown broker',
                    image: broker.profile
                        ? broker.profile.startsWith('http')
                            ? { uri: broker.profile }
                            : { uri: `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Users/${broker.profile}` }
                        : images.avatar,
                    phone: broker.mobilenumber || `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`, // Use mobilenumber from API
                }));
                setbrokerList(apiData);
            } else {
                console.error('Unexpected API response format:', response.data);
                setbrokerList([]);
            }
        } catch (error) {
            console.error('Error fetching broker data:', error.response ? `${error.response.status} - ${error.response.statusText}` : error.message, error.response ? error.response.data : {});
            setbrokerList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgenList();
    }, []);

    const handleCall = (phone) => {
        if (phone) {
            Linking.openURL(`tel:${phone}`).catch((err) => console.error('Error opening phone dialer:', err));
        } else {
            console.error('No phone number provided for call');
        }
    };

    const handleWhatsApp = (phone) => {
        console.log('Attempting WhatsApp with phone:', phone); // Debug log
        if (phone) {
            // Ensure phone number is formatted correctly (remove spaces, ensure country code if needed)
            const formattedPhone = phone.replace(/\s/g, '').startsWith('+') ? phone.replace(/\s/g, '') : `+91${phone.replace(/\s/g, '')}`;
            Linking.openURL(`https://wa.me/${formattedPhone}`).catch((err) => console.error('Error opening WhatsApp:', err));
        } else {
            console.error('No phone number provided for WhatsApp');
        }
    };

    const renderbroker = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                const imageUri = typeof item.image === 'object' && item.image.uri ? item.image.uri : (typeof item.image === 'number' ? images.avatar : item.image);
                router.push({ pathname: `/broker/${item.id}`, params: { name: item.name, image: imageUri } });
            }}
        >
            <Image
                source={item.image}
                style={styles.brokerImage}
                onError={(error) => console.log('Image load error for', item.name, ':', error.nativeEvent.error)}
            />
            <View className='flex-row justify-content-between flex-1'>
                <View style={styles.infoContainer}>
                    <Text style={styles.brokerName}>{item.name}</Text>
                    <View style={styles.ratingContainer}>
                        <Text style={styles.ratingText}>{item.city}</Text>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(item.phone)}>
                        <Ionicons name="call" size={moderateScale(18)} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#25D366' }]} onPress={() => handleWhatsApp(item.phone)}>
                        <Ionicons name="logo-whatsapp" size={moderateScale(18)} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8bc83f" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>All Property Brokers</Text>
                </View>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Image source={icons.backArrow} style={styles.backIcon} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={brokerList}
                renderItem={renderbroker}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <Text style={styles.emptyText}>No brokers available</Text>
                )}
            />
        </View>
    );
};

export default Allbrokers;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        paddingHorizontal: PADDING_HORIZONTAL,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(10),
    },
    backButton: {
        backgroundColor: '#E6F0FA',
        borderRadius: 9999,
        width: scale(44),
        height: scale(44),
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        width: scale(20),
        height: scale(20),
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: moderateScale(20),
        fontFamily: 'Rubik-Bold',
        color: '#234F68',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    flatListContent: {
        paddingBottom: verticalScale(20),
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: moderateScale(8),
        padding: moderateScale(10),
        marginBottom: moderateScale(10),
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    brokerImage: {
        width: scale(50),
        height: scale(50),
        borderRadius: 9999,
        backgroundColor: '#fff',
        resizeMode: 'cover',
        marginRight: scale(10),
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    brokerName: {
        fontSize: moderateScale(16),
        fontFamily: 'Rubik-Medium',
        color: '#234F68',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: verticalScale(2),
    },
    ratingText: {
        marginLeft: scale(5),
        fontSize: moderateScale(12),
        fontFamily: 'Rubik-Regular',
        color: '#6B7280',
    },
    salesText: {
        marginLeft: scale(5),
        fontSize: moderateScale(12),
        fontFamily: 'Rubik-Regular',
        color: '#6B7280',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: verticalScale(5),
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        borderRadius: moderateScale(50),
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(12),
        marginRight: scale(10),
    },
    buttonText: {
        color: '#fff',
        fontSize: moderateScale(12),
        fontFamily: 'Rubik-Regular',
        marginLeft: scale(5),
    },
    emptyText: {
        fontSize: moderateScale(16),
        color: '#6B7280',
        textAlign: 'center',
        marginTop: verticalScale(20),
    },
});