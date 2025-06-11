import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import icons from '@/constants/icons';
import Search from '@/components/Search';
import Filters from '@/components/Filters';
import { Card } from '@/components/Cards';

const Explore = () => {
  const [listingData, setListingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams(); // Get URL parameters

  const handleCardPress = (id) => router.push(`/properties/${id}`);


  const fetchFilterData = async () => {
    setLoading(true);
    setListingData([]);

    console.log("params:", params);
    try {
      // Construct query parameters dynamically
      const queryParams = new URLSearchParams();
      // Only append propertyType if it's NOT "All"
      if (params.propertyType && params.propertyType !== "All") {
        queryParams.append("filtercategory", params.propertyType);
      }
      if (params.city) queryParams.append("filtercity", params.city);
      if (params.minPrice) queryParams.append("filterminprice", params.minPrice);
      if (params.maxPrice) queryParams.append("filtermaxprice", params.maxPrice);
      if (params.sqftfrom) queryParams.append("sqftfrom", params.sqftfrom);
      if (params.sqftto) queryParams.append("sqftto", params.sqftto);

      const apiUrl = `https://investorlands.com/api/filterlistings?${queryParams.toString()}`;

      console.log("Sending API request to:", apiUrl);

      const response = await axios({
        method: "post",
        url: apiUrl,
      });

      if (response.data && Array.isArray(response.data.data)) {
        setListingData(response.data.data);
        // console.log("listingData", response.data.data);
      } else {
        console.error("Unexpected API response format:", response.data);
        setListingData([]);
      }
    } catch (error) {
      console.error("Error fetching filtered listings:", error.response?.data || error.message);
      setListingData([]);
    } finally {
      setLoading(false);
    }
  };




  useEffect(() => {
    fetchFilterData();
  }, []);



  return (
    <SafeAreaView className='bg-white h-full'>
      <FlatList
        data={listingData}
        renderItem={({ item }) => <Card item={item} onPress={() => handleCardPress(item.id)} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerClassName="pb-32"
        columnWrapperClassName='flex gap-5 px-5'
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className='px-5'>
            <View className='flex flex-row items-center ml-2 justify-between'>
              <TouchableOpacity onPress={() => router.navigate('/')} className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center" >
                <Image source={icons.backArrow} className='size-5' />
              </TouchableOpacity>
              <Text className='text-base mr-2 text-center font-rubik-medium text-black-300'>
                Search for Your Ideal Home
              </Text>
              <TouchableOpacity onPress={() => router.push('/notifications')}>
                <Image source={icons.bell} className='size-6' />
              </TouchableOpacity>
            </View>

            <Search />
            <Filters />

            <View className='my-5'>
              <Text className='text-xl font-rubik-bold text-black-300'>
                {listingData.length > 0 ? `${listingData.length} properties found` : 'No properties found'}
              </Text>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Explore;
