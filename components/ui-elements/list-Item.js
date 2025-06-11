import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
const ListItem = ({ imageSource, title, onHeanler }) => {
  const navigation = useNavigation(); // Initialize the useNavigation hook

  return (
    <TouchableOpacity onPress={onHeanler}>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <Image source={{ uri: imageSource }} style={styles.image} />
        </View>
        <View style={styles.rightSection}>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: .5,
    borderColor: '#000',
    padding: 10,
    marginHorizontal: 5,
    marginVertical: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  leftSection: {
    marginRight: 10,
  },
  image: {
    width: 35,
    height: 45,
    borderRadius: 5,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#000',
  },
});
export default ListItem