import { Image, StyleSheet, Text, ScrollView, TouchableOpacity, View, TextInput, FlatList, Platform, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import icons from '@/constants/icons';
import { ProgressSteps, ProgressStep } from 'react-native-progress-steps';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { Link, router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Constants from "expo-constants";
import 'react-native-get-random-values';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import Toast, { BaseToast } from 'react-native-toast-message';

const Editproperty = () => {
    const { id } = useLocalSearchParams();

    const GOOGLE_MAPS_API_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
    const [step1Data, setStep1Data] = useState({ property_name: '', description: '', nearbylocation: '', });
    const [step2Data, setStep2Data] = useState({ approxrentalincome: '', historydate: [], price: '' });
    const [step3Data, setStep3Data] = useState({ sqfoot: '', bathroom: '', floor: '', city: '', officeaddress: '', bedroom: '' });
    const [isValid, setIsValid] = useState(false);
    const navigation = useNavigation();

    const [propertyData, setPropertyData] = useState([]);
    const [propertyDocuments, setPropertyDocuments] = useState([]);
    const [masterPlanDoc, setMasterPlanDoc] = useState([]);
    const [errors, setErrors] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("unpublished");
    const [mainImage, setMainImage] = useState(null);

    const [videos, setVideos] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);

    const [loading, setLoading] = useState(false);
    const [amenity, setAmenity] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [region, setRegion] = useState({
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
    });
    const [coordinates, setCoordinates] = useState({
        latitude: "",
        longitude: "",
    });
    const [fullAddress, setFullAddress] = useState("");

    const [show, setShow] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [historyPrice, setHistoryPrice] = useState('');
    const buttonPreviousTextStyle = {
        paddingInline: 20,
        paddingBlock: 5,
        borderRadius: 10,
        backgroundColor: '#ff938f',
        color: 'black',
    };
    const buttonNextTextStyle = {
        paddingInline: 20,
        paddingBlock: 5,
        borderRadius: 10,
        backgroundColor: 'lightgreen',
        color: 'black',
    };
    const categories = [
        { label: 'Apartment', value: 'Apartment' },
        { label: 'Villa', value: 'Villa' },
        { label: 'Penthouse', value: 'Penthouse' },
        { label: 'Residences', value: 'Residences' },
        { label: 'Luxury House', value: 'Luxury House' },
        { label: 'Bunglow', value: 'Bunglow' },
    ];
    const status = [
        { label: 'Unpublished', value: 'unpublished' },
    ];
    const toastConfig = {
        success: (props) => (
            <BaseToast
                {...props}
                style={{ borderLeftColor: "green" }}
                text1Style={{
                    fontSize: 16,
                    fontWeight: "bold",
                }}
                text2Style={{
                    fontSize: 14,
                }}
            />
        ),
        error: (props) => (
            <BaseToast
                {...props}
                style={{ borderLeftColor: "red" }}
                text1Style={{
                    fontSize: 16,
                    fontWeight: "bold",
                }}
                text2Style={{
                    fontSize: 14,
                }}
            />
        ),
    };

    const [visibleData, setVisibleData] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(10);

    // Update visibleData when historydate updates
    useEffect(() => {
        if (step2Data.historydate.length > 0) {
            setVisibleData(step2Data.historydate.slice(0, 10));
        }
    }, [step2Data.historydate]);

    const loadMore = () => {
        const nextIndex = currentIndex + 10;
        setVisibleData(step2Data.historydate.slice(0, nextIndex));
        setCurrentIndex(nextIndex);
    };


    const validateStep = (step) => {
        if (step === 1) {
            return step1Data?.property_name && step1Data?.description && step1Data?.nearbylocation;
        }
        if (step === 2) {
            return step3Data?.sqfoot && step3Data?.bathroom && step3Data?.floor && step3Data?.city;
        }
        return true;
    };

    const onNextStep = (step) => {
        if (!validateStep(step)) {
            setErrors(true);
            Toast.show({
                type: 'error',
                text1: 'Validation Error',
                text2: "Please fill all required fields.",
            });
        } else {
            setErrors(false);
        }
    };

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: "Sorry, we need camera roll permissions to make this work!",
            });
            return false;
        }
        return true;
    };

    const handleAddAmenity = () => {
        if (amenity.trim() !== '') {
            setAmenities([...amenities, amenity.trim()]);
            setAmenity('');
        }
    };

    const pickMainImage = async () => {
        if (!(await requestPermissions())) return;
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result?.canceled) {
            setMainImage(result.assets[0].uri);
        }
    };


    // Handle Date Change
    const handleDateChange = (event, date) => {
        setShow(false);
        if (date) {
            const formattedDate = date.toLocaleDateString("en-GB"); // Convert to YYYY-MM-DD
            setSelectedDate(formattedDate);
        }
    };

    // Add Price History Entry
    const formatDate = (dateString) => {
        const [day, month, year] = dateString.split("/");  // Split DD/MM/YYYY
        return `${year}-${month}-${day}`;  // Convert to YYYY-MM-DD
    };

    const addPriceHistory = () => {
        if (selectedDate && historyPrice) {
            const newHistoryEntry = {
                dateValue: formatDate(selectedDate),  // Convert date format
                priceValue: historyPrice
            };

            setStep2Data((prevData) => {
                const updatedHistory = [newHistoryEntry, ...prevData.historydate]; // Add new entry at the top
                return { ...prevData, historydate: updatedHistory };
            });

            setSelectedDate('');
            setHistoryPrice('');
        }
    };

    const removePriceHistory = (index) => {
        setStep2Data((prevData) => {
            const updatedHistory = prevData.historydate.filter((_, i) => i !== index);
            return { ...prevData, historydate: updatedHistory };
        });

        // Update visible data after removal
        setVisibleData((prevData) => prevData.filter((_, i) => i !== index));
    };

    const pickGalleryImages = async () => {
        if (!(await requestPermissions())) return;

        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.5,
            });

            // console.log("🚀 Image Picker Result:", result); // Debugging log

            if (!result.canceled && result.assets?.length) {
                // Extract only the URI (ensuring no extra object nesting)
                const selectedImages = result.assets.map(image => image.uri);

                // console.log("✅ Processed Image URIs:", selectedImages);

                // Ensure state only stores an array of URIs (not objects)
                setGalleryImages(prevImages => [
                    ...prevImages,
                    ...selectedImages,
                ]);
            } else {
                console.warn("⚠️ No images selected.");
            }
        } catch (error) {
            console.error("❌ Error picking images:", error);
        }
    };

    const pickVideo = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsMultipleSelection: true,
        });

        if (!result.canceled) {
            // console.log("Selected Videos:", result.assets);

            const defaultThumbnail =
                typeof icons.videofile === "number" // If it's a local import
                    ? Image.resolveAssetSource(icons.videofile).uri
                    : icons.videofile; // If it's a URL or valid string

            const selectedVideos = result.assets.map(video => ({
                id: video.uri,
                uri: video.uri,
                thumbnailImages: defaultThumbnail, // ✅ Make sure this is correct
            }));

            // console.log("Processed Videos:", selectedVideos);
            setVideos(prevVideos => [...new Set([...prevVideos, ...selectedVideos])]);
        }
    };

    const pickDocument = async () => {
        let result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            multiple: true, // Enable multiple selection
        });

        if (result.canceled) return;

        const selectedDocuments = Array.isArray(result.assets) ? result.assets : [result];

        const newDocuments = selectedDocuments.map(doc => ({
            uri: doc.uri,
            name: doc.name || 'Unnamed Document',
            thumbnail: 'https://cdn-icons-png.flaticon.com/512/337/337946.png', // PDF icon
        }));

        setPropertyDocuments(prevDocs => [...prevDocs, ...newDocuments]);
    };

    const pickMasterPlan = async () => {
        let result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'], // Allow PDFs and images
            multiple: true,
        });

        if (result.canceled) return;

        const selectedDocuments = Array.isArray(result.assets) ? result.assets : [result];

        const newDocuments = selectedDocuments.map(doc => ({
            uri: doc.uri,
            name: doc.name || 'Unnamed Document',
            thumbnail: doc.mimeType.startsWith('image') ? doc.uri : 'https://cdn-icons-png.flaticon.com/512/337/337946.png', // Image preview or PDF icon
        }));

        setMasterPlanDoc(prevDocs => [...prevDocs, ...newDocuments]);
    };

    // Function to handle location selection from Google Places
    const handlePlaceSelect = (data, details = null) => {
        if (details?.geometry?.location) {
            const { lat, lng } = details.geometry.location;
            setFullAddress(details.formatted_address);
            setRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
            });

            // Store selected coordinates
            setCoordinates({
                latitude: parseFloat(lat) ?? 0,  // Ensure it's a number
                longitude: parseFloat(lng) ?? 0,
            });

        }
    };

    const removeGalleryImage = async (index, imageUri) => {
        setGalleryImages(prevImages => prevImages.filter((_, i) => i !== index));

        if (imageUri.startsWith("http")) {
            try {
                await axios.post("https://investorlands.com/api/deletefile", {
                    property_id: propertyData.id,
                    file_type: "gallery",
                    file_path: imageUri.replace("https://investorlands.com/", ""),
                });
                Toast.show({ type: "success", text1: "Image deleted successfully." });
            } catch (error) {
                console.error("Failed to delete image:", error);
            }
        }
    };

    const removeVideo = async (index, videoUri) => {
        console.log("Removing video at index:", index, "Video URI:", videoUri);

        // Update UI first
        setVideos(prevVideos => prevVideos.filter((_, i) => i !== index));

        if (videoUri.startsWith("http")) {
            try {
                const response = await axios.post("https://investorlands.com/api/deletefile", {
                    property_id: propertyData.id,
                    file_type: "video",
                    file_path: videoUri.replace("https://investorlands.com/", ""),
                });

                console.log("Server Response:", response.data);

                if (response.data.error) {
                    console.error("Error from API:", response.data.message);
                    Toast.show({ type: "error", text1: response.data.message });
                } else {
                    console.log("Deleted video successfully:", videoUri);
                    Toast.show({ type: "success", text1: "Video deleted successfully." });
                }
            } catch (error) {
                console.error("Failed to delete video:", error.response ? error.response.data : error.message);
            }
        }
    };


    const removeDocument = async (index, docUri) => {
        setPropertyDocuments(prevDocs => prevDocs.filter((_, i) => i !== index));

        if (docUri.startsWith("http")) {
            try {
                await axios.post("https://investorlands.com/api/deletefile", {
                    property_id: propertyData.id,
                    file_type: "document",
                    file_path: docUri.replace("https://investorlands.com/", ""),
                });
                Toast.show({ type: "success", text1: "Document deleted successfully." });
            } catch (error) {
                console.error("Failed to delete document:", error);
            }
        }
    };

    const removeMasterPlan = async (index, docUri) => {
        setMasterPlanDoc(prevDocs => prevDocs.filter((_, i) => i !== index));

        if (docUri.startsWith("http")) {
            try {
                await axios.post("https://investorlands.com/api/deletefile", {
                    property_id: propertyData.id,
                    file_type: "masterplan",
                    file_path: docUri.replace("https://investorlands.com/", ""),
                });
                Toast.show({ type: "success", text1: "Master Plan Document deleted successfully." });
            } catch (error) {
                console.error("Failed to delete master plan document:", error);
            }
        }
    };

    // Function to handle manual selection on the map
    const handleMapPress = (e) => {
        if (!e?.nativeEvent?.coordinate) return;
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
        });

        // Store manual coordinates
        setCoordinates({
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
        });

    };

    const getUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem('userData');
            const userToken = await AsyncStorage.getItem('userToken');

            return {
                userData: userData ? JSON.parse(userData) : null,
                userToken: userToken ? userToken : null
            };
        } catch (error) {
            console.error("Error fetching user data:", error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: "Could not retrieve user data.",
            });
            return null;
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { userData, userToken } = await getUserData();
            if (!userData || !userToken) {
                throw new Error("User is not authenticated. Token missing.");
            }
            const propertyId = propertyData?.id ?? id; // Ensure property ID is used
            const { id, user_type } = userData;

            const formData = new FormData();

            // ✅ Append Step 1, 2, and 3 Data
            [step1Data, step2Data, step3Data].forEach(data => {
                Object.entries(data).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formData.append(key, value);
                    }
                });
            });

            // ✅ Append additional fields
            formData.append("bedroom", step3Data?.bedroom ?? "");
            formData.append("category", selectedCategory ?? "");
            formData.append("status", selectedStatus ?? "");
            formData.append("roleid", id ?? "");
            formData.append("usertype", user_type ?? "");
            formData.append("amenities", JSON.stringify(amenities));
            formData.append("historydate", step2Data?.historydate ? JSON.stringify(step2Data.historydate) : "[]");

            // ✅ Append Location Data
            formData.append("location", JSON.stringify({
                Latitude: coordinates.latitude,
                Longitude: coordinates.longitude,
            }));

            // ✅ Append Thumbnail Image
            if (mainImage && !mainImage.startsWith("http")) {
                const fileType = mainImage.split('.').pop();
                formData.append("thumbnailImages", {
                    uri: mainImage,
                    name: `thumbnail.${fileType}`,
                    type: `image/${fileType}`,
                });
            }

            // ✅ Append Gallery Images
            galleryImages.forEach((imageUri, index) => {
                if (!imageUri.startsWith("http")) {
                    const fileType = imageUri.split('.').pop();
                    formData.append(`galleryImages[${index}]`, {
                        uri: imageUri,
                        type: `image/${fileType}`,
                        name: `gallery-${index}.${fileType}`,
                    });
                }
            });

            // ✅ Append Videos
            videos.forEach((video, index) => {
                if (video?.uri && !video.uri.startsWith("http")) {
                    const fileType = video.uri.split('.').pop();
                    formData.append(`propertyvideos[${index}]`, {
                        uri: video.uri,
                        type: video.type || `video/${fileType}`,
                        name: `video-${index}.${fileType}`,
                    });
                }
            });

            // ✅ Append Documents
            propertyDocuments.forEach((doc, index) => {
                if (doc?.uri && !doc.uri.startsWith("http")) {
                    const fileType = doc.uri.split('.').pop();
                    formData.append(`documents[${index}]`, {
                        uri: doc.uri,
                        type: `application/${fileType}`,
                        name: `document-${index}.${fileType}`,
                    });
                }
            });

            // ✅ Append Master Plan Document
            masterPlanDoc.forEach((doc, index) => {
                if (doc?.uri && !doc.uri.startsWith("http")) {
                    const fileType = doc.uri.split('.').pop()?.toLowerCase() || "pdf";
                    formData.append("masterplandocument", {
                        uri: doc.uri,
                        type: fileType === "pdf" ? "application/pdf" : `image/${fileType}`,
                        name: `masterplan-${index}.${fileType}`,
                    });
                }
            });

            // ✅ File Data Object for Reference
            const fileData = {
                galleryImages: galleryImages.filter(img => !img.startsWith("http")),
                propertyvideos: videos.filter(vid => vid.uri && !vid.uri.startsWith("http")),
                thumbnailImages: mainImage && !mainImage.startsWith("http") ? [mainImage] : [],
                documents: propertyDocuments.filter(doc => doc.uri && !doc.uri.startsWith("http")),
                masterplandocument: masterPlanDoc.filter(doc => doc.uri && !doc.uri.startsWith("http")),
            };
            formData.append("fileData", JSON.stringify(fileData));

            // console.log("Uploading FormData:", formData);

            // ✅ Send API Request
            const response = await axios.post(`https://investorlands.com/api/updatelisting/${propertyId}`, formData, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "multipart/form-data; charset=utf-8",
                    "Authorization": `Bearer ${userToken}`
                },
            });

            // console.log("API Response:", response.data);
            if (response.status === 200 && !response.data.error) {
                Toast.show({
                    type: "success",
                    text1: "Success",
                    text2: "Property updated successfully!",
                });
            } else {
                console.error("❌ API Error:", response.data.message);
                Toast.show({
                    type: "error",
                    text1: "Failed to update property.",
                    text2: response.data.message || "An error occurred.",
                });
            }
        } catch (error) {
            console.error("❌ Error updating property:", error);
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to update property. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };


    // Fetch Property Data
    const fetchPropertyData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`https://investorlands.com/api/property-details/${id}`);
            // console.log(response.data);
            if (response.data) {
                const apiData = response.data.details;
                setPropertyData(apiData);

                setStep1Data({
                    property_name: apiData.property_name || '',
                    description: apiData.discription || '',
                    nearbylocation: apiData.nearbylocation || '',
                });

                setStep2Data({
                    approxrentalincome: apiData.approxrentalincome || '',
                    historydate: apiData.historydate || '',
                    price: apiData.price || '',
                });

                setStep3Data({
                    sqfoot: apiData.squarefoot || '',
                    bathroom: apiData.bathroom || '',
                    bedroom: apiData.bedroom || '',
                    floor: apiData.floor || '',
                    city: apiData.city || '',
                    officeaddress: apiData.address || '',
                });

                setSelectedCategory(apiData.category || '');
                setSelectedStatus(apiData.status || '');

                const fetchedAmenities = apiData.amenties || apiData.amenities || [];

                // Ensure it's a proper array
                let parsedAmenities = fetchedAmenities;

                if (typeof fetchedAmenities === "string") {
                    try {
                        parsedAmenities = JSON.parse(fetchedAmenities);
                    } catch (error) {
                        console.error("Error parsing amenities:", error);
                        parsedAmenities = []; // Default to empty array
                    }
                }

                if (Array.isArray(parsedAmenities)) {
                    // console.log("Final Amenities from API:", parsedAmenities);
                    setAmenities([...parsedAmenities]);
                } else {
                    console.error("Invalid amenities format:", parsedAmenities);
                }

                // Extract map location and convert to numbers
                if (apiData.maplocations) {
                    try {
                        const locationData = JSON.parse(apiData.maplocations);
                        // console.log("locationData:", locationData);
                        const latitude = parseFloat(locationData.Latitude);
                        const longitude = parseFloat(locationData.Longitude);

                        if (latitude && longitude) {
                            // Update state
                            setCoordinates({ latitude, longitude });
                            setRegion({
                                latitude,
                                longitude,
                                latitudeDelta: 0.015,
                                longitudeDelta: 0.0121,
                            });

                        } else {
                            console.error("Invalid latitude or longitude values.");
                        }
                    } catch (error) {
                        console.error("Error parsing map locations:", error);
                    }
                }

                if (apiData.gallery) {
                    try {
                        let galleryArray = typeof apiData.gallery === 'string' ? JSON.parse(apiData.gallery) : apiData.gallery;

                        const galleryImages = galleryArray.map(img =>
                            img.startsWith('http') ? img : `https://investorlands.com/${img}`
                        );

                        setGalleryImages(galleryImages);
                    } catch (error) {
                        console.error("Error processing gallery images:", error);
                    }
                }

                if (apiData.videos) {
                    try {
                        let galleryVideos = typeof apiData.videos === 'string' ? JSON.parse(apiData.videos) : apiData.videos;

                        const defaultThumbnail =
                            typeof icons.videofile === "number"
                                ? Image.resolveAssetSource(icons.videofile).uri
                                : icons.videofile; // Fallback to a local or external thumbnail

                        const videoObjects = galleryVideos.map(video => ({
                            id: video,
                            uri: video.startsWith('http') ? video : `https://investorlands.com/${video}`,
                            thumbnailImages: defaultThumbnail, // ✅ Assigning default thumbnail
                        }));

                        setVideos(videoObjects);
                    } catch (error) {
                        console.error("Error processing videos:", error);
                    }
                }


                if (apiData.documents) {
                    try {
                        let propertyDocuments = typeof apiData.documents === 'string'
                            ? JSON.parse(apiData.documents)
                            : apiData.documents;

                        setPropertyDocuments(
                            propertyDocuments.map(uri => ({
                                uri: uri.startsWith('http') ? uri : `https://investorlands.com/${uri}`,
                                name: uri.split('/').pop() || 'Unnamed Document',
                                thumbnail: 'https://cdn-icons-png.flaticon.com/512/337/337946.png', // Default PDF icon
                            }))
                        );
                    } catch (error) {
                        console.error("Error processing documents:", error);
                    }
                }


                if (apiData.masterplandoc) {
                    try {
                        let masterPlanDocs = Array.isArray(apiData.masterplandoc)
                            ? apiData.masterplandoc
                            : [apiData.masterplandoc]; // Convert single string to array

                        setMasterPlanDoc(
                            masterPlanDocs.map(filePath => ({
                                uri: filePath.startsWith('http') ? filePath : `https://investorlands.com/${filePath}`,
                                name: filePath.split('/').pop() || 'Unnamed Document',
                                thumbnail: filePath.endsWith('.pdf')
                                    ? 'https://cdn-icons-png.flaticon.com/512/337/337946.png'  // PDF icon for PDFs
                                    : `https://investorlands.com/${filePath}`, // Show image preview for images
                            }))
                        );
                    } catch (error) {
                        console.error("Error processing masterplandoc:", error);
                    }
                }

                // Process API data
                let priceHistoryData = apiData.pricehistory;

                // Parse if it's a string
                if (typeof priceHistoryData === "string") {
                    try {
                        priceHistoryData = JSON.parse(priceHistoryData);
                    } catch (error) {
                        console.error("Error parsing pricehistory:", error);
                        priceHistoryData = [];
                    }
                }

                // Ensure it's an array before updating state
                if (Array.isArray(priceHistoryData)) {
                    // Sort in descending order (most recent date first)
                    priceHistoryData.sort((a, b) => new Date(b.dateValue) - new Date(a.dateValue));

                    setStep2Data((prevData) => ({
                        ...prevData,
                        historydate: priceHistoryData.map(item => ({
                            dateValue: item.dateValue,
                            priceValue: item.priceValue.toString(),
                        })),
                    }));
                } else {
                    console.error("priceHistoryData is not an array:", priceHistoryData);
                }




                if (apiData.thumbnail) {
                    setMainImage(
                        apiData.thumbnail.startsWith('http')
                            ? apiData.thumbnail
                            : `https://investorlands.com/assets/images/Listings/${apiData.thumbnail}`
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching property data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchPropertyData();
        }
    }, [id]);

    if (loading) {
        return (
            <ActivityIndicator size="large" color="#8a4c00" style={{ marginTop: 400 }} />
        );
    }

    if (!propertyData) {
        return (
            <ActivityIndicator size="large" color="#8a4c00" style={{ marginTop: 400 }} />
        );
    }

    return (
        <SafeAreaView style={{ backgroundColor: 'white', height: '100%', paddingHorizontal: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', backgroundColor: '#E0E0E0', borderRadius: 50, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, marginRight: 10, textAlign: 'center', fontFamily: 'Rubik-Medium', color: '#4A4A4A' }}>
                    Edit My Property
                </Text>
                <TouchableOpacity onPress={() => router.push('/notifications')}>
                    <Image source={icons.bell} className='size-6' />
                </TouchableOpacity>
            </View>

            <View className="flex justify-between items-center pt-3 flex-row">
                <Text className="font-rubik-bold text-lg">{step1Data.property_name}</Text>
                <Text className={`inline-flex items-center rounded-md capitalize px-2 py-1 text-xs font-rubik-bold border ${selectedStatus === 'published' ? ' bg-green-50  text-green-700  border-green-600 ' : 'bg-red-50  text-red-700 border-red-600'}`}>{selectedStatus === 'published' ? 'Published' : 'Under Review'}</Text>
            </View>
            <Toast config={toastConfig} position="top" />

            <View style={styles.container}>
                <ProgressSteps>
                    <ProgressStep label="General"
                        nextBtnTextStyle={buttonNextTextStyle}
                    // onNext={() => onNextStep(1)}
                    // errors={errors}
                    >
                        <View style={styles.stepContent}>

                            {/* enter property name */}
                            <Text style={styles.label}>Property Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter property name"
                                value={step1Data.property_name}
                                onChangeText={text => setStep1Data({ ...step1Data, property_name: text })}
                            />



                            {/* enter description */}
                            <Text style={styles.label}>Property Description</Text>
                            <TextInput
                                style={styles.textarea}
                                value={step1Data.description}
                                onChangeText={text => setStep1Data({ ...step1Data, description: text })} maxLength={120}
                                placeholder="Enter property description"
                                multiline numberOfLines={5}
                            />

                            {/* enter thumbnail */}
                            <Text style={styles.label}>Property Thumbnail</Text>
                            <View className="flex flex-row">
                                <TouchableOpacity onPress={pickMainImage} style={styles.dropbox}>
                                    <Text style={{ textAlign: 'center' }}>Pick an image from gallery</Text>
                                </TouchableOpacity>
                                {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}
                            </View>

                            {/* select category */}
                            <Text style={styles.label}>Select category</Text>
                            <View style={styles.pickerContainer}>
                                <RNPickerSelect
                                    onValueChange={(value) => setSelectedCategory(value)}
                                    items={categories}
                                    value={selectedCategory}
                                    style={pickerSelectStyles}
                                    placeholder={{ label: 'Choose an option...', value: null }}
                                />
                            </View>

                            {/* enter near by location */}
                            <Text style={styles.label}>Near By Location</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter near by location"
                                value={step1Data.nearbylocation}
                                onChangeText={text => setStep1Data({ ...step1Data, nearbylocation: text })}
                            />


                        </View>
                    </ProgressStep>

                    <ProgressStep label="Price"
                        nextBtnTextStyle={buttonNextTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}
                    // onNext={() => onNextStep(2)}
                    // errors={errors}
                    >
                        <View>
                            <Text style={{ textAlign: 'center', fontFamily: 'Rubik-Bold' }}>Pricing & Other Details</Text>
                        </View>

                        <View style={styles.stepContent}>
                            {/* enter rental income */}
                            <Text style={styles.label}>Approx Rental Income</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="Enter approx rental income"
                                value={step2Data.approxrentalincome}
                                onChangeText={text => {
                                    const numericText = text.replace(/[^0-9]/g, '');
                                    setStep2Data(prevState => ({ ...prevState, approxrentalincome: numericText }));
                                }}
                            />


                            <Text style={styles.label}>Current Property Price</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="Enter current price"
                                value={step2Data.price}
                                onChangeText={text => {
                                    const numericText = text.replace(/[^0-9]/g, '');
                                    setStep2Data(prevState => ({ ...prevState, price: numericText }));
                                }}
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, marginRight: 10 }}>

                                    {/* enter property price */}
                                    <Text style={styles.label}>Historical Price</Text>

                                    {/* Enter Price */}
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Historical Price"
                                        value={historyPrice}
                                        keyboardType="numeric"
                                        onChangeText={(text) => {
                                            const numericText = text.replace(/[^0-9]/g, '');
                                            setHistoryPrice(numericText);
                                        }}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>

                                    {/* Select Date */}
                                    <Text style={styles.label}>Historical Date</Text>
                                    <TouchableOpacity onPress={() => setShow(true)}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="DD-MM-YYYY"
                                            value={selectedDate}
                                            editable={false}
                                        />
                                    </TouchableOpacity>

                                    {show && (
                                        <DateTimePicker
                                            value={new Date()}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                                            onChange={handleDateChange}
                                        />
                                    )}
                                </View>
                            </View>

                            {/* Add to Price History */}
                            <TouchableOpacity style={styles.addButton} onPress={addPriceHistory}>
                                <Text style={styles.addButtonText}>Add to Table</Text>
                            </TouchableOpacity>

                            {/* Show Table */}
                            {step2Data.historydate.length > 0 && (
                                <View style={{ flexGrow: 1, minHeight: 1, marginTop: 10 }}>
                                    <FlatList
                                        data={visibleData}
                                        keyExtractor={(item, index) => index.toString()}
                                        nestedScrollEnabled={true}
                                        contentContainerStyle={{
                                            flexGrow: 1,
                                            borderWidth: 1,
                                            borderColor: '#c7c7c7',
                                            borderRadius: 10,
                                        }}
                                        ListHeaderComponent={
                                            <Text className="text-center font-rubik-bold my-2 border-b border-gray-300">
                                                Price Data for Graph
                                            </Text>
                                        }
                                        renderItem={({ item, index }) => (
                                            <View style={styles.tableRow}>
                                                <Text style={styles.tableCell}>
                                                    Rs. {parseInt(item.priceValue).toLocaleString()}
                                                </Text>
                                                <Text style={styles.tableCell}>{item.dateValue}</Text>
                                                <TouchableOpacity onPress={() => removePriceHistory(index)}>
                                                    <Text style={styles.removeBtn}>❌</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    />

                                    {currentIndex < step2Data.historydate.length && (
                                        <TouchableOpacity onPress={loadMore} style={styles.addButton}>
                                            <Text style={styles.addButtonText}>View More</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}

                        </View>
                    </ProgressStep>

                    <ProgressStep label="Details"
                        nextBtnTextStyle={buttonNextTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}
                    // onNext={() => onNextStep(3)}
                    // errors={errors}
                    >

                        <View style={styles.stepContent}>

                            {/* enter amenities */}
                            <View className='flex flex-row items-center'>

                                <Text style={styles.label}>Features & Amenities</Text>
                            </View>
                            <View className='flex flex-row align-center'>
                                <View className='flex-grow'>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter to Add Amenities"
                                        value={amenity}
                                        onChangeText={setAmenity}
                                        onSubmitEditing={handleAddAmenity} // Adds item on Enter key press
                                    />
                                </View>
                                <TouchableOpacity onPress={() => handleAddAmenity()}>
                                    <Image
                                        source={icons.addicon}
                                        style={styles.addBtn}
                                    />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", minHeight: 50 }}>
                                <FlatList
                                    data={amenities}
                                    keyExtractor={(item, index) => index.toString()}
                                    horizontal
                                    nestedScrollEnabled
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ flexDirection: "row", alignItems: "center" }}
                                    renderItem={({ item }) => (
                                        <View style={styles.amenityItem}>
                                            <Text className="font-rubik-bold px-2 capitalize text-nowrap text-green-600">{item}</Text>
                                            <TouchableOpacity onPress={() => setAmenities(amenities.filter(a => a !== item))}>
                                                <Text style={styles.removeBtn}>❌</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            </View>



                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                {/* enter squre foot area */}
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <Text style={styles.label}>Square Foot</Text>
                                    <TextInput style={styles.input} placeholder="Square Foot" keyboardType="numeric" value={step3Data.sqfoot} onChangeText={text => setStep3Data({ ...step3Data, sqfoot: text })} />
                                </View>

                                {/* enter number of bathrooms */}
                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <Text style={styles.label}>Bathroom</Text>
                                    <TextInput style={styles.input} placeholder="Bathroom" keyboardType="numeric" value={step3Data.bathroom} onChangeText={text => setStep3Data({ ...step3Data, bathroom: text })} />
                                </View>
                                {/* enter number of bathrooms */}

                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <Text style={styles.label}>Bedroom</Text>
                                    <TextInput style={styles.input} placeholder="bedrooms" keyboardType="numeric" value={step3Data.bedroom} onChangeText={text => setStep3Data({ ...step3Data, bedroom: text })} />
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                {/* enter number of floors */}
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <Text style={styles.label}>Floor</Text>
                                    <TextInput style={styles.input} placeholder="Floor" keyboardType="numeric" value={step3Data.floor} onChangeText={text => setStep3Data({ ...step3Data, floor: text })} />
                                </View>

                                {/* enter property city */}
                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <Text style={styles.label}>City</Text>
                                    <TextInput style={styles.input} placeholder="Enter City" value={step3Data.city} onChangeText={text => setStep3Data({ ...step3Data, city: text })} />
                                </View>
                            </View>

                            {/* enter property address */}
                            <Text style={styles.label}>Property Address</Text>
                            <TextInput style={styles.textarea} placeholder="Property Address" value={step3Data.officeaddress} onChangeText={text => setStep3Data({ ...step3Data, officeaddress: text })} multiline numberOfLines={5} maxLength={120} />

                            <Text style={styles.label}>Pin Location in Map</Text>
                            <View styles={styles.mapTextInput}>
                                <GooglePlacesAutocomplete
                                    placeholder="Search location"
                                    fetchDetails={true}
                                    onPress={handlePlaceSelect}
                                    onFail={(error) => console.error(error)}
                                    query={{
                                        key: GOOGLE_MAPS_API_KEY,
                                        language: "en",
                                    }}
                                    styles={styles.mapTextInput}
                                    debounce={400} // Reduce API calls
                                />
                            </View>
                            <View style={{ backgroundColor: '#edf5ff', padding: 5, borderRadius: 10 }}>
                                <Text style={styles.label}>Location: {fullAddress}</Text>
                            </View>
                            <Text style={{ marginVertical: 10, fontWeight: "bold" }}>Pin Location on Map</Text>
                            <View>
                                <MapView
                                    style={{ height: 150, borderRadius: 10 }}
                                    region={region}
                                    initialRegion={region}
                                    onPress={handleMapPress}
                                >
                                    {region && <Marker coordinate={{ latitude: parseFloat(coordinates.latitude), longitude: parseFloat(coordinates.longitude) }} />}
                                </MapView>
                                <Text>Latitude: {region.latitude}</Text>
                                <Text>Longitude: {region.longitude}</Text>
                            </View>

                        </View>
                    </ProgressStep>

                    <ProgressStep label="Documents"
                        nextBtnTextStyle={buttonNextTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}
                        onSubmit={handleSubmit}>

                        {/* Select Status */}
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Select Status</Text>
                            <View style={styles.pickerContainer}>
                                <RNPickerSelect
                                    onValueChange={(value) => setSelectedStatus(value)}
                                    items={status}
                                    value={selectedStatus}
                                    style={pickerSelectStyles}
                                    placeholder={{ label: 'Choose an option...', value: null }}
                                />
                            </View>
                        </View>

                        {/* Upload Gallery */}
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Property Gallery</Text>
                            <View style={{ flexGrow: 1, minHeight: 1 }}>
                                <FlatList
                                    data={galleryImages}
                                    horizontal
                                    keyExtractor={(item, index) => index.toString()}
                                    contentContainerStyle={styles.fileContainer}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.thumbnailBox} className="border border-gray-300">
                                            <Image source={{ uri: item }} style={styles.thumbnail} />
                                            <Text className="text-center font-rubik-bold">Image: {index + 1}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeGalleryImage(index, item)}
                                                style={styles.deleteButton}>
                                                <Text className="text-white">X</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            </View>
                            <TouchableOpacity onPress={pickGalleryImages} style={styles.dropbox}>
                                <Text style={{ textAlign: 'center' }}>Pick images from gallery</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Upload Video */}
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Upload Videos</Text>
                            <View style={{ flexGrow: 1, minHeight: 1 }}>
                                <FlatList
                                    data={videos}
                                    horizontal
                                    keyExtractor={(item, index) => index.toString()}
                                    contentContainerStyle={styles.fileContainer}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.thumbnailBox} className="border border-gray-300">
                                            <Image source={{ uri: `${item.thumbnailImages}?update=${new Date().getTime()}` }} style={styles.thumbnail} />
                                            <Text className="text-center font-rubik-bold">Video {index + 1}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeVideo(index, item.uri)}
                                                style={styles.deleteButton}
                                            >
                                                <Text className="text-white">X</Text>
                                            </TouchableOpacity>

                                        </View>
                                    )}
                                />
                            </View>
                            <TouchableOpacity onPress={pickVideo} style={styles.dropbox}>
                                <Text style={{ textAlign: 'center' }}>Pick videos from gallery</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Upload Property Documents */}
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Upload Property Documents</Text>
                            <View style={{ flexGrow: 1, minHeight: 1 }}>
                                <FlatList
                                    data={propertyDocuments}
                                    horizontal
                                    keyExtractor={(item, index) => index.toString()}
                                    contentContainerStyle={styles.fileContainer}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.thumbnailBox} className="border border-gray-300">
                                            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                                            <Text className="text-center font-rubik-bold">Doc {index + 1}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeDocument(index, item.uri)}  // Pass the correct URI
                                                style={styles.deleteButton}>
                                                <Text className="text-white">X</Text>
                                            </TouchableOpacity>

                                        </View>
                                    )}
                                />
                            </View>
                            <TouchableOpacity onPress={pickDocument} style={styles.dropbox}>
                                <Text style={{ textAlign: 'center' }}>Pick Doc from gallery</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Upload Master Plan */}
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Upload Master Plan of Property</Text>
                            <View style={{ flexGrow: 1, minHeight: 1 }}>
                                <FlatList
                                    data={masterPlanDoc}
                                    horizontal
                                    keyExtractor={(item, index) => index.toString()}
                                    contentContainerStyle={styles.fileContainer}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.thumbnailBox} className="border border-gray-300">
                                            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                                            <Text className="text-center font-rubik-bold">Plan {index + 1}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeMasterPlan(index, item.uri)}  // Pass the correct URI
                                                style={styles.deleteButton}>
                                                <Text className="text-white">X</Text>
                                            </TouchableOpacity>

                                        </View>
                                    )}
                                />
                            </View>
                            <TouchableOpacity onPress={pickMasterPlan} style={styles.dropbox}>
                                <Text style={{ textAlign: 'center' }}>Pick Master Plan from gallery</Text>
                            </TouchableOpacity>
                        </View>
                    </ProgressStep>

                </ProgressSteps>
            </View>
            {loading && (
                <View className='absolute bottom-28 z-40 right-16'>
                    <ActivityIndicator />
                </View>
            )}
        </SafeAreaView>
    )
}

export default Editproperty

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 0,
        paddingBottom: 0,
        backgroundColor: '#fff',
    },
    stepContent: {
        paddingBottom: 20,
    },
    fileContainer: {
        padding: 5,
        backgroundColor: '#fff',
        flexDirection: 'row',
        display: 'flex',
    },
    deleteButton: {
        paddingHorizontal: 7,
        color: 'white',
        borderWidth: 1,
        borderRadius: 7,
        borderColor: 'red',
        marginLeft: 10,
        backgroundColor: 'red',
        width: 25,
        position: 'absolute',
        top: 0,
        right: 0,
    },
    label: {
        fontSize: 16,
        marginHorizontal: 5,
        marginTop: 10,
        fontWeight: 'bold',
    },
    input: {
        width: '100%',
        height: 50,
        backgroundColor: '#edf5ff',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 10,
        marginTop: 10
    },
    amenityItem: {
        flexDirection: 'row',  // Ensure row layout
        alignItems: 'center',  // Align items properly
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 50,
        marginRight: 5,
        marginBottom: 5,
        backgroundColor: '#edf5ff',
        borderColor: 'green',
        borderWidth: 1,
    },


    removeBtn: {
        color: 'red',
        fontWeight: 'bold',
        fontSize: 12,
        marginEnd: 5,
        marginTop: 0,

    },
    addBtn: {
        width: 40,
        height: 40,
        marginStart: 10,
        marginTop: 15,
    },
    mapTextInput: {
        width: '100%',
        height: 50,
        borderColor: "#edf5ff",
        borderWidth: 1,
        backgroundColor: "#edf5ff",
        borderRadius: 10,
        paddingHorizontal: 10,
    },
    editor: {
        flex: 1,
        padding: 0,
        borderColor: 'gray',
        borderWidth: 1,
        marginHorizontal: 30,
        marginVertical: 5,
        backgroundColor: 'white',
    },

    textarea: {
        textAlignVertical: 'top',  // hack android
        height: 110,
        fontSize: 14,
        marginTop: 20,
        borderRadius: 10,
        color: '#333',
        padding: 15,
        backgroundColor: '#edf5ff',
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    thumbnail: {
        width: 73,
        height: 70,
        borderRadius: 10,
    },
    thumbnailBox: {
        width: 75,
        height: 95,
        borderRadius: 10,
        marginRight: 10,
    },
    dropbox: {
        height: 80,
        padding: 5,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#edf5ff',
        backgroundColor: '#edf5ff',
        borderRadius: 10,
        marginTop: 10,
        marginRight: 10,
        justifyContent: 'center',
        alignContent: 'center',
        flex: 1,
    },
    map: {
        width: '100%',
        height: 150,
        marginTop: 10
    },
    addButton: {
        backgroundColor: '#D3D3D3', padding: 10, marginTop: 10, borderRadius: 5
    },
    addButtonText: { color: 'black', textAlign: 'center', fontWeight: 'bold' },
    tableRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 10 },
    tableCell: { flex: 1, textAlign: 'center', borderEnd: 1, borderColor: '#c7c7c7', fontWeight: 600, },
    pickerContainer: {
        borderRadius: 10, // Apply borderRadius here
        overflow: 'hidden',
        backgroundColor: '#edf5ff',
        marginTop: 10,
        // marginBottom: 20,
    },

});
const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingHorizontal: 10,
        backgroundColor: '#edf5ff',
        borderRadius: 20,
        color: 'black',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        backgroundColor: '#edf5ff',
        borderRadius: 20,
        color: 'black',
        paddingRight: 30,
    },
});
