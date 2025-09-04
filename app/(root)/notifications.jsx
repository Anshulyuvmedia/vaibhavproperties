import { StyleSheet, Text, TouchableOpacity, View, Image, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import icons from '@/constants/icons';
import RBSheet from 'react-native-raw-bottom-sheet';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
    const { t, i18n } = useTranslation();
    const [notificationData, setNotificationData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [readStatus, setReadStatus] = useState({});
    const [filter, setFilter] = useState(t('all'));
    const [selectedNotification, setSelectedNotification] = useState(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const parsedUserData = JSON.parse(await AsyncStorage.getItem('userData'));
            const token = await AsyncStorage.getItem('userToken');

            const response = await axios.get(`https://landsquire.in/api/usernotifications/?id=${parsedUserData.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
            });
            // console.log('all response', response.data.notifications);
            if (response.data?.notifications) {
                const apiData = response.data.notifications;
                setNotificationData(apiData);
                const storedStatus = await AsyncStorage.getItem('readStatus');
                if (storedStatus) {
                    setReadStatus(JSON.parse(storedStatus));
                } else {
                    const initialStatus = {};
                    apiData.forEach((item, index) => {
                        initialStatus[item.id || index] = item.read_at !== null;
                    });
                    setReadStatus(initialStatus);
                }
            } else {
                console.error('Unexpected API response format:', response.data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const toggleReadStatus = async (id) => {
        const updatedStatus = { ...readStatus, [id]: !readStatus[id] };
        setReadStatus(updatedStatus);
        await AsyncStorage.setItem('readStatus', JSON.stringify(updatedStatus));
    };

    const markAllAsRead = async () => {
        const updatedStatus = {};
        notificationData.forEach((item, index) => {
            updatedStatus[item.id || index] = true;
        });
        setReadStatus(updatedStatus);
        await AsyncStorage.setItem('readStatus', JSON.stringify(updatedStatus));
    };

    const handleOpenSheet = async (item, index) => {
        const key = item.id || index;
        if (!readStatus[key]) {
            const updatedStatus = { ...readStatus, [key]: true };
            setReadStatus(updatedStatus);
            await AsyncStorage.setItem('readStatus', JSON.stringify(updatedStatus));
        }
        setSelectedNotification(item);
        refRBSheet.current.open();
    };

    const handleCardPress = (id) => router.push(`/properties/${id}`);

    const filteredNotifications = notificationData.filter((item, index) => {
        const key = item.id || index;
        if (filter === t('all')) return true;
        return readStatus[key] === (filter === t('read'));
    });

    const groupByDate = (data) => {
        const today = new Date().toLocaleDateString();
        return {
            today: data.filter(item => new Date(item.created_at).toLocaleDateString() === today),
            older: data.filter(item => new Date(item.created_at).toLocaleDateString() !== today),
        };
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2); // get last 2 digits
        return `${day}/${month}/${year}`;
    };


    const { today, older } = groupByDate(filteredNotifications);

    const unreadCount = notificationData.filter((item, index) => !readStatus[item.id || index]).length;
    const readCount = notificationData.length - unreadCount;

    const renderNotification = ({ item, index }) => {
        const notificationData = JSON.parse(item.data);
        const key = item.id || index;
        const imageUrl = item.property && item.property.thumbnail
            ? `https://landsquire.in/adminAssets/images/Listings/${item.property.thumbnail}`
            : 'https://via.placeholder.com/40';
        const isRead = readStatus[key] || false;
        const previewText = notificationData.message.length > 50
            ? `${notificationData.message.substring(0, 50)}...`
            : notificationData.message;

        return (
            <TouchableOpacity onPress={() => handleOpenSheet(item, index)}>
                <View style={[styles.card, !isRead && styles.unreadCard]}>
                    <Image source={{ uri: imageUrl }} style={styles.profileImage} />
                    <View style={styles.details}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.name, !isRead && styles.unreadText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                {notificationData.title}
                            </Text>
                            <TouchableOpacity onPress={() => toggleReadStatus(key)}>
                                <View style={[styles.statusDot, isRead ? styles.readDot : styles.unreadDot]} />
                            </TouchableOpacity>
                        </View>
                        <Text style={[styles.description, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]} numberOfLines={2}>
                            {previewText}
                        </Text>
                        <Text style={[styles.timestamp, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const refRBSheet = React.useRef();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Image source={icons.backArrow} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={[styles.title, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Bold' : 'Rubik-Bold' }]}>
                    {t('notifications')}
                </Text>
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                    <Text style={[styles.markAllText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                        {t('markAllRead')}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filterContainer}>
                {[t('all'), t('read'), t('unread')].map((status, index) => {
                    const originalStatus = ['All', 'Read', 'Unread'][index];
                    const count = originalStatus === 'All' ? notificationData.length : originalStatus === 'Read' ? readCount : unreadCount;
                    return (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterButton, filter === status && styles.activeFilter]}
                            onPress={() => setFilter(status)}
                        >
                            <Text style={[styles.filterText, filter === status && styles.activeFilterText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                {status} {count > 0 && `(${count})`}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#234F68" />
                </View>
            ) : notificationData.length === 0 ? (
                <View style={styles.noDataContainer}>
                    <Image source={icons.alertDanger} style={styles.noDataIcon} />
                    <Text style={[styles.noDataTitle, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Bold' : 'Rubik-Bold' }]}>
                        {t('noNotificationTitle')}
                    </Text>
                    <Text style={[styles.noDataMessage, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                        {t('noNotificationMessage')}
                    </Text>
                </View>
            ) : (
                <>
                    {today.length > 0 && (
                        <View>
                            <Text style={[styles.sectionTitle, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-SemiBold' : 'Rubik-SemiBold' }]}>
                                {t('today')}
                            </Text>
                            <FlatList
                                data={today}
                                keyExtractor={(item, index) => (item.id || index).toString()}
                                renderItem={renderNotification}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    )}
                    {older.length > 0 && (
                        <View style={styles.olderSection}>
                            <Text style={[styles.sectionTitle, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-SemiBold' : 'Rubik-SemiBold' }]}>
                                {t('olderNotifications')}
                            </Text>
                            <FlatList
                                data={older}
                                keyExtractor={(item, index) => (item.id || index).toString()}
                                renderItem={renderNotification}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    )}
                </>
            )}

            <RBSheet
                ref={refRBSheet}
                closeOnDragDown={true}
                closeOnPressMask={true}
                customStyles={{
                    wrapper: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                    container: {
                        borderTopLeftRadius: moderateScale(20),
                        borderTopRightRadius: moderateScale(20),
                        padding: moderateScale(16),
                        height: 400,
                    },
                    draggableIcon: { backgroundColor: '#D1D5DB' },
                }}
            >
                {selectedNotification && (
                    <>
                        <View className='flex-row'>
                            <Image
                                source={{
                                    uri: selectedNotification.property && selectedNotification.property.thumbnail
                                        ? `https://landsquire.in/adminAssets/images/Listings/${selectedNotification.property.thumbnail}`
                                        : 'https://via.placeholder.com/40'
                                }}
                                style={styles.profileImage}
                            />
                            <View >
                                <Text style={[styles.sheetTitle, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-SemiBold' : 'Rubik-SemiBold' }]}>
                                    {JSON.parse(selectedNotification.data).title}
                                </Text>
                                <Text style={[styles.sheetTimestamp, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {new Date(selectedNotification.created_at).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        <ScrollView className='mt-3'>

                            {selectedNotification.property && (
                                <>
                                    <View style={styles.highlightContainer}>
                                        <Text style={[styles.highlightText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-SemiBold' : 'Rubik-SemiBold' }]}>
                                            Property: {selectedNotification.property.property_name}
                                        </Text>
                                    </View>
                                    {selectedNotification.property.bidenddate && (
                                        <View style={styles.highlightContainer}>

                                            <Text style={[
                                                styles.highlightText,
                                                { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-SemiBold' : 'Rubik-SemiBold' }
                                            ]}>
                                                Bid End Date: {formatDate(selectedNotification.property.bidenddate)}
                                            </Text>
                                        </View>
                                    )}
                                </>
                            )}
                            <Text style={[styles.sheetDescription, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                {JSON.parse(selectedNotification.data).message}
                            </Text>
                        </ScrollView>

                        <View className=' flex-row g-5 justify-content-between'>
                            {selectedNotification.property && (
                                <TouchableOpacity
                                    style={styles.viewPropertyButton}
                                    onPress={() => handleCardPress(selectedNotification.property.id)}
                                >
                                    <Text style={[styles.viewPropertyButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                        {t('viewPropertynoti')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => refRBSheet.current.close()}
                            >
                                <Text style={[styles.closeButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('close')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </RBSheet>
        </View>
    );
};

// Updated styles with new styles for highlighting and view property button
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        paddingHorizontal: scale(16),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: verticalScale(12),
    },
    backButton: {
        backgroundColor: '#f4f2f7',
        borderRadius: moderateScale(20),
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        width: moderateScale(20),
        height: moderateScale(20),
    },
    title: {
        fontSize: moderateScale(18),
        fontFamily: 'Rubik-Bold',
        color: '#234F68',
    },
    markAllButton: {
        backgroundColor: '#f4f2f7',
        borderRadius: moderateScale(20),
        paddingVertical: verticalScale(6),
        paddingHorizontal: scale(12),
    },
    markAllText: {
        fontSize: moderateScale(12),
        color: '#234F68',
        fontWeight: '500',
    },
    filterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    filterButton: {
        flex: 1,
        backgroundColor: '#f4f2f7',
        paddingVertical: verticalScale(8),
        borderRadius: moderateScale(20),
        alignItems: 'center',
        marginHorizontal: scale(2),
    },
    activeFilter: {
        backgroundColor: '#234F68',
    },
    filterText: {
        fontSize: moderateScale(12),
        color: '#6B7280',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        color: '#1E293B',
        marginVertical: verticalScale(8),
    },
    olderSection: {
        marginTop: verticalScale(16),
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#f4f2f7',
        borderRadius: moderateScale(12),
        padding: moderateScale(12),
        marginBottom: verticalScale(8),
    },
    unreadCard: {
        borderWidth: 1,
        borderColor: '#8bc83f',
        backgroundColor: '#fff',
    },
    profileImage: {
        width: scale(70),
        height: scale(70),
        borderRadius: moderateScale(5),
        marginRight: scale(12),
    },
    details: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: moderateScale(14),
        fontWeight: '500',
        color: '#6B7280',
    },
    unreadText: {
        color: '#1E293B',
    },
    description: {
        fontSize: moderateScale(12),
        color: '#9CA3AF',
        marginTop: verticalScale(4),
    },
    timestamp: {
        fontSize: moderateScale(10),
        color: '#9CA3AF',
        marginTop: verticalScale(4),
    },
    statusDot: {
        width: moderateScale(10),
        height: moderateScale(10),
        borderRadius: moderateScale(5),
        borderWidth: 1,
    },
    unreadDot: {
        backgroundColor: '#8bc83f',
        borderColor: '#8bc83f',
    },
    readDot: {
        backgroundColor: '#FFFFFF',
        borderColor: '#D1D5DB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetTitle: {
        fontSize: moderateScale(18),
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: verticalScale(8),
    },
    sheetDescription: {
        fontSize: moderateScale(14),
        color: '#4B5563',
        marginBottom: verticalScale(8),
    },
    sheetTimestamp: {
        fontSize: moderateScale(12),
        color: '#9CA3AF',
        marginBottom: verticalScale(16),
    },
    highlightContainer: {
        backgroundColor: '#F0F4F8',
        padding: moderateScale(8),
        borderRadius: moderateScale(6),
        marginBottom: verticalScale(8),
    },
    highlightText: {
        fontSize: moderateScale(14),
        color: '#234F68',
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    viewPropertyButton: {
        backgroundColor: '#8bc83f',
        paddingVertical: verticalScale(10),
        borderRadius: moderateScale(12),
        margin: moderateScale(5),
        alignItems: 'center',
        flex: 1 / 2,
    },
    viewPropertyButtonText: {
        fontSize: moderateScale(14),
        color: '#FFFFFF',
        fontWeight: '500',
    },
    closeButton: {
        backgroundColor: '#234F68',
        paddingVertical: verticalScale(10),
        borderRadius: moderateScale(12),
        margin: moderateScale(5),
        alignItems: 'center',
        flex: 1 / 2,
    },
    closeButtonText: {
        fontSize: moderateScale(14),
        color: '#FFFFFF',
        fontWeight: '500',
    },
    noDataContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: scale(20),
    },
    noDataIcon: {
        width: scale(120),
        height: scale(120),
    },
    noDataTitle: {
        fontSize: moderateScale(18),
        fontWeight: '600',
        color: '#2D3748',
        textAlign: 'center',
        marginBottom: verticalScale(8),
    },
    noDataMessage: {
        fontSize: moderateScale(14),
        color: '#718096',
        textAlign: 'center',
        marginBottom: verticalScale(16),
    },
});

export default Notifications;