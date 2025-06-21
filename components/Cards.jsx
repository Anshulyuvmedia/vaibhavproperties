import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React from 'react'
import images from '@/constants/images'
import icons from '@/constants/icons'
import Ionicons from "@expo/vector-icons/Ionicons";


const FeaturedCard = ({ item, onPress, map }) => {
  return (
    <View className=''>
      <TouchableOpacity onPress={onPress} className='flex flex-col items-start w-60 h-80 relative'>
        <Image source={{ uri: `https://investorlands.com/assets/images/Listings/${item.thumbnail}` }} className='size-full rounded-2xl' />
        <Image source={images.cardGradient} className='size-full rounded-2xl absolute bottom-0' />

        {/* <View className='flex flex-row items-center bg-white/90 px-3 py-1.5 rounded-full absolute top-5 right-5'>
          <Image source={icons.star} className='size-3.5' />
          <Text className='text-xs font-rubik-bold text-yellow-800 ml-1'>4.4</Text>
        </View> */}

        <View className='flex flex-col items-start absolute bottom-5 inset-x-5'>
          <Text className='text-xl font-rubik-extrabold text-white' numberofLines={1}>{item.property_name}</Text>
          <Text className='text-base font-rubik text-white' numberOfLines={1}>{item.city}, {item.address}</Text>
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
  // Helper to format price in Indian Rupees with lakh/cr notation
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
    <TouchableOpacity onPress={onPress} className='flex-1/2 w-[180px] mt-4 p-3 rounded-[25px] bg-primary-100 relative'>
      {/* Heart Icon with blurred background */}
      <View className='flex flex-row items-center absolute p-2 top-5 right-5 bg-white/90 rounded-full z-50'>
        <TouchableOpacity>
          {/* <Image source={icons.star} className='size-3.5' />
        <Text className='text-xs font-rubik-bold text-yellow-800 ml-0.5'>4.4</Text> */}
          <Image source={icons.heart} className='w-5 h-5' tintColor="#191d31" />
        </TouchableOpacity>
      </View>
      {/* Price with blurred background */}
      <View className='flex flex-row items-center absolute p-2  right-5 rounded-lg z-50' style={{ backgroundColor: 'rgba(35,79,104,0.9)', backdropFilter: 'blur(8px)', top: '110', }}>
        <Text className="text-sm font-rubik text-white mt-1">
          {formatINR(item.price || 290)}
        </Text>
      </View>

      <Image source={{ uri: `https://investorlands.com/assets/images/Listings/${item.thumbnail}` }} className='w-full h-40 rounded-[15px]' />

      <View className='flex flex-col mt-3'>
        <Text className='text-base font-rubik-bold text-black-300'>{item.property_name}</Text>
        <View className='flex flex-row items-center justify-between '>
          <Text className='text-base font-rubik text-primary-300'>{item.category}</Text>
        </View>
        <View className='flex-row items-end mt-2'>
          <Ionicons name="location-outline" size={18} color="#234F68" style={styles.icon} />
          <Text className='text-sm font-rubik text-black'>{item.city}, {item.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

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
      className="w-[320px] h-[160px] rounded-[30px] bg-[#f5f4f8] flex-row overflow-hidden"
    >
      {/* Image Section */}
      <View className="w-[150px] h-full relative p-2">
        <Image
          source={{ uri: `https://investorlands.com/assets/images/Listings/${item.thumbnail}` }}
          className="w-full h-full rounded-[30px]"
          style={{ resizeMode: 'cover' }}
        />
        {/* Heart Icon */}
        <View className="absolute top-4 left-4 bg-[#8bc83f] rounded-full p-2">
          <Ionicons name="heart-outline" size={20} color="white" />
        </View>
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
          {item.property_name}
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
            {item.city}, {item.address}
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
  icon: {
    marginRight: 3,
  },
})