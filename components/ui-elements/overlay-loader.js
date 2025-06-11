import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Modal from 'react-native-modal';

const OverlayLoader = ({ isVisible }) => {
  return (
    <Modal isVisible={isVisible} animationIn="fadeIn" animationOut="fadeOut">
      <View style={styles.modalContainer}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default OverlayLoader;
