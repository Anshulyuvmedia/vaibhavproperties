// app/(root)/(tabs)/myassets/_layout.jsx
import { Stack } from 'expo-router';

export default function MyAssetsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }} >
            <Stack.Screen name="myproperties" options={{ title: 'My Properties', headerShown: false }} />
            <Stack.Screen name="auction" options={{ title: 'Auction', headerShown: false }} />
            <Stack.Screen name="myleads" options={{ title: 'My Leads', headerShown: false }} />
            {/* <Stack.Screen name="myenquiries" options={{ title: 'Free Signal' }} />
            <Stack.Screen name="mybanks" options={{ title: 'AI Chart Patterns' }} /> */}
        </Stack>
    );
}