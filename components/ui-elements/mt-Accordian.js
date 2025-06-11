import React, {useState} from 'react';
import {LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View} from "react-native";
import {Icon} from 'react-native-elements'

export const MtAccordian = props => {
    const data = props.data;
    const [expanded, setExanded] = useState(false);
    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if(expanded)
        {
            setExanded(false)
        }
        else
        {
            setExanded(true)
        }
    }

    if (Platform.OS === 'android') {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    return (<>
        <View>
            <TouchableOpacity  style={styles.row} onPress={() => toggleExpand()}>
                <Text style={[styles.title, styles.font]}>{props.title}</Text>
                <Icon type="antdesign" name={expanded ? 'arrowup' : 'arrowdown'} size={30} color='#fff' />
            </TouchableOpacity>
            <View style={styles.parentHr} />
            {
                expanded &&
                <View style={styles.child}>
                    <Text>{props.data}</Text>
                </View>
            }

        </View>
    </>);

};
const styles = StyleSheet.create({
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        height: 56,
        paddingLeft: 25,
        paddingRight: 18,
        alignItems: 'center',
        backgroundColor: '#3944F7',
    },
    parentHr: {
        height: 1,
        color: '#fff',
        width: '100%',
    },
    child: {
        backgroundColor: '#d5d5d5',
        padding: 16,
    }

});
