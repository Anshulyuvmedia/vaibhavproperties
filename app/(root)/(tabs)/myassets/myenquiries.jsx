import { StyleSheet, Text, View, ScrollView, Image, Dimensions, TouchableOpacity, LogBox } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import icons from '@/constants/icons';

const Myenquiries = () => {

  const [activeButton, setActiveButton] = useState('myenquiries'); // Track active button
  const router = useRouter();

  const navigateTo = (screen) => {
    setActiveButton(screen);
    router.push(`/${screen}`); // Navigate to the respective screen
  };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Image source={icons.backArrow} style={styles.backIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>My Enquiries</Text>
        <TouchableOpacity onPress={() => router.push('/notifications')}>
          <Image source={icons.bell} style={styles.bellIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, activeButton === 'myproperties' && styles.activeButton]}
          onPress={() => navigateTo('myassets/myproperties')}
        >
          <Text style={[styles.buttonText, activeButton === 'myproperties' && styles.activeButtonText]}>
            My Properties
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, activeButton === 'myenquiries' && styles.activeButton]}
          onPress={() => navigateTo('myassets/myenquiries')}
        >
          <Text style={[styles.buttonText, activeButton === 'myenquiries' && styles.activeButtonText]}>
            My Enquiries
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, activeButton === 'myloans' && styles.activeButton]}
          onPress={() => navigateTo('myassets/myloans')}
        >
          <Text style={[styles.buttonText, activeButton === 'myloans' && styles.activeButtonText]}>
            My Loans
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default Myenquiries

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Rubik-Bold',
    color: '#234F68',
  },
  bellIcon: {
    width: 24,
    height: 24,
    tintColor: '#000',
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