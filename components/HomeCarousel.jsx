import { StyleSheet, Image, View,Dimensions } from 'react-native'
import React from 'react'
import ReanimatedCarousel from 'react-native-reanimated-carousel';
import images from '@/constants/images';

// Dummy data for banner carousel
const BANNERS = [
    { id: '1', image: images.banner },
    { id: '2', image: images.banner },
    { id: '3', image: images.banner },
];

const HomeCarousel = () => {
    const screenWidth = Dimensions.get('window').width;

    const renderBannerItem = ({ item }) => (
        <View style={styles.bannerContainer}>
            <Image
                source={item.image}
                style={styles.bannerImage}
                resizeMode="cover"
            />
        </View>
    );
    return (
        <View>
            <ReanimatedCarousel
                width={screenWidth - 30}
                height={200}
                data={BANNERS}
                renderItem={renderBannerItem}
                autoPlay
                autoPlayInterval={3000}
                loop
                mode="parallax"
                modeConfig={{
                    parallaxScrollingScale: 0.9,
                    parallaxScrollingOffset: 50,
                    parallaxAdjacentItemScale: 0.75,
                }}
                style={styles.carousel}
            />
        </View>
    )
}

export default HomeCarousel

const styles = StyleSheet.create({
    carousel: {
        borderRadius: 10,
        marginBottom: 5,
    },
    bannerContainer: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
    },
})