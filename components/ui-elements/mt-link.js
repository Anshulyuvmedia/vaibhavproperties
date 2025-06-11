import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {GlobalStyles} from "../../styles";

export const MtLink = props => {
  return (<>
      <TouchableOpacity onPress={props.onPressHandler}>
        <Text style={{...GlobalStyles.linkText, ...props.style}}>{props.children}</Text>
      </TouchableOpacity>
    </>);
};

