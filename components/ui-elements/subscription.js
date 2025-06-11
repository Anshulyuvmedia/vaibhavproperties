import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import config from '../../constants/config';

const SubscribeCard = (props) => {
  return (
    <View style={styles.card}>
      <Image
        source={require("../../assets/subscribe.png")}
        style={styles.image}
      />
      <Text style={styles.title}>Subscribe to Our App</Text>
      <Text style={styles.description}>Get paid trade call and get more profit</Text>
      <TouchableOpacity style={styles.subscribeButton} onPress={props.handlerTriger}>
        <Text style={styles.buttonText}>Subscribe Now</Text>
      </TouchableOpacity>
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
    width: 200,
    height: 200,
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

export default SubscribeCard;
