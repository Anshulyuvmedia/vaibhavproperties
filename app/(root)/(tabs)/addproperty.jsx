import { Image, StyleSheet, Text, TouchableOpacity, View, TextInput, FlatList, Platform, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import icons from '@/constants/icons';
import { ProgressSteps, ProgressStep } from 'react-native-progress-steps';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Constants from "expo-constants";
import 'react-native-get-random-values';
import DateTimePicker from '@react-native-community/datetimepicker';
import Toast, { BaseToast } from 'react-native-toast-message';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const Addproperty = () => {

    const GOOGLE_MAPS_API_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
    const [step1Data, setStep1Data] = useState({ property_name: '', description: '', nearbylocation: '', });
    const [step2Data, setStep2Data] = useState({ approxrentalincome: '', historydate: [], price: '' });
    const [step3Data, setStep3Data] = useState({ sqfoot: '', bathroom: '', floor: '', city: '', officeaddress: '', bedroom: '' });
    const [isValid, setIsValid] = useState(false);

    const [propertyDocuments, setPropertyDocuments] = useState([]);
    const [masterPlanDoc, setMasterPlanDoc] = useState([]);

    const [errors, setErrors] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    // const [selectedStatus, setSelectedStatus] = useState("unpublished");
    const [mainImage, setMainImage] = useState(null);

    const [videos, setVideos] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);

    const [loading, setLoading] = useState(false);
    const [amenity, setAmenity] = useState('');
    const [amenities, setAmenities] = useState([]);
    const [region, setRegion] = useState({
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 0.015,
        longitudeDelta: 0.0121,
    });
    const [coordinates, setCoordinates] = useState({
        latitude: 20.5937, // Default to India's coordinates
        longitude: 78.9629,
    });
    const [fullAddress, setFullAddress] = useState("");
    const [show, setShow] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [historyPrice, setHistoryPrice] = useState('');
    const buttonPreviousTextStyle = {
        paddingInline: 20,
        paddingBlock: 5,
        borderRadius: 25,
        backgroundColor: '#234F68',
        color: 'white',
    };
    const buttonNextTextStyle = {
        paddingInline: 20,
        paddingBlock: 5,
        borderRadius: 25,
        backgroundColor: '#8bc83f',
        color: 'white',
    };
    const categories = [
        { label: 'Apartment', value: 'Apartment' },
        { label: 'Villa', value: 'Villa' },
        { label: 'Penthouse', value: 'Penthouse' },
        { label: 'Residences', value: 'Residences' },
        { label: 'Luxury House', value: 'Luxury House' },
        { label: 'Bunglow', value: 'Bunglow' },
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
    // const status = [
    //     { label: 'Unpublished', value: 'unpublished' },
    //     { label: 'Published', value: 'published' },
    // ];
    const [visibleData, setVisibleData] = useState(step2Data.historydate.slice(0, 10));
    const [currentIndex, setCurrentIndex] = useState(10);

    const validateStep = (step) => {
        if (step === 1) {
            if (!step1Data?.property_name || !step1Data?.description || !step1Data?.nearbylocation) {
                Toast.show({
                    type: 'error',
                    text1: 'Step 1 Error',
                    text2: 'Property Name, Description, and Nearby Location are required.',
                });
                return false;
            }
        }

        if (step === 2) {
            if (!step2Data?.approxrentalincome || step2Data?.historydate.length === 0 || !step2Data?.price) {
                Toast.show({
                    type: 'error',
                    text1: 'Step 2 Error',
                    text2: 'Approx Rental Income, Price, and at least one History Date are required.',
                });
                return false;
            }
        }

        if (step === 3) {
            if (!step3Data?.sqfoot || !step3Data?.bathroom || !step3Data?.floor || !step3Data?.city || !step3Data?.officeaddress || !step3Data?.bedroom) {
                Toast.show({
                    type: 'error',
                    text1: 'Step 3 Error',
                    text2: 'Square Foot, Bathroom, Floor, City, Office Address, and Bedroom are required.',
                });
                return false;
            }
        }

        if (step === 4) {
            if (!selectedCategory) {
                Toast.show({
                    type: 'error',
                    text1: 'Category Required',
                    text2: 'Please select a property category.',
                });
                return false;
            }

            if (!mainImage) {
                Toast.show({
                    type: 'error',
                    text1: 'Image Required',
                    text2: 'Please upload a main property image.',
                });
                return false;
            }

            if (galleryImages.length < 2) {
                Toast.show({
                    type: 'error',
                    text1: 'Gallery Images Required',
                    text2: 'Please upload at least 2 gallery images.',
                });
                return false;
            }

            if (!coordinates.latitude || !coordinates.longitude) {
                Toast.show({
                    type: 'error',
                    text1: 'Location Required',
                    text2: 'Please provide a valid property location.',
                });
                return false;
            }

            if (propertyDocuments.length === 0) {
                Toast.show({
                    type: 'error',
                    text1: 'Documents Required',
                    text2: 'Please upload at least one property document.',
                });
                return false;
            }
        }

        return true;
    };


    const onNextStep = (step) => {
        if (!validateStep(step)) {
            setErrors(true);
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

            setStep2Data((prevData) => ({
                ...prevData,
                historydate: [...prevData.historydate, newHistoryEntry],
            }));

            setSelectedDate('');
            setHistoryPrice('');
        }
    };
    useEffect(() => {
        if (step2Data.historydate.length > 0) {
            setVisibleData(step2Data.historydate.slice(0, currentIndex));
        }
    }, [step2Data.historydate]);
    const loadMore = () => {
        const nextIndex = currentIndex + 10;
        setVisibleData(step2Data.historydate.slice(0, nextIndex));
        setCurrentIndex(nextIndex);
    };
    // Function to remove a specific price history entry
    const removePriceHistory = (index) => {
        setStep2Data((prevData) => {
            const updatedHistory = prevData.historydate.filter((_, i) => i !== index);
            return { ...prevData, historydate: updatedHistory };
        });
        setVisibleData((prevData) => prevData.filter((_, i) => i !== index));
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

    // Function to remove a document
    const removeDocument = (index) => {
        setPropertyDocuments(prevDocs => prevDocs.filter((_, i) => i !== index));
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

    // Function to remove a document
    const removeMasterPlan = (index) => {
        setMasterPlanDoc(prevDocs => prevDocs.filter((_, i) => i !== index));
    };

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
            setCoordinates({
                latitude: parseFloat(lat) ?? 0,
                longitude: parseFloat(lng) ?? 0,
            });
        }
    };

    // Function to handle manual selection on the map
    const handleMapPress = (e) => {
        if (!e?.nativeEvent?.coordinate) return;

        const { latitude, longitude } = e.nativeEvent.coordinate;

        setCoordinates({
            latitude,
            longitude,
        });

        setRegion((prev) => ({
            ...prev,
            latitude,
            longitude,
        }));
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

            const { id, user_type } = userData;

            const formData = new FormData();
            // ✅ Append Step 1 Data
            Object.entries(step1Data).forEach(([key, value]) => { formData.append(key, value); });
            // ✅ Append Step 2 Data
            Object.entries(step2Data).forEach(([key, value]) => { formData.append(key, value); });
            // ✅ Append Step 3 Data
            Object.entries(step3Data).forEach(([key, value]) => { formData.append(key, value); });

            // ✅ Append additional fields
            formData.append("bedroom", step3Data?.bedroom ?? "");
            formData.append("category", selectedCategory ?? "");
            // formData.append("status", selectedStatus ?? "");
            formData.append("roleid", id ?? "");
            formData.append("usertype", user_type ?? "");
            formData.append("amenities", JSON.stringify(amenities));
            formData.append("historydate", step2Data?.historydate ? JSON.stringify(step2Data.historydate) : "[]");

            // ✅ Append Location Data
            formData.append("location", JSON.stringify({
                Latitude: coordinates.latitude,
                Longitude: coordinates.longitude,
            }));

            let thumbnailFileName = '';
            if (mainImage) {
                const fileType = mainImage?.includes('.') ? mainImage.split('.').pop() : "jpg";  // Ensure there's an extension
                thumbnailFileName = `mainImage-thumbnail.${fileType}`;
                formData.append("thumbnailImages", {
                    uri: mainImage,
                    name: thumbnailFileName,
                    type: `image/${fileType}`
                });
            }

            // ✅ Append Gallery Images Correctly
            galleryImages.forEach((imageUri, index) => {
                if (imageUri) { // Directly check string
                    const fileType = imageUri.includes('.') ? imageUri.split('.').pop() : "jpeg";

                    formData.append(`galleryImages[${index}]`, {
                        uri: imageUri, // ✅ Corrected
                        type: `image/${fileType}`,
                        name: `gallery-image-${index}.${fileType}`,
                    });
                } else {
                    console.warn("Skipping image due to missing URI.");
                }
            });

            // console.log("Uploading galleryImages", galleryImages);

            // ✅ Append Videos as a Comma-Separated String
            videos.forEach((video, index) => {
                if (video?.uri) {  // Check if video.uri exists
                    const fileType = video.uri.includes('.') ? video.uri.split('.').pop() : "mp4";
                    formData.append(`propertyvideos[${index}]`, {
                        uri: video.uri,
                        type: video.type || `video/${fileType}`,
                        name: `video-${index}.${fileType}`,
                    });
                }
            });
            // console.log("Uploading videos", videos);

            // ✅ Append Documents as a Comma-Separated String
            propertyDocuments.forEach((doc, index) => {
                if (doc?.uri) {  // Check if doc.uri exists
                    const fileType = doc.uri.includes('.') ? doc.uri.split('.').pop() : "pdf";
                    formData.append(`documents[${index}]`, {
                        uri: doc.uri,
                        type: doc.type || `application/${fileType}`,
                        name: `document-${index}.${fileType}`,
                    });
                }
            });

            masterPlanDoc.forEach((doc, index) => {
                if (doc?.uri) {  // Ensure the document has a valid URI
                    const fileType = doc.uri.split('.').pop()?.toLowerCase() || "pdf";
                    const validFileTypes = ["pdf", "jpeg", "jpg"];

                    if (!validFileTypes.includes(fileType)) {
                        console.warn(`Invalid file type detected: ${fileType}`);
                        return;
                    }

                    formData.append("masterplandocument", {
                        uri: doc.uri,
                        type: fileType === "pdf" ? "application/pdf" : `image/${fileType}`,
                        name: `masterplan-${index}.${fileType}`,
                    });
                }
            });
            // console.log("Uploading Master Plan Document:", masterPlanDoc);

            // ✅ Prepare File Data Object & Append
            const safeFileName = (uri, defaultExt) => {
                return uri && uri.includes('.') ? uri.split('.').pop() : defaultExt;
            };

            const fileData = {
                galleryImages: galleryImages.map((image, index) => `gallery-image-${index}.${safeFileName(image.uri, "jpg")}`),
                propertyvideos: videos.map((video, index) => `video-${index}.${safeFileName(video.uri, "mp4")}`),
                thumbnailImages: thumbnailFileName ? [thumbnailFileName] : [],
                documents: propertyDocuments.map((doc, index) => `document-${index}.${safeFileName(doc.uri, "pdf")}`),
                masterplandocument: masterPlanDoc.map((doc, index) => `masterplan-${index}.${safeFileName(doc.uri, "pdf")}`),
            };
            formData.append("fileData", JSON.stringify(fileData));
            console.log("Uploading FormData add property:", formData);

            // Send API request
            const response = await axios.post("https://landsquire.in/api/insertlisting", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${userToken}`,
                },
            });

            // console.log("API Response:", response.data);
            if (response.status === 200 && !response.data.error) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: "Property added successfully!",
                });
            } else {
                console.error("Error", response.data.message || "Failed to add property.");
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: "Failed to add property.",
                });
            }
        } catch (error) {
            console.error("API Error:", error?.response?.data || error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: "Something went wrong. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    // Reset Form Function
    const resetForm = () => {
        setStep1Data({
            property_name: '',
            description: '',
            nearbylocation: '',
            approxrentalincome: '',
            price: ''
        });

        setStep3Data({
            amenities: '',
            sqfoot: '',
            bathroom: '',
            floor: '',
            city: '',
            officeaddress: ''
        });

        // ✅ Instead of `null`, initialize step2Data with an empty object that includes `historydate`
        setStep2Data({ historydate: [] });

        setSelectedCategory(null);
        // setSelectedStatus("unpublished");
        setMainImage(null);
        setGalleryImages([]);
        setPropertyDocuments([]);
        setMasterPlanDoc([]);
        setVideos([]);
    };

    const updateFullAddress = async (latitude, longitude) => {
        try {
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
            );
            if (response.data.results && response.data.results.length > 0) {
                setFullAddress(response.data.results[0].formatted_address);
            } else {
                setFullAddress("Address not found");
            }
        } catch (error) {
            console.error("Error fetching address:", error);
            setFullAddress("Unable to retrieve address");
        }
    };

    return (
        <View style={{ backgroundColor: '#fafafa', height: '100%', paddingHorizontal: 20 }}>


            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 18, marginRight: 10, textAlign: 'center', fontFamily: 'Rubik-Bold', color: '#234F68' }}>
                    Add New Property
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', backgroundColor: '#f4f2f7', borderRadius: 50, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() => router.push('/notifications')}>
                    <Image source={icons.bell} className='size-6' />
                </TouchableOpacity> */}
            </View>

            <View style={styles.container}>
                <View style={{ position: 'absolute', top: 10, left: 0, right: 0, zIndex: 9999 }}>
                    <Toast config={toastConfig} position="top" />
                </View>
                <ProgressSteps>
                    <ProgressStep label="General"
                        nextBtnTextStyle={buttonNextTextStyle}
                        nextBtnText="Next"
                        previousBtnText="Back"
                    // onNext={() => onNextStep(1)}
                    // errors={errors}
                    >
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Property Title</Text>
                            <View style={styles.inputContainer}>
                                <AntDesign name="home" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter property name"
                                    value={step1Data.property_name}
                                    onChangeText={text => setStep1Data({ ...step1Data, property_name: text })}
                                />
                            </View>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Property Description</Text>
                            <TextInput
                                style={styles.textarea}
                                value={step1Data.description}
                                onChangeText={text => setStep1Data({ ...step1Data, description: text })}
                                maxLength={120}
                                placeholder="Enter property description..."
                                multiline
                                numberOfLines={5}
                            />
                        </View>

                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Property Thumbnail</Text>
                            <View className="flex-row items-center">
                                <TouchableOpacity onPress={pickMainImage} style={styles.dropbox}>
                                    <Ionicons name="image-outline" size={24} color="#234F68" style={styles.inputIcon} />
                                    <Text style={{ marginStart: 10 }}>Upload Thumbnail</Text>
                                </TouchableOpacity>
                                {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}
                            </View>
                        </View>

                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Select Category</Text>
                            <View style={styles.categoryContainer}>
                                {categories.map((category) => (
                                    <TouchableOpacity
                                        key={category.value}
                                        style={[
                                            styles.categoryButton,
                                            selectedCategory === category.value && styles.categoryButtonSelected,
                                        ]}
                                        onPress={() => setSelectedCategory(category.value)}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            selectedCategory === category.value && styles.categoryTextSelected,
                                        ]}>{category.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Near By Locations</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="trail-sign-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter near by locations..."
                                    value={step1Data.nearbylocation}
                                    onChangeText={text => setStep1Data({ ...step1Data, nearbylocation: text })}
                                />
                            </View>
                        </View>
                    </ProgressStep>

                    <ProgressStep label="Price"
                        nextBtnText="Next"
                        previousBtnText="Back"
                        nextBtnTextStyle={buttonNextTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}
                    // onNext={() => onNextStep(2)}
                    // errors={errors}
                    >
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Approx Rental Income</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="pricetag-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
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
                            </View>
                        </View>

                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Current Property Price</Text>
                            <View style={styles.inputContainer}>
                                <FontAwesome name="rupee" size={24} color="#1F4C6B" style={styles.inputIcon} />
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
                            </View>
                        </View>

                        <View style={styles.stepContent}>
                            <View className='flex-row justify-between items-center'>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={styles.label}>Historical Price</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Historical Price"
                                            value={historyPrice}
                                            keyboardType="numeric"
                                            onChangeText={text => {
                                                const numericText = text.replace(/[^0-9]/g, '');
                                                setHistoryPrice(numericText);
                                            }}
                                        />
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Historical Date</Text>
                                    <View style={styles.inputContainer}>
                                        <TouchableOpacity onPress={() => setShow(true)}>
                                            <TextInput
                                                style={styles.input}
                                                placeholder="DD-MM-YYYY"
                                                value={selectedDate}
                                                editable={false}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {show && (
                                        <DateTimePicker
                                            value={new Date()}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                                            onChange={handleDateChange}
                                        />
                                    )}
                                </View>
                                <TouchableOpacity onPress={addPriceHistory}>
                                    <Image source={icons.addicon} style={styles.addBtn} />
                                </TouchableOpacity>
                            </View>
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
                        nextBtnText="Next"
                        previousBtnText="Back"
                        nextBtnTextStyle={buttonNextTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}
                    // onNext={() => onNextStep(3)}
                    // errors={errors}
                    >
                        <View style={styles.stepContent}>
                            <View className='flex flex-row items-center'>
                                <Text style={styles.label}>Features & Amenities</Text>
                            </View>
                            <View className='flex flex-row align-center'>
                                <View className='flex-grow'>
                                    <View style={styles.inputContainer}>
                                        <MaterialIcons name="pool" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Enter to Add Amenities"
                                            value={amenity}
                                            onChangeText={setAmenity}
                                            onSubmitEditing={handleAddAmenity}
                                        />
                                    </View>
                                </View>
                                <TouchableOpacity onPress={() => handleAddAmenity()}>
                                    <Image source={icons.addicon} style={styles.addBtn} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", }}>
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
                        </View>

                        <View style={styles.stepContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <Text style={styles.label}>Floor</Text>
                                    <View style={styles.inputContainer}>
                                        <MaterialCommunityIcons name="floor-plan" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Floor" keyboardType="numeric" value={step3Data.floor} onChangeText={text => setStep3Data({ ...step3Data, floor: text })} />
                                    </View>
                                </View>
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <Text style={styles.label}>Bathroom</Text>
                                    <View style={styles.inputContainer}>
                                        <MaterialCommunityIcons name="bathtub-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Bathroom" keyboardType="numeric" value={step3Data.bathroom} onChangeText={text => setStep3Data({ ...step3Data, bathroom: text })} />
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.label}>Bedroom</Text>
                                    <View style={styles.inputContainer}>
                                        <MaterialCommunityIcons name="bed-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Bedrooms" keyboardType="numeric" value={step3Data.bedroom} onChangeText={text => setStep3Data({ ...step3Data, bedroom: text })} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.stepContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, marginRight: 5 }}>
                                    <Text style={styles.label}>Square Foot</Text>
                                    <View style={styles.inputContainer}>
                                        <MaterialIcons name="zoom-out-map" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Square Foot" keyboardType="numeric" value={step3Data.sqfoot} onChangeText={text => setStep3Data({ ...step3Data, sqfoot: text })} />
                                    </View>
                                </View>
                                <View style={{ flex: 1, marginLeft: 5 }}>
                                    <Text style={styles.label}>City</Text>
                                    <View style={styles.inputContainer}>
                                        <MaterialCommunityIcons name="city-variant-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Enter City" value={step3Data.city} onChangeText={text => setStep3Data({ ...step3Data, city: text })} />
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Property Address</Text>
                            <TextInput
                                style={styles.textarea}
                                placeholder="Property Address"
                                value={step3Data.officeaddress}
                                onChangeText={text => setStep3Data({ ...step3Data, officeaddress: text })}
                                multiline
                                numberOfLines={5}
                                maxLength={120}
                            />
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Find Location on Google Map</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="map-marker-radius-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                <GooglePlacesAutocomplete
                                    placeholder="Locate your property"
                                    fetchDetails={true}
                                    onPress={handlePlaceSelect}
                                    onFail={(error) => console.error("GooglePlacesAutocomplete Error:", error)}
                                    query={{
                                        key: GOOGLE_MAPS_API_KEY,
                                        language: "en",
                                    }}
                                    styles={{
                                        textInput: styles.mapTextInput,
                                        container: { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 15 },
                                        listView: { backgroundColor: "#fff", borderRadius: 10, marginTop: 5 },
                                    }}
                                    debounce={400}
                                />
                            </View>
                            <View>
                                <Text className='text-base'>Location: {fullAddress || "Not available"}</Text>
                            </View>
                            <Text style={{ marginTop: 10, fontWeight: "bold" }}>Pin Location on Map</Text>
                            <Text style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>
                                Tap on the map or drag the marker to set the property location.
                            </Text>
                            <View>
                                <MapView
                                    style={{ height: 150, borderRadius: 10 }}
                                    region={{
                                        latitude: region.latitude || 20.5937,
                                        longitude: region.longitude || 78.9629,
                                        latitudeDelta: region.latitudeDelta || 0.015,
                                        longitudeDelta: region.longitudeDelta || 0.0121,
                                    }}
                                    moveOnMarkerPress={false}
                                    onPress={async (e) => {
                                        const { latitude, longitude } = e.nativeEvent.coordinate;
                                        setCoordinates({ latitude, longitude });
                                        setRegion((prevRegion) => ({
                                            ...prevRegion,
                                            latitude,
                                            longitude,
                                        }));
                                        await updateFullAddress(latitude, longitude);
                                    }}
                                >
                                    {(coordinates.latitude && coordinates.longitude) && (
                                        <Marker
                                            coordinate={{
                                                latitude: parseFloat(coordinates.latitude),
                                                longitude: parseFloat(coordinates.longitude),
                                            }}
                                            draggable
                                            onDragEnd={async (e) => {
                                                const { latitude, longitude } = e.nativeEvent.coordinate;
                                                setCoordinates({ latitude, longitude });
                                                setRegion((prevRegion) => ({
                                                    ...prevRegion,
                                                    latitude,
                                                    longitude,
                                                }));
                                                await updateFullAddress(latitude, longitude);
                                            }}
                                        />
                                    )}
                                </MapView>
                                <View className='flex-col bg-primary-100 rounded-lg mt-2 p-2'>
                                    <Text className='font-rubik-medium'>Latitude: {coordinates.latitude || "Not set"}</Text>
                                    <Text className='font-rubik-medium'>Longitude: {coordinates.longitude || "Not set"}</Text>
                                </View>
                            </View>
                        </View>
                    </ProgressStep>

                    <ProgressStep label="Files"
                        finishBtnText="Save"
                        previousBtnText="Back"
                        nextBtnTextStyle={buttonNextTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}
                        onSubmit={handleSubmit}>
                        {/* select status */}
                        {/* <View style={styles.stepContent}>
                            <Text style={styles.label}>Select Status</Text>
                            <View style={styles.pickerContainer}>
                                <RNPickerSelect
                                    onValueChange={(value) => setSelectedStatus(value)}
                                    items={status}
                                    value={selectedStatus} // ✅ Ensures the default value is selected
                                    style={pickerSelectStyles}
                                    placeholder={{ label: 'Choose an option...', value: null }}
                                />
                            </View>
                        </View> */}

                        <View style={styles.stepContent}>

                            {/* upload gallery */}
                            <Text style={styles.label}>Property Gallery</Text>
                            <View style={{ flexGrow: 1, minHeight: 1 }}>
                                <FlatList
                                    data={galleryImages}
                                    horizontal
                                    keyExtractor={(item, index) => index.toString()}
                                    nestedScrollEnabled={true}
                                    contentContainerStyle={styles.fileContainer}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.thumbnailBox} className="border border-gray-300">
                                            <Image source={{ uri: item }} style={styles.thumbnail} />
                                            <Text className="text-center font-rubik-bold">Image: {index + 1}</Text>

                                            <TouchableOpacity
                                                onPress={() => setGalleryImages(galleryImages.filter((_, i) => i !== index))}
                                                style={styles.deleteButton}
                                            >
                                                <Text className="text-white">X</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            </View>
                            <TouchableOpacity onPress={pickGalleryImages} style={styles.dropbox}>
                                <Ionicons name="images-outline" size={24} color="#234F68" style={styles.inputIcon} />
                                <Text style={{ textAlign: 'center' }}>Pick property images</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Upload video */}
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Upload Videos</Text>
                            <View style={{ flexGrow: 1, minHeight: 1 }}>
                                <FlatList
                                    data={videos}
                                    horizontal
                                    keyExtractor={(item) => item.id.toString()}
                                    nestedScrollEnabled={true}
                                    contentContainerStyle={styles.fileContainer}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.thumbnailBox} className="border border-gray-300">
                                            <Image
                                                source={{ uri: `${item.thumbnailImages}?update=${new Date().getTime()}` }}
                                                style={styles.thumbnail}
                                            />
                                            <Text className="text-center font-rubik-bold">Video {index + 1}</Text>

                                            <TouchableOpacity
                                                onPress={() => setVideos(videos.filter((v) => v.id !== item.id))}
                                                style={styles.deleteButton}
                                            >
                                                <Text className="text-white">X</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            </View>

                            <TouchableOpacity onPress={pickVideo} style={styles.dropbox}>
                                <FontAwesome name="file-video-o" size={24} color="#234F68" style={styles.inputIcon} />
                                <Text style={{ textAlign: 'center' }}>Pick property videos</Text>
                            </TouchableOpacity>

                        </View>

                        {/* upload doc */}
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Upload Property Documents</Text>
                            <View style={{ flexGrow: 1, minHeight: 1 }}>
                                <FlatList
                                    data={propertyDocuments}
                                    horizontal
                                    nestedScrollEnabled={true}
                                    keyExtractor={(_, index) => index.toString()}
                                    contentContainerStyle={styles.fileContainer}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.thumbnailBox} className="border border-gray-300">
                                            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                                            <Text className="text-center font-rubik-bold">Doc {index + 1}</Text>

                                            <TouchableOpacity onPress={() => removeDocument(index)} style={styles.deleteButton}>
                                                <Text className="text-white">X</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            </View>
                            <TouchableOpacity onPress={pickDocument} style={styles.dropbox}>
                                <FontAwesome name="file-pdf-o" size={24} color="#234F68" style={styles.inputIcon} />
                                <Text style={{ textAlign: 'center' }}>Pick property documents</Text>
                            </TouchableOpacity>
                        </View>

                        {/* upload marster plan */}
                        <View style={styles.stepContent}>
                            <Text style={styles.label}>Upload Property Master Plan</Text>
                            <View style={{ flexGrow: 1, minHeight: 1 }}>
                                <FlatList
                                    data={masterPlanDoc}
                                    horizontal
                                    nestedScrollEnabled={true}
                                    keyExtractor={(_, index) => index.toString()}
                                    contentContainerStyle={styles.fileContainer}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.thumbnailBox} className="border border-gray-300">
                                            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
                                            <Text className="text-center font-rubik-bold">Plan {index + 1}</Text>

                                            <TouchableOpacity onPress={() => removeMasterPlan(index)} style={styles.deleteButton}>
                                                <Text className="text-white">X</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                />
                            </View>
                            <TouchableOpacity onPress={pickMasterPlan} style={styles.dropbox}>
                                <MaterialCommunityIcons name="floor-plan" size={24} color="#234F68" style={styles.inputIcon} />
                                <Text style={{ textAlign: 'center' }}>Pick property Floor Plan</Text>
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
        </View>
    )
}

export default Addproperty

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // paddingBottom: 40,
        backgroundColor: '#fafafa',
    },
    stepContent: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderRadius: 20,
        borderColor: '#f4f2f7',
        padding: 10,
        marginBottom: 10,
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
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 15,
        marginBlock: 10,
        padding: 10,
    },
    inputIcon: {
        marginEnd: 10,
    },
    input: {
        flex: 1,
        height: 45,
        paddingHorizontal: 10,
        fontFamily: 'Rubik-Regular',
        color: '#000',
    },
    amenityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 50,
        marginRight: 5,
        marginBottom: 5,
        backgroundColor: '#f3f4f6',
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
        backgroundColor: "#f3f4f6",
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
        textAlignVertical: 'top',
        height: 110,
        fontSize: 14,
        marginTop: 10,
        paddingTop: 10,
        borderRadius: 15,
        color: '#000',
        padding: 15,
        backgroundColor: '#f3f4f6',
    },
    image: {
        width: 75,
        height: 75,
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
        borderColor: '#234F68',
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        marginTop: 5,
        marginRight: 10,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    map: {
        width: '100%',
        height: 150,
        marginTop: 10
    },
    addButton: {
        backgroundColor: '#234F68',
        padding: 10,
        marginTop: 10,
        borderRadius: 5
    },
    addButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold'
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        borderEnd: 1,
        borderColor: '#c7c7c7',
        fontWeight: 600,
    },
    pickerContainer: {
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        marginTop: 10,
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginVertical: 10,
        paddingHorizontal: 5,
    },
    categoryButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
        margin: 5,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    categoryButtonSelected: {
        backgroundColor: '#1F4C6B',
        borderColor: '#1F4C6B',
    },
    categoryText: {
        fontSize: 14,
        color: '#000',
        textAlign: 'center',
    },
    categoryTextSelected: {
        color: '#fff',
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingHorizontal: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        color: 'black',
        paddingRight: 30,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 10,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        color: 'black',
        paddingRight: 30,
    },
});
