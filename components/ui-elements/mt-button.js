import React from 'react';
import {Button} from 'react-native-elements';
import {StyleSheet} from "react-native";
import Config from '../../constants/config'

export const MtButton = (props) => {
  let textStyle = {}
  const buttonStyle = [];
  if (props.buttonStyle === 'secondary') {
    buttonStyle.push(style.buttonSecondaryStyle)
  } else {
    buttonStyle.push(style.buttonPrimaryStyle)
  }
  if (props.buttonSize === 'small') {
    buttonStyle.push(style.buttonSmallSize)
    textStyle = style.buttonSmallText;
  } else {
    buttonStyle.push({...style.buttonLargeSize,minWidth: props.btnWidth || 80});
    textStyle = style.buttonLargeText;
  }
  buttonStyle.push(props.style);
  return (
    <Button
      {...props}
      buttonStyle={buttonStyle}
      containerStyle={{...{marginTop: 10, flex: 0, zIndex: 99, alignItems: 'center'}, ...props.containerStyle}}
      activeOpacity={0.8}
      title={props.title}
      onPress={props.onPressHandler}
      titleStyle={textStyle}
      loading={props.isLoading}
      disabled={props.isDisabled}
      disabledStyle={{backgroundColor: '#DDDDDD'}}
      disabledTitleStyle={{color: "#444"}}
    />
  );
}
const style = StyleSheet.create({
  buttonPrimaryStyle: {
    backgroundColor: Config.primaryButtonBgColor,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius:20,

  },
  buttonSecondaryStyle: {
    backgroundColor: Config.secondaryButtonBgColor,
    minWidth: 80,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius:20,
  },
  buttonLargeSize: {
    padding: 10,
    margin: 5,
    alignSelf: 'center',
    backgroundColor:'#00c4ad',
    borderRadius:20,
  },
  buttonLargeText: {
    fontSize: 16,
    fontFamily: 'montserrat'
  },
  buttonSmallText: {
    fontSize: 13,
    fontFamily: 'montserrat'
  },
  buttonSmallSize: {
    padding: 5,
    margin: 5,
    alignSelf: 'center',
  },

});
