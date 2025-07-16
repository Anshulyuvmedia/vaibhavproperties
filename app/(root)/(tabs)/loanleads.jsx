import { StyleSheet, ScrollView, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import RBSheet from 'react-native-raw-bottom-sheet';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import icons from '@/constants/icons';
import { useUser } from '@/context/UserContext'; // Import UserContext
import { useTranslation } from 'react-i18next';

const Loanleads = () => {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const { userType, loading: userLoading } = useUser(); // Use UserContext
    const [enquiries, setEnquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const rbSheetRef = useRef();

    useEffect(() => {
        if (!userLoading && userType !== 'bankagent') {
            router.replace('/mapview'); // Redirect if not bankagent
            console.log(`Redirected from loanleads to /mapview at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} because userType is ${userType}`);
        } else if (!userLoading) {
            fetchUserEnquiries();
        }
    }, [userType, userLoading, router]);

    const fetchUserEnquiries = async () => {
        setLoading(true);
        try {
            const parsedPropertyData = JSON.parse(await AsyncStorage.getItem('userData'));
            if (!parsedPropertyData?.id) {
                console.error('User data or ID missing at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
                return;
            }
            const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/fetchenquiries?id=${parsedPropertyData.id}`);
            console.log('response at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);

            if (response.data && Array.isArray(response.data.loanenquiries)) { // Target loanenquiries
                const parsedEnquiries = response.data.loanenquiries.map(enquiry => {
                    let parsedBids = [];
                    if (enquiry.propertybid === null) {
                        parsedBids = [{ bidamount: Number(enquiry.loan_amount) || 0, date: enquiry.created_at }];
                    } else if (typeof enquiry.propertybid === 'string') {
                        if (enquiry.propertybid.startsWith('[')) {
                            parsedBids = JSON.parse(enquiry.propertybid);
                        } else {
                            parsedBids = [{ bidamount: Number(enquiry.propertybid) || 0, date: enquiry.created_at }];
                        }
                    }
                    return {
                        ...enquiry,
                        loan_amount: Number(enquiry.loan_amount) || 0,
                        propertybid: parsedBids,
                    };
                });
                setEnquiries(parsedEnquiries);
            } else {
                console.error('No loanenquiries found or invalid response format at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', response.data);
                setEnquiries([]);
            }
        } catch (error) {
            console.error('Error fetching enquiries at', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }), ':', error);
            setEnquiries([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserEnquiries();
    };

    const openDetails = (enquiry) => {
        setSelectedEnquiry(enquiry);
        rbSheetRef.current.open();
    };

    const formatCurrency = (amount) => {
        if (!amount || isNaN(amount)) return t('notAvailable');
        const num = Number(amount);

        if (num >= 10000000) {
            const crore = num / 10000000;
            return `${crore % 1 === 0 ? crore : crore.toFixed(2).replace(/\.00$/, '')} Cr.`;
        } else if (num >= 100000) {
            const lakh = num / 100000;
            return `${lakh % 1 === 0 ? lakh : lakh.toFixed(2).replace(/\.00$/, '')} Lakh`;
        } else if (num >= 1000) {
            const thousand = num / 1000;
            return `${thousand % 1 === 0 ? thousand : thousand.toFixed(2).replace(/\.00$/, '')} Thousand`;
        } else {
            return num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
        }
    };

    const getLatestBid = (bids) => {
        if (Array.isArray(bids) && bids.length > 0) {
            return bids.reduce((latest, current) =>
                new Date(current.date) > new Date(latest.date) ? current : latest
            );
        }
        return { bidamount: t('notAvailable'), date: '' };
    };

    const handleCall = (number) => {
        if (number) {
            Linking.openURL(`tel:${number}`).catch(err => console.error('Error opening phone app:', err));
        }
    };

    const renderEnquiry = ({ item }) => {
        const latestBid = getLatestBid(item.propertybid);
        return (
            <TouchableOpacity style={styles.card} onPress={() => openDetails(item)}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text className='text-sm font-rubik text-gray-600'>Name:</Text>
                        <Text style={[styles.cardTitle, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Bold' : 'Rubik-Bold' }]}>
                            {item.name}
                        </Text>
                    </View>
                    <View>
                        <Text className='text-sm font-rubik text-gray-600'>Date:</Text>
                        <Text style={[styles.cardDate, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                            {new Date(latestBid.date || item.created_at).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                <View style={styles.cardrow}>
                    <View>
                        <Text className='text-sm font-rubik text-gray-600'>Bid amount:</Text>
                        <Text style={[styles.cardText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                            {formatCurrency(latestBid.bidamount)}
                        </Text>
                    </View>
                    <View>
                        <Text className='text-sm font-rubik text-gray-600'>Category:</Text>
                        <Text style={[styles.cardText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                            {item.housecategory || t('notAvailable')}
                        </Text>
                    </View>
                    <View>
                        <Text className='text-sm font-rubik text-gray-600'>City:</Text>
                        <Text style={[styles.cardText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                            {item.inwhichcity || item.city || t('notAvailable')}
                        </Text>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    {item.propertyid && (
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push(`/properties/${item.propertyid}`)}
                        >
                            <Text style={[styles.actionButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                {t('viewProperty')}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {item.agentid && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.agentButton]}
                            onPress={() => router.push(`/broker/${item.agentid}`)}
                        >
                            <Text style={[styles.actionButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                {t('viewBroker')}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {item.mobilenumber && (
                        <TouchableOpacity
                            style={[styles.actionButton, styles.callButton]}
                            onPress={() => handleCall(item.mobilenumber)}
                        >
                            <Text style={[styles.actionButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                {t('call')}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    const renderBidHistory = (bids) => {
        if (!Array.isArray(bids) || bids.length === 0) return null;
        return bids.map((bid, index) => (
            <View key={index} style={styles.bidHistoryRow}>
                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                    {t('bid', { index: index + 1 })}:
                </Text>
                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                    {formatCurrency(bid.bidamount)} on {new Date(bid.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
            </View>
        ));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Image source={icons.backArrow} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={[styles.title, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Bold' : 'Rubik-Bold' }]}>
                    {t('Loan Enquiries')}
                </Text>
                <TouchableOpacity onPress={() => router.push('/notifications')}>
                    <Image source={icons.bell} style={styles.bellIcon} />
                </TouchableOpacity>
            </View>

            <View className='mx-auto'>
                <Text>All the loan enquiries.</Text>
            </View>

            {loading || userLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#234F68" />
                </View>
            ) : enquiries.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.emptyText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                        {t('noEnquiries')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={enquiries}
                    renderItem={renderEnquiry}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.flatListContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#234F68']}
                        />
                    }
                />
            )}

            <RBSheet
                ref={rbSheetRef}
                height={verticalScale(600)}
                openDuration={250}
                customStyles={{
                    container: styles.rbSheet,
                }}
            >
                {selectedEnquiry && (
                    <View style={styles.sheetContainer}>
                        <View style={styles.sheetHeader}>
                            <Text style={[styles.sheetTitle, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Bold' : 'Rubik-Bold' }]}>
                                {t('enquiryDetails')}
                            </Text>
                            <TouchableOpacity
                                style={styles.sheetCloseButton}
                                onPress={() => rbSheetRef.current.close()}
                            >
                                <Text style={[styles.sheetCloseButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    X
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.sheetContent}>
                            <View style={styles.sheetRow}>
                                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('name')}:
                                </Text>
                                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {selectedEnquiry.name}
                                </Text>
                            </View>
                            <View style={styles.sheetRow}>
                                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('mobile')}:
                                </Text>
                                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {selectedEnquiry.mobilenumber}
                                </Text>
                            </View>
                            <View style={styles.sheetRow}>
                                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('email')}:
                                </Text>
                                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {selectedEnquiry.email}
                                </Text>
                            </View>
                            <View style={styles.sheetRow}>
                                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('city')}:
                                </Text>
                                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {selectedEnquiry.city}
                                </Text>
                            </View>
                            <View style={styles.sheetRow}>
                                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('state')}:
                                </Text>
                                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {selectedEnquiry.state}
                                </Text>
                            </View>
                            <View style={styles.sheetRow}>
                                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('propertyType')}:
                                </Text>
                                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {selectedEnquiry.housecategory || t('notAvailable')}
                                </Text>
                            </View>
                            <View style={styles.sheetRow}>
                                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('clientsCity')}:
                                </Text>
                                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {selectedEnquiry.inwhichcity || t('notAvailable')}
                                </Text>
                            </View>
                            <View style={styles.sheetRow}>
                                <Text style={[styles.sheetLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('status')}:
                                </Text>
                                <Text style={[styles.sheetValue, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                                    {selectedEnquiry.status}
                                </Text>
                            </View>
                            {renderBidHistory(selectedEnquiry.propertybid)}
                        </ScrollView>
                        <View style={styles.sheetButtonContainer}>
                            {selectedEnquiry.agentid && (
                                <TouchableOpacity
                                    style={[styles.sheetActionButton, styles.agentButton]}
                                    onPress={() => {
                                        rbSheetRef.current.close();
                                        router.push(`/broker/${selectedEnquiry.agentid}`);
                                    }}
                                >
                                    <Text style={[styles.sheetActionButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                        {t('viewBroker')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {selectedEnquiry.mobilenumber && (
                                <TouchableOpacity
                                    style={[styles.sheetActionButton, styles.callButton]}
                                    onPress={() => handleCall(selectedEnquiry.mobilenumber)}
                                >
                                    <Text style={[styles.sheetActionButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                        {t('call')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {selectedEnquiry.propertyid && (
                                <TouchableOpacity
                                    style={styles.sheetActionButton}
                                    onPress={() => {
                                        rbSheetRef.current.close();
                                        router.push(`/properties/${selectedEnquiry.propertyid}`);
                                    }}
                                >
                                    <Text style={[styles.sheetActionButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                        {t('viewProperty')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                style={styles.sheetActionButton}
                                onPress={() => rbSheetRef.current.close()}
                            >
                                <Text style={[styles.sheetActionButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                                    {t('close')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </RBSheet>
        </View>
    );
};

export default Loanleads;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        paddingHorizontal: scale(10),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: verticalScale(5),
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
    bellIcon: {
        width: moderateScale(24),
        height: moderateScale(24),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: verticalScale(50),
    },
    emptyText: {
        fontSize: moderateScale(16),
        color: '#666',
        fontFamily: 'Rubik-Regular',
    },
    flatListContent: {
        paddingBottom: verticalScale(80),
        paddingInline: verticalScale(7),
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: moderateScale(10),
        padding: moderateScale(15),
        marginVertical: verticalScale(8),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(8),
    },
    cardrow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: moderateScale(16),
        fontFamily: 'Rubik-Bold',
        color: '#234F68',
    },
    statusBadge: {
        paddingHorizontal: moderateScale(10),
        paddingVertical: verticalScale(5),
        borderRadius: moderateScale(12),
    },
    statusText: {
        fontSize: moderateScale(12),
        fontFamily: 'Rubik-Medium',
    },
    cardText: {
        fontSize: moderateScale(14),
        color: '#000',
        fontWeight: 'bold',
        marginVertical: verticalScale(3),
    },
    cardDate: {
        fontSize: moderateScale(12),
        color: '#000',
        fontWeight: 'bold',
        marginTop: verticalScale(5),
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: verticalScale(10),
        gap: scale(10),
    },
    actionButton: {
        backgroundColor: '#234F68',
        borderRadius: moderateScale(8),
        paddingVertical: verticalScale(5),
        paddingHorizontal: scale(12),
    },
    callButton: {
        backgroundColor: '#4CAF50', // Green for call button
    },
    agentButton: {
        backgroundColor: '#4CAF50',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: moderateScale(14),
        fontFamily: 'Rubik-Medium',
    },
    rbSheet: {
        flex: 1,
        borderTopLeftRadius: moderateScale(20),
        borderTopRightRadius: moderateScale(20),
        padding: moderateScale(20),
        backgroundColor: '#fff',
    },
    sheetContainer: {
        flex: 1,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(10),
    },
    sheetTitle: {
        fontSize: moderateScale(18),
        fontFamily: 'Rubik-Bold',
        color: '#234F68',
    },
    sheetCloseButton: {
        backgroundColor: '#f4f2f7',
        borderRadius: moderateScale(20),
        width: moderateScale(30),
        height: moderateScale(30),
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetCloseButtonText: {
        fontSize: moderateScale(16),
        fontFamily: 'Rubik-Medium',
        color: '#234F68',
    },
    sheetContent: {
        flexGrow: 1,
        paddingBottom: verticalScale(20),
    },
    sheetRow: {
        flexDirection: 'row',
        marginVertical: verticalScale(5),
    },
    bidHistoryRow: {
        flexDirection: 'row',
        marginVertical: verticalScale(5),
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: verticalScale(5),
    },
    sheetLabel: {
        fontSize: moderateScale(14),
        fontFamily: 'Rubik-Medium',
        color: '#234F68',
        width: scale(120),
    },
    sheetValue: {
        fontSize: moderateScale(14),
        fontFamily: 'Rubik-Regular',
        color: '#666',
        flex: 1,
    },
    sheetButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: verticalScale(10),
        gap: scale(10),
    },
    sheetActionButton: {
        backgroundColor: '#234F68',
        borderRadius: moderateScale(8),
        paddingVertical: verticalScale(8),
        paddingHorizontal: scale(12),
        alignItems: 'center',
    },
    sheetCallButton: {
        backgroundColor: '#4CAF50', // Green for call button
    },
    sheetActionButtonText: {
        color: '#fff',
        fontSize: moderateScale(14),
        fontFamily: 'Rubik-Medium',
    },
});