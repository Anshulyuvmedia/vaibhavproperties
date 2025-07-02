import { StyleSheet, ScrollView, Text, View, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import RBSheet from 'react-native-raw-bottom-sheet';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import icons from '@/constants/icons';
import PropertyNavigation from '@/components/PropertyNavigation';

const MyEnquiries = () => {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const rbSheetRef = useRef();

  useEffect(() => {
    fetchUserEnquiries();
  }, []);

  const fetchUserEnquiries = async () => {
    setLoading(true);
    try {
      const parsedPropertyData = JSON.parse(await AsyncStorage.getItem('userData'));
      if (!parsedPropertyData?.id) {
        console.error('User data or ID missing');
        return;
      }
      const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/fetchenquiries?id=${parsedPropertyData.id}`);

      if (response.data && response.data.data) {
        setEnquiries(response.data.data);
      } else {
        console.error('Unexpected API response format:', response.data);
      }
    } catch (error) {
      console.error('Error fetching enquiries:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserEnquiries();
  };

  const openDetails = (enquiry) => {
    setSelectedEnquiry(enquiry);
    rbSheetRef.current.open();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const renderStatusBadge = (status) => {
    const statusStyles = {
      Qualified: { backgroundColor: '#E6F3E6', color: '#4CAF50' },
      'Not Responded': { backgroundColor: '#FFE6E6', color: '#FF5252' },
    };
    const style = statusStyles[status] || { backgroundColor: '#F0F0F0', color: '#666' };
    return (
      <View style={[styles.statusBadge, style]}>
        <Text style={[styles.statusText, { color: style.color }]}>{status}</Text>
      </View>
    );
  };

  const renderEnquiry = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => openDetails(item)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        {renderStatusBadge(item.status)}
      </View>
      <View style={styles.cardrow}>
        <Text style={styles.cardText}>{item.housecategory}</Text>
        <Text style={styles.cardText}>{item.inwhichcity}</Text>
      </View>

      <View style={styles.cardrow}>
        <Text style={styles.cardText}>Bid: {formatCurrency(item.propertybid)}</Text>
        <Text style={styles.cardDate}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        {item.propertyid && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/properties/${item.propertyid}`)}
          >
            <Text style={styles.actionButtonText}>View Property</Text>
          </TouchableOpacity>
        )}
        {item.agentid && (
          <TouchableOpacity
            style={[styles.actionButton, styles.agentButton]}
            onPress={() => router.push(`/agent/${item.agentid}`)}
          >
            <Text style={styles.actionButtonText}>View Agent</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={icons.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>My Enquiries</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <Image source={icons.bell} style={styles.bellIcon} />
        </TouchableOpacity>
      </View>

      <PropertyNavigation path={'myenquiries'} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#234F68" />
        </View>
      ) : enquiries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No enquiries found</Text>
        </View>
      ) : (
        <FlatList
          data={enquiries}
          renderItem={renderEnquiry}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#234F68']}
            />
          }
        />
      )}

      <RBSheet
        ref={rbSheetRef}
        height={verticalScale(500)}
        openDuration={250}
        customStyles={{
          container: styles.rbSheet,
        }}
      >
        {selectedEnquiry && (
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Enquiry Details</Text>
              <TouchableOpacity
                style={styles.sheetCloseButton}
                onPress={() => rbSheetRef.current.close()}
              >
                <Text style={styles.sheetCloseButtonText}>X</Text>
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Name:</Text>
                <Text style={styles.sheetValue}>{selectedEnquiry.name}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Mobile:</Text>
                <Text style={styles.sheetValue}>{selectedEnquiry.mobilenumber}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Email:</Text>
                <Text style={styles.sheetValue}>{selectedEnquiry.email}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>City:</Text>
                <Text style={styles.sheetValue}>{selectedEnquiry.city}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>State:</Text>
                <Text style={styles.sheetValue}>{selectedEnquiry.state}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Property Type:</Text>
                <Text style={styles.sheetValue}>{selectedEnquiry.housecategory}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Client's City:</Text>
                <Text style={styles.sheetValue}>{selectedEnquiry.inwhichcity}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Property Bid:</Text>
                <Text style={styles.sheetValue}>{formatCurrency(selectedEnquiry.propertybid)}</Text>
              </View>
              <View style={styles.sheetRow}>
                <Text style={styles.sheetLabel}>Status:</Text>
                <Text style={styles.sheetValue}>{selectedEnquiry.status}</Text>
              </View>
              
              
            </ScrollView>
            <View style={styles.sheetButtonContainer}>
              {selectedEnquiry.agentid && (
                <TouchableOpacity
                  style={[styles.sheetActionButton, styles.agentButton]}
                  onPress={() => {
                    rbSheetRef.current.close();
                    router.push(`/agent/${selectedEnquiry.agentid}`);
                  }}
                >
                  <Text style={styles.sheetActionButtonText}>View Agent Profile</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.sheetActionButton}
                onPress={() => rbSheetRef.current.close()}
              >
                <Text style={styles.sheetActionButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </RBSheet>
    </View>
  );
};

export default MyEnquiries;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingHorizontal: scale(15),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: verticalScale(10),
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: verticalScale(50),
  },
  emptyText: {
    fontSize: moderateScale(16),
    color: '#666',
    fontFamily: 'Rubik-Regular',
  },
  flatListContent: {
    paddingBottom: verticalScale(80),
    paddingInline: verticalScale(7),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(10),
    padding: moderateScale(15),
    marginVertical: verticalScale(8),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  cardrow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontFamily: 'Rubik-Bold',
    color: '#234F68',
  },
  statusBadge: {
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(12),
  },
  statusText: {
    fontSize: moderateScale(12),
    fontFamily: 'Rubik-Medium',
  },
  cardText: {
    fontSize: moderateScale(14),
    color: '#666',
    fontFamily: 'Rubik-Regular',
    marginVertical: verticalScale(3),
  },
  cardDate: {
    fontSize: moderateScale(12),
    color: '#999',
    fontFamily: 'Rubik-Regular',
    marginTop: verticalScale(5),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: verticalScale(10),
    gap: scale(10),
  },
  actionButton: {
    backgroundColor: '#234F68',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
  },
  agentButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontFamily: 'Rubik-Medium',
  },
  rbSheet: {
    flex: 1,
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
    backgroundColor: '#fff',
  },
  sheetContainer: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  sheetTitle: {
    fontSize: moderateScale(18),
    fontFamily: 'Rubik-Bold',
    color: '#234F68',
  },
  sheetCloseButton: {
    backgroundColor: '#f4f2f7',
    borderRadius: moderateScale(20),
    width: moderateScale(30),
    height: moderateScale(30),
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCloseButtonText: {
    fontSize: moderateScale(16),
    fontFamily: 'Rubik-Medium',
    color: '#234F68',
  },
  sheetContent: {
    flexGrow: 1,
    paddingBottom: verticalScale(20),
  },
  sheetRow: {
    flexDirection: 'row',
    marginVertical: verticalScale(5),
  },
  sheetLabel: {
    fontSize: moderateScale(14),
    fontFamily: 'Rubik-Medium',
    color: '#234F68',
    width: scale(120),
  },
  sheetValue: {
    fontSize: moderateScale(14),
    fontFamily: 'Rubik-Regular',
    color: '#666',
    flex: 1,
  },
  sheetButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: verticalScale(10),
    gap: scale(10),
  },
  sheetActionButton: {
    backgroundColor: '#234F68',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    alignItems: 'center',
  },
  sheetActionButtonText: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontFamily: 'Rubik-Medium',
  },
});