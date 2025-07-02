// app/(root)/(tabs)/myassets/_layout.jsx
import { Stack } from 'expo-router';

export default function MyAssetsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }} >
            <Stack.Screen name="myproperties" options={{ title: 'My Properties', headerShown: false }} />
            <Stack.Screen name="myenquiries" options={{ title: 'My Enquiries', headerShown: false }} />
            <Stack.Screen name="myloans" options={{ title: 'My Loans', headerShown: false }} />
            {/* <Stack.Screen name="myenquiries" options={{ title: 'Free Signal' }} />
            <Stack.Screen name="mybanks" options={{ title: 'AI Chart Patterns' }} /> */}
        </Stack>
    );
}