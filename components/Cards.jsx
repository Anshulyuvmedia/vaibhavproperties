import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native'
import React from 'react'
import images from '@/constants/images'
import icons from '@/constants/icons'
import Ionicons from "@expo/vector-icons/Ionicons";
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

// Get screen width for dynamic card sizing
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 2;
const PADDING_HORIZONTAL = scale(10);
const GAP = scale(5);
const CARD_WIDTH = (SCREEN_WIDTH - 3 * PADDING_HORIZONTAL - (NUM_COLUMNS - 1) * GAP) / NUM_COLUMNS;

const FeaturedCard = ({ item, onPress, map }) => {
  return (
    <View className=''>
      <TouchableOpacity onPress={onPress} className='flex flex-col items-start w-60 h-80 relative'>
        <Image source={{ uri: `https://landsquire.in/adminAssets/images/Listings/${item.thumbnail}` }} className='size-full rounded-2xl' />
        <Image source={images.cardGradient} className='size-full rounded-2xl absolute bottom-0' />

        {/* <View className='flex flex-row items-center bg-white/90 px-3 py-1.5 rounded-full absolute top-5 right-5'>
          <Image source={icons.star} className='size-3.5' />
          <Text className='text-xs font-rubik-bold text-yellow-800 ml-1'>4.4</Text>
        </View> */}

        <View className='flex flex-col items-start absolute bottom-5 inset-x-5'>
          <Text className='text-xl font-rubik-extrabold text-white' numberofLines={1}>{item.property_name}</Text>
          <Text className='text-base font-rubik text-white' numberOfLines={1}>{item.city}</Text>
          <View className='flex flex-row items-center justify-between w-full'>
            <Text className='text-xl font-rubik-extrabold text-white'>{item.category}</Text>
            {/* <Image source={icons.heart} className='size-5' /> */}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  )
}

export { FeaturedCard };

const Card = ({ item, onPress }) => {
  const formatINR = (amount) => {
    if (!amount) return '₹0';
    const num = Number(amount);
    if (num >= 1e7) {
      return '₹' + (num / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
    } else if (num >= 1e5) {
      return '₹' + (num / 1e5).toFixed(1) + ' Lakh'; // Adjusted to 1 decimal
    }
    return '₹' + num.toLocaleString('en-IN');
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
      {/* Heart Icon */}
      {/* <View style={styles.heartContainer}>
        <TouchableOpacity>
          <Image
            source={require('../assets/icons/heart.png')} // Update path
            style={styles.heartIcon}
          />
        </TouchableOpacity>
      </View> */}

      {/* Category Badge */}
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>

      {/* Thumbnail Image */}
      <Image
        source={{ uri: `https://landsquire.in/adminAssets/images/Listings/${item.thumbnail}` }}
        style={styles.thumbnail}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.propertyName} numberOfLines={1}>
          {item.property_name}
        </Text>
        <Text style={styles.priceText}>{formatINR(item.price || 290)}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={moderateScale(16)} color="#234F68" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.city}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};


export { Card };

const HorizontalCard = ({ item, onPress, onView, map }) => {
  // Helper to format price in Indian Rupees
  const formatINR = (amount) => {
    if (!amount) return '₹0';
    const num = Number(amount);
    if (num >= 1e7) {
      return '₹' + (num / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
    } else if (num >= 1e5) {
      return '₹' + (num / 1e5).toFixed(2).replace(/\.00$/, '') + ' Lakh';
    }
    return '₹' + num.toLocaleString('en-IN');
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="w-[320px] h-[130px] rounded-[30px] bg-[#f5f4f8] flex-row overflow-hidden"
    >
      {/* Image Section */}
      <View className="w-[150px] h-full relative p-2">
        <Image
          source={{ uri: `https://landsquire.in/adminAssets/images/Listings/${item.thumbnail}` }}
          className="w-full h-full rounded-[30px]"
          style={{ resizeMode: 'cover' }}
        />
        {/* Heart Icon */}
        {/* <View className="absolute top-4 left-4 bg-[#8bc83f] rounded-full p-2">
          <Ionicons name="heart-outline" size={20} color="white" />
        </View> */}
        {/* Category Badge */}
        <View className="absolute bottom-4 left-4 rounded-xl px-4 py-1" style={{ backgroundColor: 'rgba(35,79,104,0.9)', backdropFilter: 'blur(8px)' }}>
          <Text className="text-sm font-rubik text-white">
            {item.category}
          </Text>
        </View>
      </View>
      {/* Text Content Section */}
      <View className="flex-1 p-2 justify-center items-start">
        {/* Property Name */}
        <Text className="text-lg font-rubik-medium text-black-300 ">
          {item.property_name.length > 17
            ? item.property_name.slice(0, 17) + '...'
            : item.property_name}
        </Text>

        {/* Rating */}
        {/* <View className="flex-row items-center mt-1">
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text className="text-sm font-rubik text-black ml-1">
            {item.rating || '4.9'}
          </Text>
        </View> */}

        {/* Location */}
        <View className="flex-row items-center mt-1">
          <Ionicons name="location-outline" size={16} color="#234F68" />
          <Text className="text-sm font-rubik text-black ml-1">
            {item.city}
          </Text>
        </View>

        {/* Price */}
        <Text className="text-base font-rubik text-black-300 mt-2">
          {formatINR(item.price || 290)}
        </Text>
        {map && (
          <TouchableOpacity onPress={onView} className='mt-2 py-1 px-3 bg-primary-400 rounded-full items-center'>
            <Text className='font-rubik text-white'>
              View Property
            </Text>
          </TouchableOpacity>
        )}
      </View>


    </TouchableOpacity>
  );
};
export { HorizontalCard };

const styles = StyleSheet.create({

  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: '#f5f4f8',
    borderRadius: moderateScale(20),
    padding: moderateScale(5),
    overflow: 'hidden',
    marginBottom: verticalScale(15),
    elevation: 2, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heartContainer: {
    position: 'absolute',
    top: verticalScale(10),
    right: scale(10),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 9999,
    padding: moderateScale(7),
    zIndex: 50,
  },
  heartIcon: {
    width: scale(15),
    height: scale(15),
    tintColor: '#191d31',
  },
  categoryBadge: {
    position: 'absolute',
    top: verticalScale(120),
    right: scale(10),
    backgroundColor: 'rgba(35, 79, 104, 0.9)',
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(2),
    zIndex: 50,
  },
  categoryText: {
    fontSize: moderateScale(12),
    fontFamily: 'Rubik-Regular',
    color: '#FFFFFF',
  },
  thumbnail: {
    width: '100%',
    height: verticalScale(140),
    borderRadius: moderateScale(20),
  },
  content: {
    padding: moderateScale(10),
  },
  propertyName: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    textTransform: 'capitalize',
    color: '#000000',
    marginBottom: verticalScale(5),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(5),
  },
  locationText: {
    fontSize: moderateScale(12),
    fontFamily: 'Rubik-Regular',
    color: '#000000',
    marginLeft: scale(5),
  },
  priceText: {
    fontSize: moderateScale(14),
    fontFamily: 'Rubik-Regular',
    color: '#234F68',
  },

  icon: {
    marginRight: 3,
  },
})