import React, { useState } from 'react';
import { View, Modal, Image, StyleSheet, Dimensions, TouchableWithoutFeedback, Animated } from 'react-native';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const ZoomImage = ({ uri }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const onZoomEvent = event => {
    const { scale, translationX, translationY } = event.nativeEvent;
    setScale(scale);
    setTranslateX(translationX);
    setTranslateY(translationY);
  };

  const onZoomStateChange = event => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setScale(Math.max(1, scale));
      setTranslateX(Math.max(-width * (scale - 1), Math.min(0, translateX)));
      setTranslateY(Math.max(-height * (scale - 1), Math.min(0, translateY)));
    }
  };
  return (
    <TouchableWithoutFeedback onPress={() => setModalVisible(true)}>
      <View style={styles.container}>
        <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalOverlay} />
          </TouchableWithoutFeedback>
          <PinchGestureHandler onGestureEvent={onZoomEvent} onHandlerStateChange={onZoomStateChange}>
            <Animated.Image
              source={{ uri }}
              style={[
                styles.image,
                {
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
            />
          </PinchGestureHandler>
        </Modal>
        <Image source={{ uri }} style={styles.thumbnail} />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  thumbnail: {
    width: 200,
    height: 200,
    resizeMode: 'cover',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  image: {
    width,
    height,
  },
});

export default ZoomImage;
