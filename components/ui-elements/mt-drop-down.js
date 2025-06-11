import React from 'react';
import {StyleSheet} from 'react-native';
import { Icon } from 'react-native-elements'
import RNPickerSelect from 'react-native-picker-select';
export const MtDropDown = props => {
    const placeholder = {
        label: 'Select ...',
        value: null,
        color: '#9EA0A4',
    };
    return (<RNPickerSelect
        placeholder={props.placeholder || placeholder}
        items={props.items||[]}
        onValueChange={props.onValueChangeHandler}
        style={{
            ...pickerSelectStyles,
            iconContainer: {
                top: 8,
                right: 15,
            },
            ...props.dropSelectStyle,
        }}
        value={props.selectedvalue}
        useNativeAndroidPickerStyle={false}
        textInputProps={{ underlineColor: 'yellow' }}
        Icon={() => {
            return <Icon type="entypo" name="chevron-small-down" size={28} color="#444" />;
        }}
    />);
};
const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: 'gray',
      borderRadius: 4,
      color: 'black',
      paddingRight: 30, // to ensure the text is never behind the icon
    },
    inputAndroid: {
      fontSize: 14,
      fontFamily:'montserrat',
      paddingHorizontal: 15,
      marginHorizontal:10,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: '#e8e8e8',
      borderRadius: 20,
      color: '#444',

      paddingRight: 20, // to ensure the text is never behind the icon
    },
  });