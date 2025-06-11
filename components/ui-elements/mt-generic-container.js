import React from "react";
import {Image, View,StyleSheet} from "react-native";
import {MtBodyText} from './mt-body-text';
import {NonMemberStyles} from '../../styles';

export const MtGenericContainer = (props) => (
    <View style={NonMemberStyles.mainbox}>
        <View style={NonMemberStyles.Logobox}>
           {props.avatarBox}
        </View>
        <View style={NonMemberStyles.boxHeader}>
            <MtBodyText style={NonMemberStyles.headingTitle}>{props.headerTitle}</MtBodyText>
            <MtBodyText style={NonMemberStyles.headingSubTitle}>{props.subTitle}</MtBodyText>
        </View>
        {props.children}
    </View>
);
