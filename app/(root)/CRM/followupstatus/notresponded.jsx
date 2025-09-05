import { StyleSheet, Text, View, ScrollView } from 'react-native';
import React from 'react';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { useTranslation } from 'react-i18next';

const NotResponded = ({ enquiries }) => {
    const { t, i18n } = useTranslation();

    return (
        <ScrollView style={styles.container}>
            {enquiries.length > 0 ? (
                enquiries.map((enquiry, index) => (
                    <View key={index} style={styles.card}>
                        <Text
                            style={[
                                styles.title,
                                i18n.language === 'hi'
                                    ? { fontFamily: 'NotoSerifDevanagari-Medium' }
                                    : { fontFamily: 'Rubik-Medium' },
                            ]}
                        >
                            {t('followUpDetails')}
                        </Text>
                        {enquiry.followupdetails && enquiry.followupdetails.length > 0 ? (
                            enquiry.followupdetails.map((detail, idx) => (
                                <View key={idx} style={styles.detailContainer}>
                                    <Text
                                        style={[
                                            styles.date,
                                            i18n.language === 'hi'
                                                ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                                : { fontFamily: 'Rubik-Regular' },
                                        ]}
                                    >
                                        {new Date(detail.date).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.description,
                                            i18n.language === 'hi'
                                                ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                                : { fontFamily: 'Rubik-Regular' },
                                        ]}
                                    >
                                        {detail.description || 'N/A'}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text
                                style={[
                                    styles.noData,
                                    i18n.language === 'hi'
                                        ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                        : { fontFamily: 'Rubik-Regular' },
                                ]}
                            >
                                {t('noFollowUpDetails')}
                            </Text>
                        )}
                    </View>
                ))
            ) : (
                <View style={styles.card}>
                    <Text
                        style={[
                            styles.noData,
                            i18n.language === 'hi'
                                ? { fontFamily: 'NotoSerifDevanagari-Regular' }
                                : { fontFamily: 'Rubik-Regular' },
                        ]}
                    >
                        {t('noLeads')}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

export default NotResponded;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(10),
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: moderateScale(12),
        padding: moderateScale(16),
        marginBottom: verticalScale(12),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: moderateScale(18),
        color: '#234F68',
        marginBottom: verticalScale(12),
        fontWeight: '600',
    },
    detailContainer: {
        marginBottom: verticalScale(12),
        padding: moderateScale(12),
        backgroundColor: '#f4f2f7',
        borderRadius: moderateScale(8),
    },
    date: {
        fontSize: moderateScale(14),
        color: '#555',
        marginBottom: verticalScale(4),
    },
    description: {
        fontSize: moderateScale(16),
        color: '#333',
    },
    noData: {
        fontSize: moderateScale(16),
        color: '#999',
        textAlign: 'center',
    },
});