import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-elements'
const NotificationListItem = ({ notification, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10,backgroundColor:'#fff' }}>
        <View style={{ marginRight: 10 }}>
        <Icon type="material" name={'notifications'} iconStyle={{ borderRadius: 4, padding: 5, backgroundColor: '#008571', marginTop: 5, color: 'white' }} size={28} />
        </View>
        <View style={{ flex: 1 }}>
          <Text>{notification.msgTitle}</Text>
          <Text style={{ fontSize: 12, color: '#888' }}>{notification.date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default NotificationListItem;