import { StyleSheet, Text, TouchableOpacity, View, Image, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import icons from '@/constants/icons';
import RBSheet from 'react-native-raw-bottom-sheet';

const Notifications = () => {
    const [notificationData, setNotificationData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [readStatus, setReadStatus] = useState({});
    const [filter, setFilter] = useState('All');
    const [selectedNotification, setSelectedNotification] = useState(null);

    // Function to Fetch Notifications
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const parsedUserData = JSON.parse(await AsyncStorage.getItem('userData'));
            const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/usernotifications/?user_type=${parsedUserData.user_type}`);

            if (response.data?.notifications) {
                const apiData = response.data.notifications;
                setNotificationData(apiData);
                const storedStatus = await AsyncStorage.getItem('readStatus');
                if (storedStatus) {
                    setReadStatus(JSON.parse(storedStatus));
                } else {
                    const initialStatus = {};
                    apiData.forEach((item) => {
                        initialStatus[item.id] = false;
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

    // Function to Toggle Read/Unread Status
    const toggleReadStatus = async (id) => {
        const updatedStatus = { ...readStatus, [id]: !readStatus[id] };
        setReadStatus(updatedStatus);
        await AsyncStorage.setItem('readStatus', JSON.stringify(updatedStatus));
    };

    // Function to Mark All as Read
    const markAllAsRead = async () => {
        const updatedStatus = {};
        notificationData.forEach((item) => {
            updatedStatus[item.id] = true;
        });
        setReadStatus(updatedStatus);
        await AsyncStorage.setItem('readStatus', JSON.stringify(updatedStatus));
    };

    // Mark Notification as Read when RBSheet opens
    const handleOpenSheet = async (item) => {
        if (!readStatus[item.id]) {
            const updatedStatus = { ...readStatus, [item.id]: true };
            setReadStatus(updatedStatus);
            await AsyncStorage.setItem('readStatus', JSON.stringify(updatedStatus));
        }
        setSelectedNotification(item);
        refRBSheet.current.open();
    };

    // Filter Notifications by Read/Unread Status
    const filteredNotifications = notificationData.filter((item) => {
        if (filter === 'All') return true;
        return readStatus[item.id] === (filter === 'Read');
    });

    // Group notifications by date (Today vs Older)
    const groupByDate = (data) => {
        const today = new Date().toLocaleDateString();
        return {
            today: data.filter(item => new Date(item.created_at).toLocaleDateString() === today),
            older: data.filter(item => new Date(item.created_at).toLocaleDateString() !== today),
        };
    };

    const { today, older } = groupByDate(filteredNotifications);

    // Calculate Read and Unread Counts
    const unreadCount = notificationData.filter(item => !readStatus[item.id]).length;
    const readCount = notificationData.length - unreadCount;

    const renderNotification = ({ item }) => {
        const imageUrl = `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Notificaitons/${item.notificationimg}`;
        const isRead = readStatus[item.id] || false;
        const previewText = item.notificationdes.length > 50 ? `${item.notificationdes.substring(0, 50)}...` : item.notificationdes;

        return (
            <TouchableOpacity onPress={() => handleOpenSheet(item)}>
                <View style={[styles.card, !isRead && styles.unreadCard]}>
                    <Image source={{ uri: imageUrl }} style={styles.profileImage} />
                    <View style={styles.details}>
                        <View style={styles.headerRow}>
                            <Text style={[styles.name, !isRead && styles.unreadText]}>{item.notificationname}</Text>
                            <TouchableOpacity onPress={() => toggleReadStatus(item.id)}>
                                <View style={[styles.statusDot, isRead ? styles.readDot : styles.unreadDot]} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.description} numberOfLines={2}>{previewText}</Text>
                        <Text style={styles.timestamp}>
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Image source={icons.backArrow} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
                    <Text style={styles.markAllText}>Mark All Read</Text>
                </TouchableOpacity>
            </View>

            {/* Filter Buttons with Counts */}
            <View style={styles.filterContainer}>
                {['All', 'Read', 'Unread'].map((status) => {
                    const count = status === 'All' ? notificationData.length : status === 'Read' ? readCount : unreadCount;
                    return (
                        <TouchableOpacity
                            key={status}
                            style={[styles.filterButton, filter === status && styles.activeFilter]}
                            onPress={() => setFilter(status)}
                        >
                            <Text style={[styles.filterText, filter === status && styles.activeFilterText]}>
                                {status} {count > 0 && `(${count})`}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Loading State */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#234F68" />
                </View>
            ) : notificationData.length === 0 ? (
                <View style={styles.noDataContainer}>

                    <Image source={icons.alertDanger} style={styles.noDataIcon} />

                    <Text style={styles.noDataTitle}>No Notification Yet</Text>
                    <Text style={styles.noDataMessage}>
                        You will receive all important notifications here meaning
                    </Text>
                </View>
            ) : (
                <>
                    {today.length > 0 && (
                        <View>
                            <Text style={styles.sectionTitle}>Today</Text>
                            <FlatList
                                data={today}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderNotification}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    )}
                    {older.length > 0 && (
                        <View style={styles.olderSection}>
                            <Text style={styles.sectionTitle}>Older notifications</Text>
                            <FlatList
                                data={older}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderNotification}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    )}
                </>
            )}

            {/* RBSheet for Full Notification */}
            <RBSheet
                ref={refRBSheet}
                closeOnDragDown={true}
                closeOnPressMask={true}
                customStyles={{
                    wrapper: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    },
                    container: {
                        borderTopLeftRadius: moderateScale(20),
                        borderTopRightRadius: moderateScale(20),
                        padding: moderateScale(16),
                        height: 500,
                    },
                    draggableIcon: {
                        backgroundColor: '#D1D5DB',
                    },
                }}
            >
                {selectedNotification && (
                    <>
                        <View className='flex-row'>
                            <Image
                                source={{ uri: `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Notificaitons/${selectedNotification.notificationimg}` }}
                                style={styles.profileImage}
                                // onError={(e) => console.log('Image failed to load:', e.nativeEvent.error)}
                            />
                            <View>
                                <Text style={styles.sheetTitle}>{selectedNotification.notificationname}</Text>
                                <Text style={styles.sheetTimestamp}>
                                    {new Date(selectedNotification.created_at).toLocaleString()}
                                </Text>
                            </View>
                        </View>
                        <ScrollView>
                            <Text style={styles.sheetDescription}>{selectedNotification.notificationdes}</Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => refRBSheet.current.close()}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </>
                )}
            </RBSheet>
        </View>
    );
};

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
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 1 },
        // shadowOpacity: 0.1,
        // shadowRadius: moderateScale(3),
        // elevation: 2,
    },
    unreadCard: {
        borderWidth: 1,
        borderColor: '#8bc83f',
        backgroundColor: '#fff',
    },
    profileImage: {
        width: scale(40),
        height: scale(40),
        borderRadius: moderateScale(20),
        marginRight: scale(12),
        marginBottom: verticalScale(8),
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
    closeButton: {
        backgroundColor: '#234F68',
        paddingVertical: verticalScale(10),
        borderRadius: moderateScale(12),
        alignItems: 'center',
        marginTop: verticalScale(16),
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