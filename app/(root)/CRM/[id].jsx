import { StyleSheet, Text, View, useWindowDimensions, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import icons from '@/constants/icons';
import images from '@/constants/images';
import QualifiedLead from './followupstatus/qualifiedlead';
import NewLead from './followupstatus/newlead';
import NotResponded from './followupstatus/notresponded';
import Won from './followupstatus/won';
import Final from './followupstatus/final';

// Define the routes array
const routes = [
    { key: 'NewLead', title: 'New' },
    { key: 'QualifiedLead', title: 'Qualified' },
    { key: 'NotResponded', title: 'Not Responded' },
    { key: 'Won', title: 'Won' },
    { key: 'Final', title: 'Final' },
];

const LeadsScreen = () => {
    const { t, i18n } = useTranslation();
    const { id } = useLocalSearchParams();
    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    useEffect(() => {
        fetchEnquiry();
    }, []);

    const fetchEnquiry = async () => {
        setLoading(true);
        setError(null);
        try {
            const userDataJson = await AsyncStorage.getItem('userData');
            const parsedUserData = JSON.parse(userDataJson);
            if (!parsedUserData?.id) {
                console.error('User data or ID missing');
                setError(t('userDataMissing'));
                return;
            }
            const token = await AsyncStorage.getItem('userToken');
            if (!token) {
                console.error('User token missing');
                setError(t('tokenMissing'));
                Alert.alert(t('error'), t('tokenMissing'), [
                    { text: t('ok'), onPress: () => router.push('/login') },
                ]);
                return;
            }

            console.log('lead id', id);
            const response = await axios.get(`https://landsquire.in/api/fetchenquiry/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'User-Agent': 'LandSquireApp/1.0 (React Native)',
                },
            });
            // console.log('response:', response.data.lead);

            if (response.data?.success && response.data.lead) {
                const enquiry = response.data.lead;

                let bids = [];
                if (typeof enquiry.propertybid === "string" && enquiry.propertybid.trim().startsWith("[")) {
                    try {
                        bids = JSON.parse(enquiry.propertybid).filter(b => b.bidamount === null);
                    } catch (e) {
                        console.error("Failed to parse propertybid JSON:", e);
                    }
                } else if (enquiry.propertybid === null) {
                    bids = [{ bidamount: null, date: enquiry.created_at }];
                }

                let followupDetails = [];
                if (typeof enquiry.followupdetails === "string" && enquiry.followupdetails.trim().startsWith("[")) {
                    try {
                        followupDetails = JSON.parse(enquiry.followupdetails);
                    } catch (e) {
                        console.error("Failed to parse followupdetails JSON:", e);
                    }
                }

                // Final parsed single enquiry
                const parsedEnquiry = { ...enquiry, propertybid: bids, followupdetails: followupDetails };

                setEnquiries([parsedEnquiry]);

                // Set initial tab based on status
                const status = parsedEnquiry.status?.toLowerCase() || 'new';
                const statusMap = {
                    'new': 0,
                    'qualified': 1,
                    'not responded': 2,
                    'won': 3,
                    'final': 4,
                };
                setIndex(statusMap[status] ?? 0);
            } else {
                console.error("Unexpected API response format:", response.data);
                setError(response.data?.message || t('unexpectedResponse'));
            }
        } catch (error) {
            console.error('Error fetching enquiries:', error);
            let errorMessage = t('serverError');
            if (error.response) {
                if (error.response.status === 401) {
                    errorMessage = t('unauthorized');
                    Alert.alert(t('error'), t('unauthorized'), [
                        { text: t('ok'), onPress: () => router.push('/login') },
                    ]);
                } else if (error.response.status === 404) {
                    errorMessage = t('leadNotFound');
                } else {
                    errorMessage = error.response.data?.message || t('serverError');
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Define dynamic routes with filtered enquiries based on status
    const NewLeadRoute = () => <NewLead enquiries={enquiries.filter(e => e.status?.toLowerCase() === 'new')} />;
    const QualifiedLeadRoute = () => <QualifiedLead enquiries={enquiries.filter(e => e.status?.toLowerCase() === 'qualified')} />;
    const NotRespondedRoute = () => <NotResponded enquiries={enquiries.filter(e => e.status?.toLowerCase() === 'not responded')} />;
    const WonRoute = () => <Won enquiries={enquiries.filter(e => e.status?.toLowerCase() === 'won')} />;
    const FinalRoute = () => <Final enquiries={enquiries.filter(e => e.status?.toLowerCase() === 'final')} />;

    // Define the SceneMap with the dynamic routes
    const renderScene = SceneMap({
        NewLead: NewLeadRoute,
        QualifiedLead: QualifiedLeadRoute,
        NotResponded: NotRespondedRoute,
        Won: WonRoute,
        Final: FinalRoute,
    });

    // Custom renderTabBar to make tabs scrollable with professional styling
    const CustomTabBar = (props) => {
        const tabWidth = moderateScale(120);

        return (
            <TabBar
                {...props}
                scrollEnabled={true}
                style={styles.tabBar}
                tabStyle={{ width: tabWidth, paddingHorizontal: scale(8) }}
                renderTabBarItem={({ route, index: tabIndex, focused, onPress }) => (
                    <TouchableOpacity
                        key={route.key}
                        style={[
                            styles.tabItem,
                            { width: tabWidth },
                            focused ? styles.tabItemActive : styles.tabItemInactive,
                        ]}
                        onPress={onPress}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                focused ? styles.tabTextActive : styles.tabTextInactive,
                                i18n.language === 'hi'
                                    ? { fontFamily: 'NotoSerifDevanagari-Medium' }
                                    : { fontFamily: 'Rubik-Medium' },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {route.title}
                        </Text>
                        {focused && <View style={styles.tabIndicator} />}
                    </TouchableOpacity>
                )}
                indicatorStyle={{ backgroundColor: 'transparent' }}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Image source={icons.backArrow} style={styles.backIcon} />
                </TouchableOpacity>
                <Text
                    style={[
                        styles.headerTitle,
                        i18n.language === 'hi'
                            ? { fontFamily: 'NotoSerifDevanagari-Bold' }
                            : { fontFamily: 'Rubik-Bold' },
                    ]}
                >
                    {t('crm')}
                </Text>
                <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notificationButton}>
                    <Image source={icons.bell} style={styles.bellIcon} />
                </TouchableOpacity>
            </View>

            {/* Lead Info Card */}
            <View style={styles.cardContainer}>
                {error ? (
                    <View style={styles.errorCard}>
                        <Text
                            style={[
                                styles.errorText,
                                i18n.language === 'hi'
                                    ? { fontFamily: 'NotoSerifDevanagari-Medium' }
                                    : { fontFamily: 'Rubik-Medium' },
                            ]}
                        >
                            {error}
                        </Text>
                    </View>
                ) : loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#8bc83f" />
                        <Text
                            style={[
                                styles.loadingText,
                                i18n.language === 'hi'
                                    ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                    : { fontFamily: 'Rubik-Regular' },
                            ]}
                        >
                            {t('loading')}
                        </Text>
                    </View>
                ) : enquiries.length > 0 ? (
                    <View style={styles.leadCard}>
                        <View style={styles.leadHeader}>
                            <Image
                                source={images.placeholder}
                                style={styles.leadImage}
                            />
                            <View style={styles.leadInfo}>
                                <Text
                                    style={[
                                        styles.leadTitle,
                                        i18n.language === 'hi'
                                            ? { fontFamily: 'NotoSerifDevanagari-Bold' }
                                            : { fontFamily: 'Rubik-Bold' },
                                    ]}
                                >
                                    {t('leadId')}: {enquiries[0].id}
                                </Text>
                                <Text
                                    style={[
                                        styles.leadText,
                                        i18n.language === 'hi'
                                            ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                            : { fontFamily: 'Rubik-Regular' },
                                    ]}
                                >
                                    {t('name')}: {enquiries[0].name || 'N/A'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.leadDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{t('propertyFor')}:</Text>
                                <Text
                                    style={[
                                        styles.detailValue,
                                        i18n.language === 'hi'
                                            ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                            : { fontFamily: 'Rubik-Regular' },
                                    ]}
                                >
                                    {enquiries[0].housecategory || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{t('status')}:</Text>
                                <Text
                                    style={[
                                        styles.detailValue,
                                        i18n.language === 'hi'
                                            ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                            : { fontFamily: 'Rubik-Regular' },
                                    ]}
                                >
                                    {enquiries[0].status || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{t('createdAt')}:</Text>
                                <Text
                                    style={[
                                        styles.detailValue,
                                        i18n.language === 'hi'
                                            ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                            : { fontFamily: 'Rubik-Regular' },
                                    ]}
                                >
                                    {enquiries[0].created_at ? new Date(enquiries[0].created_at).toLocaleDateString() : 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{t('mobile')}:</Text>
                                <Text
                                    style={[
                                        styles.detailValue,
                                        i18n.language === 'hi'
                                            ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                            : { fontFamily: 'Rubik-Regular' },
                                    ]}
                                >
                                    {enquiries[0].mobilenumber || 'N/A'}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>{t('email')}:</Text>
                                <Text
                                    style={[
                                        styles.detailValue,
                                        i18n.language === 'hi'
                                            ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                            : { fontFamily: 'Rubik-Regular' },
                                    ]}
                                >
                                    {enquiries[0].email || 'N/A'}
                                </Text>
                            </View>
                        </View>
                    </View>
                ) : (
                    <View style={styles.errorCard}>
                        <Text
                            style={[
                                styles.errorText,
                                i18n.language === 'hi'
                                    ? { fontFamily: 'NotoSerifDevanagari-Medium' }
                                    : { fontFamily: 'Rubik-Medium' },
                            ]}
                        >
                            {t('noLeadData')}
                        </Text>
                    </View>
                )}
            </View>

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={(props) => <CustomTabBar {...props} />}
                sceneContainerStyle={styles.tabView}
                animationEnabled={true}
                swipeEnabled={true}
            />
        </View>
    );
};

export default LeadsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(12),
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    backButton: {
        backgroundColor: '#e6e8eb',
        borderRadius: moderateScale(12),
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        width: moderateScale(20),
        height: moderateScale(20),
        tintColor: '#234F68',
    },
    headerTitle: {
        fontSize: moderateScale(20),
        color: '#234F68',
        fontWeight: '700',
    },
    notificationButton: {
        padding: moderateScale(8),
    },
    bellIcon: {
        width: moderateScale(24),
        height: moderateScale(24),
        tintColor: '#234F68',
    },
    cardContainer: {
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(12),
    },
    leadCard: {
        backgroundColor: '#ffffff',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    leadHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: verticalScale(12),
    },
    leadImage: {
        width: moderateScale(50),
        height: moderateScale(50),
        borderRadius: moderateScale(25),
        borderWidth: 1.5,
        borderColor: '#8bc83f',
    },
    leadInfo: {
        flex: 1,
        marginLeft: scale(12),
    },
    leadTitle: {
        fontSize: moderateScale(18),
        color: '#234F68',
        fontWeight: '700',
        marginBottom: verticalScale(4),
    },
    leadText: {
        fontSize: moderateScale(14),
        color: '#333',
    },
    leadDetails: {
        borderTopWidth: 1,
        borderTopColor: '#e6e8eb',
        paddingTop: verticalScale(12),
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: verticalScale(8),
    },
    detailLabel: {
        fontSize: moderateScale(14),
        color: '#666',
        fontFamily: 'Rubik-Regular',
        flex: 1,
    },
    detailValue: {
        fontSize: moderateScale(14),
        color: '#333',
        flex: 2,
        textAlign: 'right',
    },
    errorCard: {
        backgroundColor: '#ffffff',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    errorText: {
        fontSize: moderateScale(16),
        color: '#e63946',
        textAlign: 'center',
    },
    loadingContainer: {
        backgroundColor: '#ffffff',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    loadingText: {
        fontSize: moderateScale(16),
        color: '#333',
        marginTop: verticalScale(8),
    },
    tabBar: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        paddingVertical: verticalScale(4),
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: verticalScale(8),
        marginHorizontal: scale(4),
        borderRadius: moderateScale(12),
    },
    tabItemActive: {
        backgroundColor: '#234F68',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    tabItemInactive: {
        backgroundColor: '#e6e8eb',
    },
    tabText: {
        fontSize: moderateScale(14),
        fontWeight: '600',
        textAlign: 'center',
    },
    tabTextActive: {
        color: '#ffffff',
    },
    tabTextInactive: {
        color: '#666',
    },
    tabIndicator: {
        height: verticalScale(3),
        backgroundColor: '#ffffff',
        width: '50%',
        borderRadius: moderateScale(2),
        marginTop: verticalScale(4),
    },
    tabView: {
        backgroundColor: '#f5f6f5',
    },
});