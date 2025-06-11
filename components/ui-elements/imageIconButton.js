import React, { useState } from 'react';
import { View, Image, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { Text, Icon } from 'react-native-elements';
export const ImageIconButton = (props) => {
  const [image, setImage] = useState(null);
  // Function to handle image pick
  const handleChoosePhoto = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        // Handle the selected image 
        const source = { uri: response.assets[0].uri};
        console.log('Selected Image:', source);
        setImage(source);
        props.setImagefile(response.assets[0]);
      }
    });
  };
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      {image && <Image source={image} style={{ width: '95%', height: 200, paddingVertical: 10, borderRadius: 20, marginTop: 20, }} />}
     <TouchableOpacity onPress={handleChoosePhoto} style={styles.btnbutton}><Text style={styles.textbtn}>Choose Photo</Text></TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  btnbutton: {
    padding: 5,
    width: '95%',
    backgroundColor: 'black',
    borderRadius: 10,
    marginTop: 20,
  },
  textbtn: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center'
  }
});