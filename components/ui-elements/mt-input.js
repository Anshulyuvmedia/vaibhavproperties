import React from 'react';
import {Input} from 'react-native-elements';
import {StyleSheet} from "react-native";
import Config from '../../constants/config';
import {TextInputMask} from 'react-native-masked-text';

export const MtInput = (props) => {
  const {
    value, keyboardType, returnKeyType, placeholder, errorMessage, onChangeText, maxLength,
    containerStyle, leftIcon, secureTextEntry, maskedInput, onChangeHandler, type,inputTextStyle,rightIcon
  } = props;
  if (!maskedInput) {
    return (
      <Input
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        value={value}
        secureTextEntry={secureTextEntry || false}
        keyboardAppearance="light"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType || "default"}
        returnKeyType={returnKeyType || 'done'}
        blurOnSubmit={true}
        containerStyle={{...style.containerStyle, ...containerStyle}}
        maxLength={maxLength}
        inputStyle={{...style.inputText, ...inputTextStyle}}
        placeholder={placeholder}
        onChangeText={onChangeText}
        errorMessage={errorMessage}
        errorStyle={{color: 'red'}}
        inputContainerStyle={style.inputContainerStyle}
        leftIconContainerStyle={style.leftIconContainerStyle}
        rightIconContainerStyle={rightIcon && style.rightIconContainerStyle}
        placeholderTextColor="#AAA"
        {...props}
      />
    );
  } else {
    return (
      <TextInputMask
        type={(!type) ? (value.length <= 10 ? 'cpf' : 'cnpj') : 'cel-phone'}
        customTextInput={Input}
        customTextInputProps={{
          errorMessage:errorMessage,
          errorStyle:{color: 'red'},
          containerStyle:{...style.containerStyle, ...containerStyle},
          inputStyle:{...style.inputText},
          inputContainerStyle:{...style.inputContainerStyle},
        }}
        options={{
          dddMask: '(99) 99999-9999'
        }}
        keyboardType={keyboardType || "default"}
        value={value}
        onChangeText={(maskedText, rawText) => {
          onChangeHandler(maskedText, rawText);
        }}
        maxLength={(!type) ? 18 : 15}
        includeRawValueInChangeText={true}
        placeholder={(!type) ? (value.length <= 10 ? placeholder : placeholder) : placeholder}
      />
    )
  }
}
const style = StyleSheet.create({
  inputText: {
    fontSize: 15,
    fontFamily: 'montserrat',
    color: Config.bodyTextColor,
    paddingLeft:5,
    alignContent:'flex-start',
  },
  containerStyle: {
    marginTop: 1,
  },
  inputContainerStyle: {
    borderColor: '#e0e0e0',
    marginBottom:-15,
    paddingLeft:8,
    borderWidth:1,
    borderRadius: 25,
    textAlign:'center'
  }

});
