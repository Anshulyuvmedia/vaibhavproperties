import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React from 'react'
import images from '@/constants/images'
import icons from '@/constants/icons'


const FeaturedCard = ({ item, onPress }) => {
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
  return (
    <TouchableOpacity onPress={onPress} className='flex-1 w-full mt-4 px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative'>
      {/* <View className='flex flex-row items-center absolute px-3 top-5 right-5 bg-white/90 p-1 rounded-full z-50'>
        <Image source={icons.star} className='size-3.5' />
        <Text className='text-xs font-rubik-bold text-yellow-800 ml-0.5'>4.4</Text>
      </View> */}

      <Image source={{ uri: `https://investorlands.com/assets/images/Listings/${item.thumbnail}` }} className='w-full h-40 rounded-lg' />

      <View className='flex flex-col mt-2'>
        <Text className='text-base font-rubik-bold text-black-300'>{item.property_name}</Text>
        <Text className='text-xs font-rubik text-black-100'>{item.city}, {item.address}</Text>

        <View className='flex flex-row items-center justify-between mt-2'>
          <Text className='text-base font-rubik-bold text-yellow-800'>{item.category}</Text>
          {/* <Image source={icons.heart} className='w-5 h-5 mr-2' tintColor="#191d31" /> */}
        </View>

      </View>
    </TouchableOpacity>
  )
}

export { Card };

const styles = StyleSheet.create({})