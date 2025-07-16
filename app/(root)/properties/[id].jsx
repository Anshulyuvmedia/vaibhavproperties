import { FlatList, Image, ScrollView, Text, StyleSheet, TouchableOpacity, View, Dimensions, Platform, ActivityIndicator, Share, Modal, TextInput } from "react-native";
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
import * as Linking from "expo-linking";
import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { Video } from "expo-av";
import RBSheet from "react-native-raw-bottom-sheet";
import { RefreshControl } from "react-native";

const PropertyDetails = () => {
    const propertyId = useLocalSearchParams().id;
    const windowHeight = Dimensions.get("window").height;
    const windowWidth = Dimensions.get("window").width;
    const [propertyData, setPropertyData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [propertyThumbnail, setPropertyThumbnail] = useState(images.avatar);
    const [propertyGallery, setPropertyGallery] = useState([]);
    const [videoUrls, setVideoUrls] = useState([]);
    const [loggedinUserId, setLoggedinUserId] = useState("");
    const [amenities, setAmenities] = useState([]);
    const [priceHistoryData, setPriceHistoryData] = useState([]);
    const [masterPlanDocs, setMasterPlanDocs] = useState([]);
    const [isPdf, setIsPdf] = useState(false);
    const [isLightboxVisible, setIsLightboxVisible] = useState(false);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
    const [bidAmount, setBidAmount] = useState("");
    const [bidError, setBidError] = useState("");
    const [bidStatus, setBidStatus] = useState(null);
    const [brokerData, setBrokerData] = useState(null);
    const videoRef = useRef(null);
    const lightboxRef = useRef(null);
    const rbSheetRef = useRef(null);

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
    const handleEditPress = (id) => router.push(`/dashboard/editproperties/${id}`);

    const openWhatsApp = (phoneNumber) => {
        if (!phoneNumber) {
            setError("Invalid phone number.");
            return;
        }
        const cleanedNumber = phoneNumber.replace(/\D/g, "");
        const url = `whatsapp://send?phone=${cleanedNumber}`;
        Linking.openURL(url).catch(() => {
            setError("WhatsApp is not installed.");
        });
    };

    const handleEnquiry = async () => {
        try {
            setLoading(true);
            setBidStatus(null);
            const parsedUserData = JSON.parse(await AsyncStorage.getItem("userData"));
            const userId = parsedUserData?.id;
            if (!userId) {
                setBidStatus({ type: "error", message: "User not logged in." });
                return;
            }
            const enquiryData = {
                customername: parsedUserData.username || "",
                phone: parsedUserData.mobilenumber || "",
                email: parsedUserData.email || "",
                usercity: parsedUserData.city || "",
                city: propertyData.city || "",
                state: propertyData.address || "",
                propertytype: propertyData.category || "",
                propertyid: propertyId,
                userid: parsedUserData.id,
                brokerid: propertyData.roleid || "",
                bidamount: bidAmount || "",
            };

            const response = await axios.post("https://vaibhavproperties.cigmafeed.in/api/sendenquiry", enquiryData);
            if (response.status === 200 && !response.data.error) {
                setBidStatus({ type: "success", message: "Enquiry submitted successfully!" });
                if (bidAmount && rbSheetRef.current) {
                    setTimeout(() => rbSheetRef.current.close(), 2000);
                }
            } else {
                setBidStatus({ type: "error", message: "Failed to submit enquiry. Please try again." });
            }
        } catch (error) {
            setBidStatus({ type: "error", message: "An error occurred. Please try again." });
        } finally {
            setLoading(false);
        }
    };

    const shareProperty = async () => {
        try {
            const propertyUrl = `https://vaibhavproperties.cigmafeed.in/property-details/${propertyId}`;
            const message = `View my property: ${propertyUrl}`;
            const result = await Share.share({ message, url: propertyUrl, title: "Check out this property!" });
            if (result.action === Share.sharedAction) {
                console.log("Property shared successfully!");
            } else if (result.action === Share.dismissedAction) {
                console.log("Share dismissed.");
            }
        } catch (error) {
            setError("Error sharing property.");
        }
    };

    const fetchPropertyData = async () => {
        try {
            setLoading(true);
            setError(null);
            const parsedUserData = JSON.parse(await AsyncStorage.getItem("userData"));
            setLoggedinUserId(parsedUserData?.id || "");
            const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/property-details/${propertyId}`);
            // console.log("API Response:", response.data); // Debug log
            if (response.data && response.data.details) {
                const apiData = response.data.details;
                setPropertyData(apiData);
                const thumbnail = apiData.thumbnail;
                const thumbnailUri =
                    thumbnail && typeof thumbnail === "string"
                        ? thumbnail.startsWith("http")
                            ? thumbnail
                            : `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Listings/${thumbnail}`
                        : images.avatar;
                // console.log("Thumbnail URI:", thumbnailUri, "Type:", typeof thumbnailUri);
                setPropertyThumbnail(thumbnailUri);

                // Gallery images
                let galleryImages = [];
                try {
                    if (apiData.gallery && typeof apiData.gallery === "string" && apiData.gallery.trim()) {
                        const parsedGallery = JSON.parse(apiData.gallery);
                        galleryImages = Array.isArray(parsedGallery)
                            ? parsedGallery.map((image) => ({
                                id: Math.random().toString(36).substring(2, 11),
                                image:
                                    typeof image === "string" && image.startsWith("http")
                                        ? image
                                        : `https://vaibhavproperties.cigmafeed.in/${image.replace(/\\/g, "/")}` || images.avatar,
                            }))
                            : [];
                    }
                } catch (error) {
                    setError("Error parsing gallery images.");
                    galleryImages = [];
                }
                setPropertyGallery(galleryImages);

                // Videos
                let parsedVideos = [];
                try {
                    parsedVideos = apiData.videos ? (typeof apiData.videos === "string" ? JSON.parse(apiData.videos) : []) : [];
                    parsedVideos = parsedVideos.map((video, index) => ({
                        id: `video-${index}`,
                        url:
                            typeof video === "string" && video.startsWith("http")
                                ? video
                                : `https://vaibhavproperties.cigmafeed.in/${video}` || "",
                        title: `Video ${index + 1}`,
                        thumbnail: images.videoPlaceholder || icons.videofile, // Use a valid image or URL
                    }));
                } catch (error) {
                    setError("Error parsing videos.");
                }
                setVideoUrls(parsedVideos);

                // Amenities
                let parsedAmenities = [];
                try {
                    parsedAmenities = apiData.amenties ? JSON.parse(apiData.amenties) : [];
                } catch (error) {
                    setError("Error parsing amenities.");
                }
                setAmenities(parsedAmenities);

                // Price history
                let priceHistory = [];
                try {
                    priceHistory = apiData.pricehistory ? JSON.parse(apiData.pricehistory) : [];
                } catch (error) {
                    setError("Error parsing price history.");
                }
                setPriceHistoryData(Array.isArray(priceHistory) ? priceHistory : []);

                // Map locations
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
                        setError("Error parsing map locations.");
                    }
                }

                // Master plan documents
                if (apiData.masterplandoc) {
                    const fileUrl = `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Listings/${apiData.masterplandoc}`;
                    setIsPdf(fileUrl.toLowerCase().endsWith(".pdf"));
                    setMasterPlanDocs([fileUrl]);
                } else {
                    setMasterPlanDocs([]);
                }

                // Set broker data
                const brokerDataFromApi = response.data.brokerdata && response.data.brokerdata.length > 0 ? response.data.brokerdata[0] : null;
                setBrokerData(brokerDataFromApi);
                if (!brokerDataFromApi) {
                    console.warn("No broker data available for this property.");
                }
            } else {
                setError("Unexpected API response format or property not found.");
            }
        } catch (error) {
            setError(`Error fetching property data: ${error.message}`);
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPropertyData();
    }, [propertyId]);

    const getProfileImageUri = () => {
        if (!brokerData || !brokerData.profile) return images.avatar; // Fallback if no broker data or profile
        const profile = brokerData.profile;
        const uri =
            profile != null && typeof profile === "number"
                ? `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Users/${profile}.jpg`
                : profile && typeof profile === "string" && profile.startsWith("http")
                    ? profile
                    : profile && typeof profile === "string"
                        ? `https://vaibhavproperties.cigmafeed.in/adminAssets/images/Users/${profile}`
                        : images.avatar;
        // console.log("Profile Image URI:", uri, "Type:", typeof uri);
        return uri;
    };

    const onRefresh = () => {
        setRefreshing(true);
        setError(null);
        fetchPropertyData();
    };

    const openLightbox = (index) => {
        const totalMedia = (propertyGallery?.length || 0) + videoUrls.length;
        if (index >= 0 && index < totalMedia) {
            setSelectedMediaIndex(index);
            setIsLightboxVisible(true);
        }
    };

    const closeLightbox = () => {
        if (videoRef.current) {
            videoRef.current.pauseAsync().catch(() => { });
        }
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
            const media = allMedia[index];
            return media?.image || media?.url || null;
        }
        return null;
    };

    const validateBidAmount = () => {
        const currentPrice = Number(propertyData?.price) || 0;
        const bid = Number(bidAmount);
        const minimumBid = currentPrice * 0.5;
        if (!bidAmount || isNaN(bid) || bid <= 0) {
            setBidError("Please enter a valid bid amount greater than zero.");
            return false;
        }
        if (bid < minimumBid) {
            setBidError(`Bid amount must be at least ${formatINR(minimumBid)}.`);
            return false;
        }
        setBidError("");
        return true;
    };

    const handleBidSubmit = () => {
        if (validateBidAmount()) {
            handleEnquiry();
            setBidAmount("");
        }
    };

    const formatINR = (amount) => {
        if (!amount) return "₹0";
        const num = Number(amount);
        if (num >= 1e7) {
            return "₹" + (num / 1e7).toFixed(2).replace(/\.00$/, "") + " Cr";
        } else if (num >= 1e5) {
            return "₹" + (num / 1e5).toFixed(2).replace(/\.00$/, "") + " Lakh";
        }
        return "₹" + num.toLocaleString("en-IN");
    };

    if (loading || !propertyData) {
        return <ActivityIndicator size="large" color="#8bc83f" style={{ marginTop: 400 }} />;
    }

    return (
        <View className="pb-24">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-32 bg-[#fafafa]"
                contentContainerStyle={{ paddingBottom: 32, backgroundColor: "white" }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#8bc83f"]}
                        tintColor="#8bc83f"
                        progressViewOffset={50}
                    />
                }
            >
                {error && <Text className="text-red-500 text-sm mt-2 px-5">{error}</Text>}
                <View className="relative w-full p-2" style={{ height: windowHeight / 2 }}>
                    <Image
                        source={{ uri: typeof propertyThumbnail === "string" ? propertyThumbnail : images.avatar }}
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
                                <Image
                                    source={typeof icons.backArrow === "string" ? { uri: icons.backArrow } : icons.backArrow}
                                    className="size-5"
                                />
                            </TouchableOpacity>
                            <View className="flex flex-row items-center gap-3">
                                {propertyData.roleid === loggedinUserId && (
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
                                    <Image
                                        source={typeof icons.send === "string" ? { uri: icons.send } : icons.send}
                                        className="size-7"
                                    />
                                </TouchableOpacity>
                                {/* <TouchableOpacity
                                    className="flex flex-row bg-white rounded-full size-11 items-center justify-center"
                                >
                                    <Image
                                        source={typeof icons.heart === "string" ? { uri: icons.heart } : icons.heart}
                                        className="size-7"
                                        tintColor="#191D31"
                                    />
                                </TouchableOpacity> */}
                            </View>
                        </View>
                    </View>
                </View>
                <View className="px-5 mt-7 flex gap-2">
                    <Text className="text-2xl font-rubik-medium capitalize ">{propertyData.property_name}</Text>
                    <View className="flex flex-row items-center justify-between gap-3">
                        <View className="flex flex-row items-center py-2">
                            <Ionicons name="location" size={20} color="#234F68" />
                            <Text className="text-sm font-rubik text-black">
                                {propertyData.city}
                            </Text>
                        </View>
                        <View className="flex flex-row items-center py-2 px-3 bg-primary-300 rounded-xl">
                            <Text className="text-sm font-rubik text-white capitalize">{propertyData.category}</Text>
                        </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="h-15">
                        <View className="flex-row items-center gap-3">
                            <View className="flex-row items-center justify-center bg-primary-100 rounded-full py-4 w-36">
                                <FontAwesome5 name="bed" size={16} color="#8bc83f" />
                                <Text className="text-black-300 text-sm font-rubik-medium ml-2">
                                    {propertyData.bedroom} Bedroom
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-center bg-primary-100 rounded-full py-4 w-36">
                                <MaterialCommunityIcons name="floor-plan" size={20} color="#8bc83f" />
                                <Text className="text-black-300 text-sm font-rubik-medium ml-2">
                                    {propertyData.floor} Floors
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-center bg-primary-100 rounded-full py-4 w-36">
                                <MaterialCommunityIcons name="bathtub-outline" size={20} color="#8bc83f" />
                                <Text className="text-black-300 text-sm font-rubik-medium ml-2">
                                    {propertyData.bathroom} Bathroom
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-center bg-primary-100 rounded-full py-4 w-36">
                                <MaterialIcons name="zoom-out-map" size={20} color="#8bc83f" />
                                <Text className="text-black-300 text-sm font-rubik-medium ml-2">
                                    {propertyData.squarefoot} sqft
                                </Text>
                            </View>
                        </View>
                    </ScrollView>
                    {propertyGallery?.length > 0 && (
                        <View className="mt-4 pt-4 border-t border-primary-200">
                            <FlatList
                                data={propertyGallery}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity onPress={() => openLightbox(index)} style={{ width: windowWidth / 2 }}>
                                        <ExpoImage
                                            source={{ uri: typeof item.image === "string" ? item.image : images.avatar }}
                                            style={{ width: windowWidth / 2, height: 150, borderRadius: 20 }}
                                            contentFit="cover"
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
                                keyExtractor={(item) => item.id}
                                renderItem={({ item, index }) => {
                                    const thumbnailUri =
                                        typeof item.thumbnail === "string"
                                            ? { uri: item.thumbnail }
                                            : icons.videofile; // Fallback to placeholder
                                    // console.log("Video Thumbnail URI:", thumbnailUri.uri || thumbnailUri, "Type:", typeof (thumbnailUri.uri || thumbnailUri));
                                    return (
                                        <TouchableOpacity
                                            onPress={() => openLightbox(propertyGallery.length + index)}
                                            style={{ position: "relative", borderRadius: 10 }}
                                            className="bg-primary-100 px-2"
                                        >
                                            <Image source={thumbnailUri} style={{ width: 75, height: 75 }} resizeMode="cover" />
                                            <Text className="text-black text-sm font-rubik-medium mt-2 text-center">
                                                {item.title}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }}
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
                                        className={`w-2 h-2 rounded-full mx-1 ${selectedMediaIndex === propertyGallery.length + index
                                            ? "bg-blue-500"
                                            : "bg-gray-300"
                                            }`}
                                        style={{ width: 8, height: 8 }}
                                    />
                                ))}
                            </View>
                        </View>
                    )}

                    {brokerData && (
                        <View className="flex flex-row items-center justify-between mt-4 bg-primary-100 rounded-3xl p-3 py-5">
                            <View className="flex flex-row items-center">
                                <Image
                                    source={{ uri: getProfileImageUri() || images.avatar }}
                                    className="size-14 rounded-full"
                                />
                                <View className="flex flex-col items-start justify-center ml-3">
                                    <Text className="text-lg text-primary-300 text-start font-rubik-bold">
                                        {brokerData ? brokerData.username : "Loading..."}
                                    </Text>
                                    <Text className="text-sm text-black-200 text-start font-rubik-medium">
                                        {brokerData ? brokerData.email : ""}
                                    </Text>
                                    <Text className="text-sm text-black-200 text-start font-rubik-medium">
                                        {brokerData ? brokerData.mobilenumber : ""}
                                    </Text>
                                    <Text className="text-sm text-black-200 text-start font-rubik-medium">
                                        {brokerData ? brokerData.company_name : ""}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex flex-row items-center gap-3 pe-3">
                                <TouchableOpacity
                                    onPress={() => brokerData?.mobilenumber && openWhatsApp(brokerData.mobilenumber)}
                                    disabled={!brokerData?.mobilenumber}
                                >
                                    <FontAwesome5
                                        name="whatsapp"
                                        size={24}
                                        color={brokerData?.mobilenumber ? "#8bc83f" : "#ccc"}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    <View className="mt-7">
                        <Text className="text-black-300 text-xl font-rubik-bold">Overview</Text>
                        <Text className="text-black-200 text-base font-rubik my-2">{propertyData.discription}</Text>
                        {propertyData.nearbylocation && (
                            <>
                                <Text className="text-black-300 text-base font-rubik-medium mt-3">Nearby Locations:</Text>
                                <Text className="text-black-200 text-base font-rubik mt-2 capitalize">{propertyData.nearbylocation}</Text>
                            </>
                        )}
                        {propertyData.approxrentalincome && (
                            <Text className="text-black-300 text-center font-rubik-medium mt-2 bg-blue-100 flex-grow p-2 rounded-full">
                                Approx Rental Income: ₹{propertyData.approxrentalincome}
                            </Text>
                        )}
                    </View>
                    {amenities?.length > 0 && (
                        <View className="mt-7">
                            <Text className="text-black-300 text-xl font-rubik-bold">Amenities</Text>
                            <View className="flex flex-row flex-wrap items-start justify-start mt-2 gap-3">
                                {amenities.map((item, index) => (
                                    <View key={index} className="flex items-start">
                                        <View className="px-3 py-2 bg-blue-100 rounded-full flex flex-row items-center justify-center">
                                            <Image
                                                source={typeof icons.checkmark === "string" ? { uri: icons.checkmark } : icons.checkmark}
                                                className="size-6 me-2"
                                            />
                                            <Text className="text-black-300 text-sm text-center font-rubik-bold capitalize">
                                                {item}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    <View className="mt-7">
                        <Text className="text-black-300 text-xl font-rubik-bold">Location</Text>
                        <View className="flex flex-row items-center justify-start my-4 gap-2 me-3">
                            <Ionicons name="location-outline" size={22} color="#234F68" />
                            <Text className="text-black-200 text-sm font-rubik-medium text-wrap">{propertyData.address}.</Text>
                        </View>
                        <View>
                            <MapView style={{ height: 350, borderRadius: 10 }} region={region} initialRegion={region}
                                mapType='hybrid'
                            >
                                {coordinates.latitude && coordinates.longitude && (
                                    <Marker
                                        coordinate={{
                                            latitude: parseFloat(coordinates.latitude),
                                            longitude: parseFloat(coordinates.longitude),
                                        }}
                                    />
                                )}
                            </MapView>
                            <TouchableOpacity
                                onPress={() =>
                                    Linking.openURL(
                                        `https://www.google.com/maps/search/?api=1&query=${coordinates.latitude},${coordinates.longitude}`
                                    )
                                }
                                disabled={!coordinates.latitude || !coordinates.longitude}
                            >
                                <Text
                                    className={`text-black-300 text-center font-rubik-medium mt-2 bg-blue-100 flex-grow p-2 rounded-full ${!coordinates.latitude || !coordinates.longitude ? "opacity-50" : ""
                                        }`}
                                >
                                    View Location
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {masterPlanDocs.length > 0 && (
                        <View className="mt-4">
                            <Text className="text-black-300 text-xl font-rubik-bold">Property Master Plan</Text>
                            <View>
                                <MasterPlanList masterPlanDocs={masterPlanDocs} />
                            </View>
                        </View>
                    )}
                    {priceHistoryData?.length > 0 && (
                        <View className="mt-4">
                            <PriceHistoryChart priceHistoryData={priceHistoryData} />
                        </View>
                    )}
                </View>
            </ScrollView>
            <Modal visible={isLightboxVisible} transparent={true} onRequestClose={closeLightbox} animationType="slide">
                <View ref={lightboxRef} className="flex-1 bg-black/80 justify-center items-center">
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
                                (getMediaAtIndex(selectedMediaIndex).endsWith(".mp4") ||
                                    getMediaAtIndex(selectedMediaIndex).endsWith(".mov")) ? (
                                <Video
                                    ref={videoRef}
                                    source={{ uri: getMediaAtIndex(selectedMediaIndex) }}
                                    style={{ width: windowWidth * 0.9, height: windowHeight * 0.6, borderRadius: 10 }}
                                    resizeMode="contain"
                                    useNativeControls
                                    shouldPlay={true}
                                    isLooping={false}
                                />
                            ) : (
                                <ExpoImage
                                    source={{ uri: getMediaAtIndex(selectedMediaIndex) }}
                                    style={{ width: windowWidth * 0.9, height: windowHeight * 0.6, borderRadius: 10 }}
                                    contentFit="contain"
                                    transition={1000}
                                    enablePinchZoom
                                    enablePan={true}
                                />
                            )}
                        </>
                    ) : (
                        <Text className="text-white">No media available</Text>
                    )}
                </View>
            </Modal>
            <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-r border-l border-primary-200 px-7 py-4">
                <View className="flex flex-row items-center justify-between gap-10">
                    <View className="flex flex-col items-start">
                        <Text className="text-black-200 text-sm font-rubik-medium">Price</Text>
                        <Text numberOfLines={1} className="text-primary-300 text-start text-2xl font-rubik-bold">
                            {formatINR(propertyData.price)}
                        </Text>
                    </View>
                    {propertyData.roleid === loggedinUserId ? (
                        <TouchableOpacity
                            className="flex-1 flex-row items-center justify-center bg-primary-300 py-5 rounded-2xl shadow-md shadow-zinc-400"
                            onPress={() => handleEditPress(propertyData.id)}
                        >
                            <Text className="text-white text-lg text-center font-rubik-bold">Edit Property</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => rbSheetRef.current.open()}
                            className="flex-1 flex-row items-center justify-center bg-primary-400 py-5 rounded-2xl shadow-md shadow-zinc-400"
                        >
                            <Text className="text-white text-lg text-center font-rubik-bold">Bid Now</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <RBSheet
                ref={rbSheetRef}
                closeOnDragDown={true}
                closeOnPressMask={true}
                height={windowHeight * 0.4}
                customStyles={{
                    container: {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 20,
                        backgroundColor: "white",
                    },
                    draggableIcon: {
                        backgroundColor: "#8bc83f",
                    },
                }}
            >
                <View className="flex-1">
                    <Text className="text-black-300 text-xl font-rubik-bold mb-4">Place Your Bid</Text>
                    <View className="mb-4">
                        <Text className="text-black-200 text-sm font-rubik-medium">Current Price</Text>
                        <Text className="text-primary-300 text-lg font-rubik-bold">{formatINR(propertyData.price)}</Text>
                    </View>
                    <View className="mb-4">
                        <Text className="text-black-200 text-sm font-rubik-medium">Your Bid Amount</Text>
                        <TextInput
                            value={bidAmount}
                            onChangeText={(text) => {
                                setBidAmount(text);
                                setBidError("");
                                setBidStatus(null);
                            }}
                            placeholder="Enter bid amount"
                            keyboardType="numeric"
                            className="border border-primary-200 rounded-lg p-3 mt-2 text-black-300 text-base font-rubik"
                        />
                        {bidError && <Text className="text-red-500 text-sm mt-1">{bidError}</Text>}
                        {bidStatus && (
                            <Text
                                className={`text-sm mt-1 font-rubik-medium ${bidStatus.type === "success" ? "text-green-500" : "text-red-500"
                                    }`}
                            >
                                {bidStatus.message}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={handleBidSubmit}
                        disabled={loading}
                        className={`flex flex-row items-center justify-center bg-primary-400 py-4 rounded-2xl ${loading ? "opacity-50" : ""
                            }`}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-lg text-center font-rubik-bold">Submit Bid</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </RBSheet>
        </View>
    );
};

export default PropertyDetails;

const styles = StyleSheet.create({});