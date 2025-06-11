import React from 'react';
import {Text} from 'react-native';
import {GlobalStyles} from "../../styles";

export const MtBodyText = props => {
  let additionalBoldStyle={}
  if(props.style && props.style.fontWeight=="bold") additionalBoldStyle={fontFamily:"montserrat-bold"}
  return <Text {...props} adjustsFontSizeToFit={true} style={{...GlobalStyles.bodyText, ...props.style,...additionalBoldStyle}}>{props.children}</Text>;
};

