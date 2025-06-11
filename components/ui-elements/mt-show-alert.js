import React from 'react';
import {Icon, Overlay} from 'react-native-elements';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {MtButton} from './mt-button';
import {MtBodyText} from './mt-body-text';
import Config from '../../constants/config'

const MultipleButtons = ({buttons}) => {

  return (
    <View style={styles.modalFooter}>
      {buttons.map((item, i) => (
        <MtButton
          title={item.title}
          key={item.title + i}
          buttonSize={item.buttonSize || 'small'}
          buttonStyle={item.buttonStyle || 'secondary'}
          buttonColor={item.buttonColor}
          onPressHandler={item.onPress}
        />
      ))}
    </View>
  );
};

export const MtShowAlert=(props) => {
  const {message, title, buttons, viewContent, closeIcon} = props;
  return (
    <Overlay
      isVisible
      overlayStyle={{padding: 0,width:props.width || "80%"}}
      height="auto">
        <React.Fragment>
        <View style={[styles.modalHeader, {flexDirection: 'row', alignItems: 'center'}]}>
          <View style={{width: (closeIcon) ? '80%' : '100%'}}>
            <MtBodyText style={styles.modalHeaderText}>{title}</MtBodyText>
          </View>
          {
            (closeIcon) &&
            <View style={{width: '20%'}}>
              <TouchableOpacity onPress={closeIcon}>
                <Icon
                  name={"ios-close"}
                  type="ionicon"
                  color="#ff7609"
                  size={35}
                />
              </TouchableOpacity>
            </View>
          }
        </View>
        <View style={styles.modalContent}>
          {viewContent || <MtBodyText style={styles.modalContentText}>{message}</MtBodyText>}
        </View>
        <MultipleButtons buttons={buttons}/>
        </React.Fragment>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    backgroundColor: Config.modalHeaderBackgroundColor,
    height: 45,
    borderBottomColor: '#f4f4f4',
    borderBottomWidth: 1,
  },
  modalHeaderText: {
    padding: 13,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    color: Config.modalHeaderTextColor,
    fontWeight: 'bold',
  },
  modalContent: {
    minHeight: 40,
  },
  modalContentText: {
    padding: 13,
    paddingBottom: 0,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
});