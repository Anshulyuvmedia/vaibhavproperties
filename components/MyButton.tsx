import { Text, TouchableOpacity, StyleSheet, GestureResponderEvent } from 'react-native';


interface MyButtonProps {
    title: string;
    onPress: (event: GestureResponderEvent) => void;
}

const MyButton = ({ title, onPress }: MyButtonProps) => {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={style.button}
            onPress={onPress}
        >
            <Text style={style.text}>{title}</Text>
        </TouchableOpacity>
    );
};

export default MyButton;

const style = StyleSheet.create({
    button: {
        backgroundColor: "red",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        alignItems: 'center',
    },
    text: {
        color: 'white',
        fontSize: 16,
        fontWeight: "700",
    },
});
