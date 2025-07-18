import { StyleSheet, Text, TouchableOpacity, View, Image, FlatList, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Switch } from 'react-native';
import DatePicker from 'react-native-date-picker';
import icons from '@/constants/icons';
import PropertyNavigation from '@/components/PropertyNavigation';
import { useTranslation } from 'react-i18next';
import Ionicons from "@expo/vector-icons/Ionicons";

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

// Get screen width for DatePicker
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const Myproperties = () => {
  const { t, i18n } = useTranslation();
  const [userPropertyData, setUserPropertyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bidStatus, setBidStatus] = useState(false);
  const [bidEndDate, setBidEndDate] = useState(new Date());
  const router = useRouter();
  const rbSheetRef = useRef();

  const handleCardPress = (id) => router.push(`/properties/${id}`);
  const handleEditPress = (id) => router.push(`/dashboard/editproperties/${id}`);
  const handleAddProperty = () => router.push('/addproperty');

  const handleEditBidPress = (property) => {
    setSelectedProperty(property);
    setBidStatus(property.bidstatus?.toLowerCase() === 'on');
    // Handle invalid or missing bid end date
    const parsedDate = property.bidenddate
      ? new Date(property.bidenddate.split('/').reverse().join('-'))
      : new Date();
    setBidEndDate(isNaN(parsedDate) ? new Date() : parsedDate);
    rbSheetRef.current.open();
  };

  const handleSubmitBid = async () => {
    try {
      setLoading(true);
      const response = await axios.post('https://landsquire.in/api/update-bid-status', {
        propertyid: selectedProperty.id,
        bidliveStatus: bidStatus ? 'on' : 'off',
        bidEnddate: bidStatus ? bidEndDate.toISOString().split('T')[0] : null,
      });
      if (response.data.success) {
        // Update local state
        setUserPropertyData(prevData =>
          prevData.map(item =>
            item.id === selectedProperty.id
              ? {
                ...item,
                bidstatus: bidStatus ? 'on' : 'off',
                bidenddate: bidStatus ? formatDate(bidEndDate.toISOString()) : '',
              }
              : item
          )
        );
        rbSheetRef.current.close();
        alert(t('bidUpdatedSuccess'));
      } else {
        alert(t('bidUpdateFailed') + ': ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating bid:', error);
      alert(t('bidUpdateFailed') + ': ' + (error.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date)) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const parsedPropertyData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!parsedPropertyData?.id) {
        console.error('User data or ID missing');
        return;
      }
      const response = await axios.get(`https://landsquire.in/api/viewuserlistings?id=${parsedPropertyData.id}`);
      if (response.data && response.data.properties) {
        const formattedData = response.data.properties.map((item) => ({
          id: item.id,
          property_name: item.property_name,
          address: item.address,
          price: item.price,
          status: item.status,
          bidstatus: item.bidstatus,
          bidenddate: formatDate(item.bidenddate),
          category: item.category,
          thumbnail: item.thumbnail && typeof item.thumbnail === 'string' && item.thumbnail.startsWith('http')
            ? item.thumbnail
            : item.thumbnail
              ? `https://landsquire.in/adminAssets/images/Listings/${item.thumbnail}`
              : 'https://landsquire.in/adminAssets/images/default-thumbnail.jpg',
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
      setRefreshing(false);
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
          <Text style={[styles.title, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Bold' : 'Rubik-Bold' }]}>
            {t('myProperties')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/notifications')}>
            <Image source={icons.bell} style={styles.bellIcon} />
          </TouchableOpacity>
        </View>

        <PropertyNavigation path={'myproperties'} />

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>{t('allPropertiesListed')}</Text>
        </View>
        {/* Content */}
        <View style={styles.content}>
          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={[styles.loadingText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                {t('loadingProperties')}
              </Text>
            </View>
          ) : userPropertyData.length === 0 ? (
            <View style={styles.noDataContainer}>
              <TouchableOpacity onPress={handleAddProperty}>
                <Image source={icons.noProperties} style={styles.noDataIcon} />
              </TouchableOpacity>
              <Text style={[styles.noDataTitle, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-SemiBold' : 'Rubik-SemiBold' }]}>
                {t('noPropertiesTitle')}
              </Text>
              <Text style={[styles.noDataMessage, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                {t('noPropertiesMessage')}
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
                      source={{ uri: item.thumbnail || 'https://landsquire.in/adminAssets/images/default-thumbnail.jpg' }}
                      style={styles.propertyImage}
                    />
                    <View style={styles.categoryBadge}>
                      <Text style={[styles.categoryText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                        {item.category}
                      </Text>
                    </View>
                  </View>

                  {/* Text Content Section */}
                  <View style={styles.textContent}>
                    <Text style={[styles.propertyName, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                      {item.property_name.length > 20
                        ? item.property_name.slice(0, 20) + '...'
                        : item.property_name}
                    </Text>
                    <View style={styles.locationRow}>
                      <View style={styles.statusContainer}>
                        <Ionicons name="location-outline" size={16} color="#234F68" />
                        <Text style={[styles.locationText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                          {item.city}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={[styles.priceText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Medium' : 'Rubik-Medium' }]}>
                        {formatINR(item.price)}
                      </Text>
                      <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, { backgroundColor: item.status?.toLowerCase() === 'published' ? '#28A745' : '#DC3545', },]} />
                        <Text style={[styles.statusText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                          {item.status?.toLowerCase() === 'published' ? t('Active') : t('Inactive')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.priceRow}>
                      <View>
                        <Text style={styles.labelText}>{t('endDate')}</Text>
                        <Text style={[styles.locationText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                          {item.bidenddate || t('notSet')}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.labelText}>{t('bidStatus')}</Text>
                        <View style={styles.statusContainer}>
                          <View style={[styles.statusDot, { backgroundColor: item.bidstatus?.toLowerCase() === 'on' ? '#28A745' : '#DC3545' }]} />
                          <Text style={[styles.statusText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                            {item.bidstatus?.toLowerCase() === 'on' ? t('biddingOn') : t('biddingOff')}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.buttonRow}>
                      <TouchableOpacity style={styles.editButton} onPress={() => handleEditPress(item.id)}>
                        <Text style={[styles.editText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                          {t('editProperty')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.bidButton} onPress={() => handleEditBidPress(item)}>
                        <Text style={[styles.editText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                          {t('editBid')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4A90E2']}
                  tintColor="#4A90E2"
                />
              }
            />
          )}
        </View>
      </View>

      {/* RBSheet for Bid Editing */}
      <RBSheet
        ref={rbSheetRef}
        closeOnDragDown
        height={verticalScale(300)}
        openDuration={250}
        customStyles={{
          container: {
            borderTopLeftRadius: moderateScale(20),
            borderTopRightRadius: moderateScale(20),
            padding: moderateScale(20),
            backgroundColor: '#fafafa',
          },
        }}
      >
        <View>
          <Text style={[styles.sheetTitle, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Bold' : 'Rubik-Bold' }]}>
            {t('editBid')}
          </Text>
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
              {t('bidStatus')}
            </Text>
            <Switch
              value={bidStatus}
              onValueChange={(value) => setBidStatus(value)}
              trackColor={{ false: '#DC3545', true: '#28A745' }}
              thumbColor={bidStatus ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          {bidStatus && (
            <View style={styles.datePickerContainer}>
              <Text style={[styles.switchLabel, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
                {t('bidEndDate')}
              </Text>
              <DatePicker
                date={bidEndDate}
                onDateChange={setBidEndDate}
                mode="date"
                minimumDate={new Date()}
                textColor="#1F2937" // Explicitly set to dark color
                style={styles.datePicker}
                theme="light" // Force light theme to prevent white text
                androidVariant="nativeAndroid" // Use native Android picker for consistency
              />
            </View>
          )}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmitBid}
            disabled={loading}
          >
            <Text style={[styles.submitButtonText, { fontFamily: i18n.language === 'hi' ? 'NotoSerifDevanagari-Regular' : 'Rubik-Regular' }]}>
              {loading ? t('submitting') : t('submit')}
            </Text>
          </TouchableOpacity>
        </View>
      </RBSheet>
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
    color: '#234F68',
  },
  bellIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(3),
  },
  infoText: {
    fontSize: moderateScale(14),
    color: '#4A5568',
    fontFamily: 'Rubik-Regular',
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
  listContent: {
    paddingBottom: verticalScale(75),
    paddingHorizontal: scale(2),
  },
  card: {
    width: '100%',
    height: verticalScale(145),
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
    borderRadius: moderateScale(25),
    resizeMode: 'cover',
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
    fontSize: moderateScale(10),
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textContent: {
    flex: 1,
    padding: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'start',
  },
  propertyName: {
    fontSize: moderateScale(14),
    fontWeight: 'bold',
    color: '#4A5568',
    textTransform: 'capitalize',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  locationIcon: {
    width: moderateScale(14),
    height: moderateScale(14),
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
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  editButton: {
    backgroundColor: '#8bc83f',
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%',
    height: verticalScale(25),
    borderRadius: moderateScale(15),
  },
  bidButton: {
    backgroundColor: '#234F68',
    justifyContent: 'center',
    alignItems: 'center',
    width: '48%',
    height: verticalScale(25),
    borderRadius: moderateScale(15),
  },
  editText: {
    fontSize: moderateScale(14),
    fontWeight: '400',
    color: '#FFFFFF',
    paddingHorizontal: scale(10),
  },
  sheetTitle: {
    fontSize: moderateScale(18),
    color: '#234F68',
    marginBottom: verticalScale(16),
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },
  switchLabel: {
    fontSize: moderateScale(14),
    color: '#4A5568',
  },
  datePickerContainer: {
    marginBottom: verticalScale(16),
  },
  datePicker: {
    width: SCREEN_WIDTH - scale(40), // Adjusted to account for padding
    height: verticalScale(100),
  },
  submitButton: {
    backgroundColor: '#8bc83f',
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(15),
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  submitButtonText: {
    fontSize: moderateScale(14),
    color: '#FFFFFF',
  },
  labelText: {
    fontSize: moderateScale(10),
    color: '#4A5568',
    fontFamily: 'Rubik-Regular',
  },
});