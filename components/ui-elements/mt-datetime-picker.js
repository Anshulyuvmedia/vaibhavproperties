import React, {useState} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Icon } from 'react-native-elements'
import {MtBodyText} from './mt-body-text';
import moment from 'moment'

export const MtDateTimePicker = props => {
    const [inputDate, setInputDate] = useState(props.dateValue);
    const [show, setShow] = useState(false);
    const onChange = (event, selectedDate) => {
        setShow(Platform.OS === 'ios');
        setInputDate(selectedDate || props.dateValue);
        props.onChangehandler(selectedDate  || props.dateValue)
    };
    const onPressHandler=()=>{
        if(!inputDate) setInputDate(new Date())
        setShow(true)
    }
    const setLabelText=()=>{
        if(!inputDate) return "Please Enter Date"
        else return moment(inputDate).format('DD, MMM, YYYY')
    }

    return (<>
        <TouchableOpacity onPress={onPressHandler} style={style.inputContainerStyle}>
            <View style={{ width: "90%"}}>
                <MtBodyText style={{fontSize:15,flexDirection: 'row', textAlignVertical: "center"}}>{setLabelText()}</MtBodyText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Icon type="ionicon" name="md-calendar" style={{ paddingRight: 0,textAlign:'right' }} size={22} color="#666" />
            </View>
        </TouchableOpacity>
        {/* <MtInput
            placeholder="Enter date"
            name="userName"
            rightIcon={<Ionicons name="md-calendar" style={{ paddingRight: 10 }} size={22} color="#666" />}
            disabled=
        /> */}
        {show && (<DateTimePicker
            testID="dateTimePicker"
            value={inputDate}
            mode={props.mode || 'date'}
            is24Hour={true}
            display="default"
            onChange={onChange}
        />)}
    </>);
};

const style = StyleSheet.create({
    inputContainerStyle: {
        borderColor: '#e0e0e0',
        paddingLeft: 10,
        borderWidth: 1,
        borderRadius: 3,
        width: "95%",
        paddingVertical:12,
        marginBottom:10,
        marginHorizontal:10,
        flexDirection: 'row'
    }

});