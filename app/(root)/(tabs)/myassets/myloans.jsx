import { StyleSheet, Text, View, ScrollView, Image, Dimensions, TouchableOpacity, LogBox } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import icons from '@/constants/icons';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import PropertyNavigation from '@/components/PropertyNavigation';


const Myloans = () => {
    const router = useRouter();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Image source={icons.backArrow} style={styles.backIcon} />
                </TouchableOpacity>
                <Text style={styles.title}>My Loans</Text>
                <TouchableOpacity onPress={() => router.push('/notifications')}>
                    <Image source={icons.bell} style={styles.bellIcon} />
                </TouchableOpacity>
            </View>
            <PropertyNavigation path={'myloans'} />

        </ScrollView>
    )
}

export default Myloans

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

    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 20,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    activeButton: {
        backgroundColor: '#8bc83f',
    },
    buttonText: {
        color: '#000',
        fontFamily: 'Sora-Bold',
        fontSize: 14,
        textAlign: 'center',
    },
    activeButtonText: {
        color: '#fff',
        fontWeight: '700',
    },
});