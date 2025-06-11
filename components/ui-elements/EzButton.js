import React from 'react';
import {Button} from 'react-native-elements';
import {StyleSheet} from "react-native";

export const EzButton = (props) => {
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
    buttonStyle.push(style.buttonLargeSize);
    textStyle = style.buttonLargeText;
  }
  buttonStyle.push(props.style);
  return (
    <Button
      {...props}
      buttonStyle={buttonStyle}
      containerStyle={{...{marginTop: 20, flex: 0, zIndex: 99, alignItems: 'center'}, ...props.containerStyle}}
      activeOpacity={0.8}
      title={props.title}
      onPress={props.OnPressHandler}
      titleStyle={props.textStyle || textStyle}
      loading={props.isLoading}
      disabled={props.isDisabled}
      disabledStyle={{backgroundColor: '#DDDDDD'}}
      disabledTitleStyle={{color: "#444"}}
    />
  );
}

const style = StyleSheet.create({
  buttonPrimaryStyle: {
    backgroundColor: 'green',
    minWidth: 80,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,

  },
  buttonSecondaryStyle: {
    backgroundColor: 'gray',
    minWidth: 80,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  buttonLargeSize: {
    padding: 10,
    margin: 5,
    alignSelf: 'center',
  },
  buttonLargeText: {
    fontSize: 16,

  },
  buttonSmallText: {
    fontSize: 13,

  },
  buttonSmallSize: {
    padding: 5,
    margin: 5,
    alignSelf: 'center',
  },

});
