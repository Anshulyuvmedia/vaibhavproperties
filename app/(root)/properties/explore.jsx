import { StyleSheet, TouchableOpacity, View, Text, Image, FlatList, Dimensions, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import icons from '@/constants/icons';
import Search from '@/components/Search';
import Filters from '@/components/Filters';
import { Card } from '@/components/Cards';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import Ionicons from '@expo/vector-icons/Ionicons';

// Get screen width for dynamic card sizing
const PADDING_HORIZONTAL = scale(15);
const GAP = scale(10);

const Explore = () => {
  const [listingData, setListingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const params = useLocalSearchParams();

  const handleCardPress = (id) => router.push(`/properties/${id}`);

  const fetchFilterData = async () => {
    setLoading(true);
    setListingData([]);

    console.log("params:", params);
    try {
      const queryParams = new URLSearchParams();
      if (params.propertyType && params.propertyType !== "All") {
        queryParams.append("filtercategory", params.propertyType);
      }
      if (params.city) queryParams.append("filtercity", params.city);
      if (params.minPrice) queryParams.append("filterminprice", params.minPrice);
      if (params.maxPrice) queryParams.append("filtermaxprice", params.maxPrice);
      if (params.sqftfrom) queryParams.append("sqftfrom", params.sqftfrom);
      if (params.sqftto) queryParams.append("sqftto", params.sqftto);

      const apiUrl = `https://vaibhavproperties.cigmafeed.in/api/filterlistings?${queryParams.toString()}`;
      const response = await axios({
        method: "post",
        url: apiUrl,
      });

      if (response.data && Array.isArray(response.data.data)) {
        setListingData(response.data.data);
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

  const clearFilter = (filterKey) => {
    const updatedParams = { ...params };
    // Map display labels to param keys
    const keyMap = {
      city: 'city',
      type: 'propertyType',
      price: ['minPrice', 'maxPrice'], // Clear both min and max for price
      size: ['sqftfrom', 'sqftto'],   // Clear both min and max for size
    };

    if (Array.isArray(keyMap[filterKey])) {
      keyMap[filterKey].forEach((key) => delete updatedParams[key]);
    } else {
      delete updatedParams[keyMap[filterKey]];
    }

    router.replace({ pathname: "/properties/explore", params: updatedParams });
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image source={icons.noResultFound} style={styles.emptyImage} />
      <Text style={styles.emptyTitle}>
        Search <Text style={styles.emptyHighlight}>not found</Text>
      </Text>
      <Text style={styles.emptySubtitle}>
        Sorry, we can't find the real estate you're looking for.
      </Text>
      <Text style={styles.emptySubtitle}>
        Maybe a little spelling mistake?
      </Text>
    </View>
  );

  const renderFilterChips = () => {
    const filters = [];
    if (params.city) filters.push(`City: ${params.city}`);
    if (params.propertyType) filters.push(`Type: ${params.propertyType}`);
    if (params.minPrice || params.maxPrice) {
      filters.push(`Price: ${params.minPrice || 'Any'} - ${params.maxPrice || 'Any'}`);
    }
    if (params.sqftfrom || params.sqftto) {
      filters.push(`Size: ${params.sqftfrom || 'Any'} - ${params.sqftto || 'Any'} sqft`);
    }

    return filters.length > 0 ? (
      <View className='flex-row justify-between items-center'>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterChipsContainer}
        >
          {filters.map((filter, index) => (
            <View key={index} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{filter}</Text>
              <TouchableOpacity
                onPress={() => clearFilter(filter.split(":")[0].toLowerCase().trim())}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={16} color="#234F68" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {filters.length > 0 && (
          <TouchableOpacity
            onPress={() => router.replace({ pathname: "/properties/explore", params: {} })}
            style={styles.clearAllButton}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={listingData}
        renderItem={({ item }) => <Card item={item} onPress={() => handleCardPress(item.id)} />}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.flatListColumnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                onPress={() => router.navigate('/')}
                style={styles.backButton}
              >
                <Image source={icons.backArrow} style={styles.backIcon} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Search results</Text>
              <TouchableOpacity onPress={() => router.push('/notifications')}>
                <Image source={icons.bell} style={styles.bellIcon} />
              </TouchableOpacity>
            </View>
            <Search />

            {renderFilterChips()}

            <Filters />
            <View style={styles.foundTextContainer}>
              <Text style={styles.foundText}>
                Found <Text style={styles.foundHighlight}>{listingData.length}</Text> estates
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={!loading && listingData.length === 0 ? renderEmptyComponent : null}
      />
    </View>
  );
};

export default Explore;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    // padding: moderateScale(10),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  backButton: {
    backgroundColor: '#E6F0FA',
    borderRadius: 9999,
    width: scale(44),
    height: scale(44),
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: scale(20),
    height: scale(20),
  },
  headerTitle: {
    fontSize: moderateScale(20),
    fontFamily: 'Rubik-Bold',
    color: '#234F68',
    textAlign: 'center',
    flex: 1,
  },
  bellIcon: {
    width: scale(24),
    height: scale(24),
  },
  foundTextContainer: {
    marginTop: verticalScale(20),
  },
  foundText: {
    fontSize: moderateScale(20),
    fontFamily: 'Rubik-Bold',
    color: '#4B5563',
  },
  foundHighlight: {
    color: '#234F68',
  },
  flatListContent: {
    paddingBottom: verticalScale(32),
    paddingHorizontal: PADDING_HORIZONTAL,
  },
  flatListColumnWrapper: {
    flexDirection: 'row',
    gap: GAP,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(80),
  },
  emptyImage: {
    width: scale(160),
    height: scale(160),
  },
  emptyTitle: {
    fontSize: moderateScale(24),
    fontFamily: 'Rubik-Bold',
    color: '#4B5563',
    textAlign: 'center',
    marginTop: verticalScale(10),
  },
  emptyHighlight: {
    color: '#234F68',
  },
  emptySubtitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Rubik-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: verticalScale(5),
  },
  filterChipsContainer: {
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
    // paddingHorizontal: PADDING_HORIZONTAL,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F0FA',
    borderRadius: 20,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    marginRight: scale(8),
  },
  filterChipText: {
    fontSize: moderateScale(12),
    fontFamily: 'Rubik-Regular',
    color: '#234F68',
    marginRight: scale(4),
  },
  clearButton: {
    padding: scale(2),
  },
  clearAllButton: {
    marginRight: PADDING_HORIZONTAL,
    marginBottom: verticalScale(5),
  },
  clearAllText: {
    fontSize: moderateScale(14),
    fontFamily: 'Rubik-Medium',
    color: '#234F68',
    textAlign: 'right',
  },
});