import { FlatList, Image, ScrollView, Text, StyleSheet, TouchableOpacity, View, Dimensions, Platform, ActivityIndicator, Share, Modal } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import icons from "@/constants/icons";
import images from "@/constants/images";
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker } from "react-native-maps";
import "react-native-get-random-values";
import { useNavigation } from "@react-navigation/native";
import MasterPlanList from "@/components/MasterPlanList";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import MortgageCalculator from "@/components/MortgageCalculator";
import * as Linking from "expo-linking";
import Toast, { BaseToast } from "react-native-toast-message";
import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { Video } from "expo-av";

const PropertyDetails = () => {
    const propertyId = useLocalSearchParams().id;
    const windowHeight = Dimensions.get("window").height;
    const windowWidth = Dimensions.get("window").width;
    const [propertyData, setPropertyData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [propertyThumbnail, setPropertyThumbnail] = useState(images.avatar);
    const [propertyGallery, setPropertyGallery] = useState([]);
    const [videoUrls, setVideoUrls] = useState([]);
    const [loggedinUserId, setLoggedinUserId] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [priceHistory, setPriceHistory] = useState([]);
    const [masterPlanDocs, setMasterPlanDocs] = useState([]);
    const [priceHistoryData, setPriceHistoryData] = useState([]);
    const [isPdf, setIsPdf] = useState(false);
    const [isLightboxVisible, setIsLightboxVisible] = useState(false);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const videoRef = useRef(null);
    const lightboxRef = useRef(null);

    const [coordinates, setCoordinates] = useState({
        latitude: "",
        longitude: "",
    });
    const [region, setRegion] = useState({
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
    });
    const navigation = useNavigation();

    const toastConfig = {
        success: (props) => (
            <BaseToast
                {...props}
                style={{ borderLeftColor: "green" }}
                text1Style={{ fontSize: 16, fontWeight: "bold" }}
                text2Style={{ fontSize: 14 }}
            />
        ),
        error: (props) => (
            <BaseToast
                {...props}
                style={{ borderLeftColor: "red" }}
                text1Style={{ fontSize: 16, fontWeight: "bold" }}
                text2Style={{ fontSize: 14 }}
            />
        ),
    };

    const openPdf = (pdfUrl) => {
        Linking.openURL(pdfUrl);
    };

    const openWhatsApp = (phoneNumber) => {
        if (!phoneNumber) {
            Toast.show({ type: "error", text1: "Error", text2: "Invalid phone number." });
            return;
        }
        const cleanedNumber = phoneNumber.replace(/\D/g, "");
        const url = `whatsapp://send?phone=${cleanedNumber}`;
        Linking.openURL(url).catch(() => {
            Toast.show({ type: "error", text1: "Error", text2: "WhatsApp is not installed." });
        });
    };

    const openDialer = (phoneNumber) => {
        const url = `tel:${phoneNumber}`;
        Linking.openURL(url).catch(() => {
            Toast.show({ type: "error", text1: "Error", text2: "Unable to open the dialer." });
        });
    };

    const handleEnquiry = async () => {
        try {
            setLoading(true);
            const parsedUserData = JSON.parse(await AsyncStorage.getItem("userData"));
            const userId = parsedUserData?.id;
            if (!userId) {
                console.error("User ID not found in stored userData.");
                return;
            }
            const enquiryData = {
                customername: parsedUserData.name,
                phone: parsedUserData.mobile,
                email: parsedUserData.email,
                city: propertyData.city || "",
                propertytype: propertyData.category || "",
                propertyid: propertyId,
                userid: parsedUserData.id,
                state: propertyData.city || "",
            };
            const response = await axios.post("https://investorlands.com/api/sendenquiry", enquiryData);
            if (response.status === 200 && !response.data.error) {
                Toast.show({ type: "success", text1: "Success", text2: "Enquiry submitted successfully!" });
            } else {
                Toast.show({ type: "error", text1: "Error", text2: "Failed to submit enquiry. Please try again." });
            }
        } catch (error) {
            console.error("Error submitting enquiry:", error);
            Toast.show({ type: "error", text1: "Error", text2: "An error occurred. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const shareProperty = async () => {
        try {
            const propertyUrl = `https://investorlands.com/property-details/${propertyId}`;
            const message = `View my property: ${propertyUrl}`;
            const result = await Share.share({ message, url: propertyUrl, title: "Check out this property!" });
            if (result.action === Share.sharedAction) console.log("Property shared successfully!");
            else if (result.action === Share.dismissedAction) console.log("Share dismissed.");
        } catch (error) {
            console.error("Error sharing property:", error);
        }
    };

    const fetchPropertyData = async () => {
        try {
            const parsedUserData = JSON.parse(await AsyncStorage.getItem("userData"));
            setLoggedinUserId(parsedUserData?.id || "");
            const response = await axios.get(`https://investorlands.com/api/property-details/${propertyId}`);
            if (response.data) {
                const apiData = response.data.details;
                setPropertyData(apiData);
                setPropertyThumbnail(
                    apiData.thumbnail
                        ? apiData.thumbnail.startsWith("http")
                            ? apiData.thumbnail
                            : `https://investorlands.com/assets/images/Listings/${apiData.thumbnail}`
                        : images.newYork
                );
                let galleryImages = [];
                try {
                    // console.log("Raw gallery data:", apiData.gallery);
                    if (apiData.gallery && typeof apiData.gallery === "string" && apiData.gallery.trim()) {
                        const parsedGallery = JSON.parse(apiData.gallery);
                        galleryImages = Array.isArray(parsedGallery)
                            ? parsedGallery.map((image) => ({
                                id: Math.random().toString(36).substring(2, 11),
                                image: image.startsWith("http") ? image : `https://investorlands.com/${image.replace(/\\/g, "/")}`,
                            }))
                            : [];
                    } else console.log("Gallery data is empty or invalid:", apiData.gallery);
                } catch (error) {
                    console.error("Error parsing gallery images:", error);
                    galleryImages = [];
                }
                setPropertyGallery(galleryImages);
                // console.log("Processed gallery images:", galleryImages);
                let parsedVideos = [];
                try {
                    parsedVideos = apiData.videos ? (typeof apiData.videos === "string" ? JSON.parse(apiData.videos) : []) : [];
                } catch (error) {
                    console.error("Error parsing videos:", error);
                }
                setVideoUrls(parsedVideos.map((video) => (video.startsWith("http") ? video : `https://investorlands.com/${video}`)));
                let parsedAmenities = [];
                try {
                    parsedAmenities = apiData.amenties ? JSON.parse(apiData.amenties) : [];
                } catch (error) {
                    console.error("Error parsing amenities:", error);
                }
                setAmenities(parsedAmenities);
                let priceHistory = [];
                try {
                    priceHistory = apiData.pricehistory ? JSON.parse(apiData.pricehistory) : [];
                } catch (error) {
                    console.error("Error parsing price history:", error);
                }
                setPriceHistory(priceHistory);
                if (apiData.maplocations) {
                    try {
                        const locationData = JSON.parse(apiData.maplocations);
                        const latitude = parseFloat(locationData.Latitude);
                        const longitude = parseFloat(locationData.Longitude);
                        if (latitude && longitude) {
                            setCoordinates({ latitude, longitude });
                            setRegion({ latitude, longitude, latitudeDelta: 0.015, longitudeDelta: 0.0121 });
                        }
                    } catch (error) {
                        console.error("Error parsing map locations:", error);
                    }
                }
                if (apiData.masterplandoc) {
                    const fileUrl = `https://investorlands.com/assets/images/Listings/${apiData.masterplandoc}`;
                    if (fileUrl.toLowerCase().endsWith(".pdf")) setIsPdf(true);
                    else setIsPdf(false);
                    setMasterPlanDocs(fileUrl);
                }
                if (apiData.pricehistory) {
                    let priceHistory = apiData.pricehistory;
                    if (typeof priceHistory === "string") {
                        try {
                            priceHistory = JSON.parse(priceHistory);
                        } catch (error) {
                            console.error("Error parsing price history:", error);
                            priceHistory = [];
                        }
                    }
                    if (Array.isArray(priceHistory)) setPriceHistoryData(priceHistory);
                    else {
                        console.error("Invalid price history data format");
                        setPriceHistoryData([]);
                    }
                }
            } else console.error("Unexpected API response format:", response.data);
        } catch (error) {
            console.error("Error fetching property data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPropertyData();
    }, [propertyId]);

    const openLightbox = (index) => {
        const totalMedia = (propertyGallery?.length || 0) + videoUrls.length;
        if (index >= 0 && index < totalMedia) {
            setSelectedMediaIndex(index);
            setIsLightboxVisible(true);
        } else {
            console.warn("Invalid index for lightbox:", index, "Total media:", totalMedia);
        }
    };

    const closeLightbox = () => {
        if (videoRef.current) videoRef.current.pauseAsync();
        setIsLightboxVisible(false);
        setSelectedMediaIndex(0);
    };

    const navigateLightbox = (direction) => {
        const totalMedia = (propertyGallery?.length || 0) + videoUrls.length;
        const newIndex = selectedMediaIndex + direction;
        if (newIndex >= 0 && newIndex < totalMedia) {
            setSelectedMediaIndex(newIndex);
        }
    };

    const getMediaAtIndex = (index) => {
        const totalMedia = (propertyGallery?.length || 0) + videoUrls.length;
        if (index >= 0 && index < totalMedia) {
            const allMedia = [...(propertyGallery || []), ...videoUrls];
            return allMedia[index]?.image || allMedia[index];
        }
        console.warn("Invalid index in getMediaAtIndex:", index, "Total media:", totalMedia);
        return null;
    };

    if (loading) return <ActivityIndicator size="large" color="#8bc83f" style={{ marginTop: 400 }} />;
    if (!propertyData) return <ActivityIndicator size="large" color="#8bc83f" style={{ marginTop: 400 }} />;

    const formatINR = (amount) => {
        if (!amount) return '₹0';
        const num = Number(amount);
        if (num >= 1e7) {
            return '₹' + (num / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
        } else if (num >= 1e5) {
            return '₹' + (num / 1e5).toFixed(2).replace(/\.00$/, '') + ' Lakh';
        }
        return '₹' + num.toLocaleString('en-IN');
    };

    return (
        <View className="pb-24">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-32 bg-white"
                contentContainerStyle={{ paddingBottom: 32, backgroundColor: "white" }}
            >
                <Toast config={toastConfig} position="top" />
                <View className="relative w-full p-2" style={{ height: windowHeight / 2 }}>
                    <Image
                        source={{ uri: propertyThumbnail }}
                        className="size-full"
                        resizeMode="cover"
                        style={{ borderRadius: 50 }}
                    />
                    <View
                        className="z-50 absolute inset-x-8"
                        style={{ top: Platform.OS === "ios" ? 70 : 25 }}
                    >
                        <View className="flex flex-row items-center w-full justify-between">
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="flex flex-row bg-white rounded-full size-11 items-center justify-center"
                            >
                                <Image source={icons.backArrow} className="size-5" />
                            </TouchableOpacity>
                            <View className="flex flex-row items-center gap-3">
                                {propertyData.roleid == loggedinUserId && (
                                    <Text
                                        className={`inline-flex items-center rounded-md capitalize px-2 py-1 text-xs font-rubik ring-1 ring-inset ${propertyData.status === "published"
                                            ? "bg-green-50 text-green-700 ring-green-600/20"
                                            : "bg-red-50 text-red-700 ring-red-600/20"
                                            }`}
                                    >
                                        {propertyData.status}
                                    </Text>
                                )}
                                <TouchableOpacity
                                    onPress={shareProperty}
                                    className="flex flex-row bg-white rounded-full size-11 items-center justify-center"
                                >
                                    <Image source={icons.send} className="size-7" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className="flex flex-row bg-white rounded-full size-11 items-center justify-center"
                                >
                                    <Image source={icons.heart} className="size-7" tintColor="#191D31" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
                <View className="px-5 mt-7 flex gap-2">
                    <Text className="text-2xl font-rubik-medium">{propertyData.property_name}</Text>
                    <View className="flex flex-row items-center justify-between gap-3">
                        <View className="flex flex-row items-center py-2">
                            <Ionicons name="location" size={20} color="#234F68" />
                            <Text className="text-sm font-rubik text-black">{propertyData.city}, {propertyData.address}.</Text>
                        </View>
                        <View className="flex flex-row items-center py-2 px-3 bg-primary-300 rounded-xl">
                            <Text className="text-sm font-rubik text-white">{propertyData.category}</Text>
                        </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="h-15">
                        <View className="flex-row items-center gap-3">
                            <View className="flex-row items-center justify-center bg-primary-100 rounded-full py-4 w-36">
                                <FontAwesome5 name="bed" size={16} color="#8bc83f" />
                                <Text className="text-black-300 text-sm font-rubik-medium ml-2">{propertyData.bedroom} Bedroom</Text>
                            </View>
                            <View className="flex-row items-center justify-center bg-primary-100 rounded-full py-4 w-36">
                                <MaterialCommunityIcons name="floor-plan" size={20} color="#8bc83f" />
                                <Text className="text-black-300 text-sm font-rubik-medium ml-2">{propertyData.floor} Floors</Text>
                            </View>
                            <View className="flex-row items-center justify-center bg-primary-100 rounded-full py-4 w-36">
                                <MaterialCommunityIcons name="bathtub-outline" size={20} color="#8bc83f" />
                                <Text className="text-black-300 text-sm font-rubik-medium ml-2">{propertyData.bathroom} Bathroom</Text>
                            </View>
                            <View className="flex-row items-center justify-center bg-primary-100 rounded-full py-4 w-36">
                                <MaterialIcons name="zoom-out-map" size={20} color="#8bc83f" />
                                <Text className="text-black-300 text-sm font-rubik-medium ml-2">{propertyData.squarefoot} sqft</Text>
                            </View>
                        </View>
                    </ScrollView>
                    {propertyGallery && propertyGallery.length > 0 && (
                        <View className="mt-4 pt-4 border-t border-primary-200">
                            <FlatList
                                data={propertyGallery}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity onPress={() => openLightbox(index)} style={{ width: windowWidth / 2 }}>
                                        <ExpoImage
                                            source={{ uri: item.image }}
                                            style={{ width: windowWidth / 2, height: 150, borderRadius: 20 }}
                                            contentFit="cover"
                                            onError={(error) => console.log("Image load error:", error.nativeEvent.error)}
                                        />
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
                                getItemLayout={(data, index) => ({
                                    length: windowWidth / 2,
                                    offset: (windowWidth / 2) * index,
                                    index,
                                })}
                                initialNumToRender={2}
                                maxToRenderPerBatch={2}
                                windowSize={5}
                            />
                        </View>
                    )}
                    {videoUrls.length > 0 && (
                        <View className="mt-4">
                            <Text className="text-black-300 text-xl font-rubik-bold">Property Videos</Text>
                            <FlatList
                                data={videoUrls}
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(_, index) => `video-${index}`}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity onPress={() => openLightbox(propertyGallery.length + index)} style={{ width: windowWidth }}>
                                        <Image
                                            source={{ uri: item }}
                                            style={{ width: windowWidth, height: 200, borderRadius: 10 }}
                                            resizeMode="cover"
                                        />
                                    </TouchableOpacity>
                                )}
                                contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
                                getItemLayout={(data, index) => ({
                                    length: windowWidth,
                                    offset: windowWidth * index,
                                    index,
                                })}
                            />
                            <View className="flex-row justify-center mt-2">
                                {videoUrls.map((_, index) => (
                                    <View
                                        key={index}
                                        className={`w-2 h-2 rounded-full mx-1 ${selectedMediaIndex === propertyGallery.length + index ? "bg-blue-500" : "bg-gray-300"}`}
                                        style={{ width: 8, height: 8 }}
                                    />
                                ))}
                            </View>
                        </View>
                    )}
                    
                    <View className="flex flex-row items-center justify-between mt-4 bg-primary-100 rounded-3xl p-3 py-5">
                        <View className="flex flex-row items-center">
                            <Image source={images.appfavicon} className="size-14 rounded-full" />
                            <View className="flex flex-col items-start justify-center ml-3">
                                <Text className="text-lg text-primary-300 text-start font-rubik-bold">Agent Name</Text>
                                <Text className="text-sm text-black-200 text-start font-rubik-medium">You are one call away.</Text>
                            </View>
                        </View>
                        <View className="flex flex-row items-center gap-3 pe-3">
                            <TouchableOpacity onPress={() => openWhatsApp("91000000000")}>
                                <FontAwesome5 name="whatsapp" size={24} color="#8bc83f" />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View className="mt-7">
                        <Text className="text-black-300 text-xl font-rubik-bold">Overview</Text>
                        <Text className="text-black-200 text-base font-rubik mt-2">{propertyData.discription}</Text>
                        {propertyData.nearbylocation && (
                            <>
                                <Text className="text-black-300 text-base font-rubik-medium mt-3">Near by Locations:</Text>
                                <Text className="text-black-200 text-base font-rubik mt-2">{propertyData.nearbylocation}</Text>
                            </>
                        )}
                        {propertyData.approxrentalincome && (
                            <Text className="text-black-300 text-center font-rubik-medium mt-2 bg-blue-100 flex-grow p-2 rounded-full">
                                Approx Rental Income: ₹{propertyData.approxrentalincome}
                            </Text>
                        )}
                    </View>
                    {amenities && Array.isArray(amenities) && amenities.length > 0 && (
                        <View className="mt-7">
                            <Text className="text-black-300 text-xl font-rubik-bold">Amenities</Text>
                            <View className="flex flex-row flex-wrap items-start justify-start mt-2 gap-3">
                                {amenities.map((item, index) => (
                                    <View key={index} className="flex items-start">
                                        <View className="px-3 py-2 bg-blue-100 rounded-full flex flex-row items-center justify-center">
                                            <Image source={icons.checkmark} className="size-6 me-2" />
                                            <Text className="text-black-300 text-sm text-center font-rubik-bold capitalize">{item}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    <View className="mt-7">
                        <Text className="text-black-300 text-xl font-rubik-bold">Location</Text>
                        <View className="flex flex-row items-center justify-start my-4 gap-2">
                            <Ionicons name="location-outline" size={22} color="#234F68" />
                            <Text className="text-black-200 text-sm font-rubik-medium">{propertyData.address}.</Text>
                        </View>
                        <View>
                            <MapView
                                style={{ height: 150, borderRadius: 10 }}
                                region={region}
                                initialRegion={region}
                            >
                                {region && (
                                    <Marker
                                        coordinate={{ latitude: parseFloat(coordinates.latitude), longitude: parseFloat(coordinates.longitude) }}
                                    />
                                )}
                            </MapView>
                            <TouchableOpacity
                                onPress={() =>
                                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`)
                                }
                            >
                                <Text className="text-black-300 text-center font-rubik-medium mt-2 bg-blue-100 flex-grow p-2 rounded-full">
                                    View Location
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {Array.isArray(masterPlanDocs) && masterPlanDocs.length > 0 && (
                        <View className="mt-4">
                            <Text className="text-black-300 text-xl font-rubik-bold">Property Master Plan</Text>
                            <View>
                                <MasterPlanList masterPlanDocs={masterPlanDocs} />
                            </View>
                        </View>
                    )}
                    {priceHistoryData && (
                        <View className="mt-4">
                            <View className="">
                                <PriceHistoryChart priceHistoryData={priceHistoryData} />
                            </View>
                        </View>
                    )}
                    <View className="mt-4">
                        <View className="">
                            <MortgageCalculator />
                        </View>
                    </View>
                </View>
            </ScrollView>
            {/* Lightbox Modal */}
            <Modal visible={isLightboxVisible} transparent={true} onRequestClose={closeLightbox} animationType="slide">
                <View
                    ref={lightboxRef}
                    className="flex-1 bg-black/80 justify-center items-center"
                    
                >
                    <TouchableOpacity className="absolute top-10 right-10 z-50" onPress={closeLightbox}>
                        <Ionicons name="close" size={30} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity className="absolute left-10 z-50" onPress={() => navigateLightbox(-1)}>
                        <Ionicons name="chevron-back" size={30} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity className="absolute right-10 z-50" onPress={() => navigateLightbox(1)}>
                        <Ionicons name="chevron-forward" size={30} color="white" />
                    </TouchableOpacity>
                    {getMediaAtIndex(selectedMediaIndex) ? (
                        <>
                            {typeof getMediaAtIndex(selectedMediaIndex) === "string" &&
                            (getMediaAtIndex(selectedMediaIndex).endsWith(".mp4") || getMediaAtIndex(selectedMediaIndex).endsWith(".mov")) ? (
                                <Video
                                    ref={videoRef}
                                    source={{ uri: getMediaAtIndex(selectedMediaIndex) }}
                                    style={{ width: windowWidth * 0.9, height: windowHeight * 0.6, borderRadius: 10 }}
                                    resizeMode="contain"
                                    useNativeControls
                                    onError={(error) => console.log("Video Error:", error)}
                                    onLoad={() => videoRef.current?.playAsync()}
                                />
                            ) : (
                                <ExpoImage
                                    source={{ uri: getMediaAtIndex(selectedMediaIndex) }}
                                    style={{ width: windowWidth * 0.9, height: windowHeight * 0.6, borderRadius: 10 }}
                                    contentFit="contain"
                                    transition={1000}
                                    enablePinchZoom
                                    enablePan={true}
                                    onError={(error) => console.log("Image load error:", error.nativeEvent.error)}
                                />
                            )}
                        </>
                    ) : (
                        <Text className="text-white">No media available</Text>
                    )}
                </View>
            </Modal>
            {/* Bottom Book Now Button */}
            <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-r border-l border-primary-200 px-7 py-4">
                <View className="flex flex-row items-center justify-between gap-10">
                    <View className="flex flex-col items-start">
                        <Text className="text-black-200 text-sm font-rubik-medium">Price</Text>
                        <Text numberOfLines={1} className="text-primary-300 text-start text-2xl font-rubik-bold">
                            {formatINR(propertyData.price)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => handleEnquiry()}
                        className="flex-1 flex flex-row items-center justify-center bg-primary-400 py-5 rounded-2xl shadow-md shadow-zinc-400"
                    >
                        <Text className="text-white text-lg text-center font-rubik-bold">Bid Now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default PropertyDetails;

const styles = StyleSheet.create({});