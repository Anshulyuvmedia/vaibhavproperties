import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import config from '../../constants/config';

const Default = () => {
  return (
    <View style={styles.card}>
      <Image
        source={require("../../assets/defulte.png")}
        style={styles.image}
      />
      <Text style={styles.title}>Result Not Found</Text>
      <Text style={styles.description}></Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    maxWidth: '100%',
    height: Dimensions.get('window').height,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  description: {
    color: '#666',
    marginBottom: 20,
    textAlign: 'center'
  },
  subscribeButton: {
    backgroundColor: config.primaryColor,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Default;
