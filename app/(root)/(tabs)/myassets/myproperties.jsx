import { StyleSheet, Text, TouchableOpacity, View, Image, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import icons from '@/constants/icons';
import PropertyNavigation from '@/components/PropertyNavigation';

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

const Myproperties = () => {
  const [userPropertyData, setUserPropertyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleCardPress = (id) => router.push(`/properties/${id}`);
  const handleEditPress = (id) => router.push(`/dashboard/editproperties/${id}`);
  const handleAddProperty = () => router.push('/addproperty'); // Navigate to add property screen

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const parsedPropertyData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!parsedPropertyData?.id) {
        console.error('User data or ID missing');
        return;
      }
      const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/viewuserlistings?id=${parsedPropertyData.id}`);
      if (response.data && response.data.properties) {
        const formattedData = response.data.properties.map((item) => ({
          id: item.id,
          property_name: item.property_name,
          address: item.address,
          price: item.price,
          status: item.status,
          category: item.category,
          thumbnail: item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.startsWith('http')
            ? item.thumbnail
            : item.thumbnail
              ? `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Listings/${item.thumbnail}`
              : 'https://vaibhavproperties.cigmafeed.in/adminAssets/images/default-thumbnail.jpg',
          city: item.city,
        }));
        setUserPropertyData(formattedData);
      } else {
        console.error('Unexpected API response format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false); // Reset refreshing state when done
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Image source={icons.backArrow} style={styles.backIcon} />
          </TouchableOpacity>
          <Text style={styles.title}>My Properties</Text>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Image source={icons.bell} style={styles.bellIcon} />
          </TouchableOpacity>
        </View>

        <PropertyNavigation path={'myproperties'} />
        {/* Content */}
        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading properties...</Text>
            </View>
          ) : userPropertyData.length === 0 ? (
            <View style={styles.noDataContainer}>
              <TouchableOpacity onPress={handleAddProperty}>
                <Image source={icons.noProperties} style={styles.noDataIcon} />
              </TouchableOpacity>
              <Text style={styles.noDataTitle}>No Properties Listed Yet</Text>
              <Text style={styles.noDataMessage}>
                It looks like you haven’t added any properties. Start by adding your first property to get started!
              </Text>
            </View>
          ) : (
            <FlatList
              data={userPropertyData}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleCardPress(item.id)}
                  style={styles.card}
                >
                  {/* Image Section */}
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.thumbnail || 'https://vaibhavproperties.cigmafeed.in/adminAssets/images/default-thumbnail.jpg' }}
                      style={styles.propertyImage}
                    />
                    {/* Heart Icon (placeholder, replace with actual icon if available) */}
                    <View style={styles.heartIconContainer}>
                      <Image source={icons.heart} style={styles.heartIcon} />
                    </View>
                    {/* Category Badge */}
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>

                  {/* Text Content Section */}
                  <View style={styles.textContent}>
                    <Text style={styles.propertyName}>{item.property_name}</Text>
                    <View style={styles.locationRow}>
                      <Image source={icons.location} style={styles.locationIcon} />
                      <Text style={styles.locationText}>{item.city}, {item.address}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>{formatINR(item.price)}</Text>
                      <View style={styles.statusContainer}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: item.status?.toLowerCase() === 'published' ? '#28A745' : '#DC3545',
                            },
                          ]}
                        />
                        <Text style={styles.statusText}>
                          {item.status?.toLowerCase() === 'published' ? 'Live' : 'Offline'}
                        </Text>
                      </View>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity style={styles.editButton} onPress={() => handleEditPress(item.id)}>
                      <Text style={styles.editText}>Edit Property</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4A90E2']} // Loading indicator color
                  tintColor="#4A90E2"
                />
              }
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default Myproperties;

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

  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: moderateScale(14),
    color: '#718096',
    marginTop: verticalScale(8),
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: scale(20),
  },
  noDataIcon: {
    width: scale(120),
    height: scale(120),
  },
  noDataTitle: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#2D3748',
    textAlign: 'center',
    marginBottom: verticalScale(8),
  },
  noDataMessage: {
    fontSize: moderateScale(14),
    color: '#718096',
    textAlign: 'center',
    marginBottom: verticalScale(16),
  },
  addButton: {
    backgroundColor: '#8bc83f',
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(20),
  },
  addButtonText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#000',
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  card: {
    width: '100%',
    height: verticalScale(120),
    borderRadius: moderateScale(30),
    backgroundColor: '#f5f4f8',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: 3,
  },
  imageContainer: {
    width: scale(150),
    height: '100%',
    position: 'relative',
    padding: moderateScale(8),
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(30),
    resizeMode: 'cover',
  },
  heartIconContainer: {
    position: 'absolute',
    top: verticalScale(16),
    left: scale(16),
    backgroundColor: '#8BC83F',
    borderRadius: moderateScale(20),
    padding: moderateScale(6),
  },
  heartIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: '#FFFFFF',
  },
  categoryBadge: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: scale(16),
    backgroundColor: 'rgba(35,79,104,0.9)',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(4),
  },
  categoryText: {
    fontSize: moderateScale(12),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textContent: {
    flex: 1,
    padding: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  propertyName: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: verticalScale(4),
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: verticalScale(4),
  },
  locationIcon: {
    width: moderateScale(16),
    height: moderateScale(16),
    tintColor: '#234F68',
    marginRight: scale(4),
  },
  locationText: {
    fontSize: moderateScale(12),
    color: '#234F68',
    fontWeight: '400',
  },
  priceText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: verticalScale(8),
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: moderateScale(8),
    height: moderateScale(8),
    borderRadius: moderateScale(4),
    marginRight: scale(4),
  },
  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '400',
    color: '#4A5568',
  },
  editButton: {
    backgroundColor: '#8bc83f',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: verticalScale(25),
    borderRadius: moderateScale(15),
  },
  editText: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    color: '#FFFFFF',
    paddingHorizontal: scale(10),
  },
});