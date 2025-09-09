import { Image, StyleSheet, Text, TouchableOpacity, View, TextInput, FlatList, Platform, Modal, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import RBSheet from 'react-native-raw-bottom-sheet';
import { v4 as uuidv4 } from 'uuid';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

const Addproperty = () => {
    const [sessionToken, setSessionToken] = useState(uuidv4());
    const GOOGLE_MAPS_API_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
    const [step1Data, setStep1Data] = useState({ property_name: '', description: '', nearbylocation: '', });
    const [step2Data, setStep2Data] = useState({ approxrentalincome: '', historydate: [], price: '' });
    const [step3Data, setStep3Data] = useState({ bathroom: '', floor: '', city: '', officeaddress: '', bedroom: '' });
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
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null); // 'mainImage', 'galleryImages', or 'video'
    const [categoryData, setCategoryData] = useState([]);
    const [landArea, setLandArea] = useState("");
    const [selectedUnit, setSelectedUnit] = useState('sqft');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedPropertyFor, setSelectedPropertyFor] = useState('Sell');
    const [suggestions, setSuggestions] = useState([]);
    const [message, setMessage] = useState({ type: '', title: '', text: '' });
    const [searchTerm, setSearchTerm] = useState('');

    // State for tracking invalid fields
    const [step1Errors, setStep1Errors] = useState({ property_name: false, description: false, nearbylocation: false });
    const [step2Errors, setStep2Errors] = useState({ approxrentalincome: false, price: false });
    const [step3Errors, setStep3Errors] = useState({ bathroom: false, floor: false, city: false, officeaddress: false, bedroom: false });
    const [step4Errors, setStep4Errors] = useState({ category: false, mainImage: false, galleryImages: false, coordinates: false, documents: false });

    // RBSheet ref
    const rbSheetRef = useRef();

    // State for RBSheet message
    const [sheetMessage, setSheetMessage] = useState({ title: '', message: '', type: 'error' });


    const subcategoryOptions = {
        Agriculture: [
            { label: 'Plot', value: 'Plot' },
            { label: 'House', value: 'House' },
        ],
        Approved: [
            { label: 'Plot', value: 'Plot' },
            { label: 'House', value: 'House' },
            { label: 'Apartment', value: 'Apartment' },
        ],
        Commercial: [
            { label: 'Plot', value: 'Plot' },
            { label: 'Land', value: 'Land' },
            { label: 'Shop', value: 'Shop' },
            { label: 'Office', value: 'Office' },
            { label: 'Other', value: 'Other' },
        ],
    };

    const propertyfor = [
        { label: 'Sell', value: 'Sell' },
        { label: 'Rent', value: 'Rent' },
    ];

    const units = [
        { label: 'sqft', value: 'sqft' },
        { label: 'sqm', value: 'sqm' },
        { label: 'yards', value: 'yards' },
        { label: 'bigha', value: 'bigha' },
        { label: 'acre', value: 'acre' },
    ];
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


    // const status = [
    //     { label: 'Unpublished', value: 'unpublished' },
    //     { label: 'Published', value: 'published' },
    // ];
    const [visibleData, setVisibleData] = useState(step2Data.historydate.slice(0, 10));
    const [currentIndex, setCurrentIndex] = useState(10);
    // console.log('fullAddress', fullAddress);
    const validateStep = (step) => {
        let isValid = true;
        let message = '';
        let title = '';

        if (step === 1) {
            const newErrors = {
                property_name: !step1Data?.property_name,
                description: !step1Data?.description,
                nearbylocation: !step1Data?.nearbylocation,
                // purpose: !selectedPropertyFor,
                category: !selectedCategory,
                subcategory: !selectedSubCategory,
                mainImage: !mainImage,
            };
            setStep1Errors(newErrors);
            if (Object.values(newErrors).some(error => error)) {
                isValid = false;
                title = 'Step 1 Error';
                message = [
                    newErrors.property_name ? 'Please Enter Property Name.' : '',
                    newErrors.description ? 'Please Enter Description' : '',
                    newErrors.nearbylocation ? 'Please enter atleast one landmarks.' : '',
                    newErrors.category ? 'Please select category.' : '',
                    newErrors.subcategory ? 'Please select sub category.' : '',
                    newErrors.mainImage ? 'Please upload at least one property image.' : '',
                ].filter(msg => msg).join('\n');
            }
        }

        if (step === 2) {
            const newErrors = {
                approxrentalincome: !step2Data?.approxrentalincome,
                // historydate: step2Data?.historydate.length === 0,
                price: !step2Data?.price,
            };
            setStep2Errors(newErrors);
            if (Object.values(newErrors).some(error => error)) {
                isValid = false;
                title = 'Step 2 Error';
                message = 'Approx Rental Income, Price, and at least one History Date are required.';
                message = [
                    newErrors.approxrentalincome ? 'Please enter approx rental income.' : '',
                    newErrors.price ? 'Please enter current property price.' : '',
                    // newErrors.historydate ? 'Please enter price history' : '',
                ].filter(msg => msg).join('\n');
            }
        }

        if (step === 3) {
            const newErrors = {
                amenities: amenities.length < 1,
                // floor: !step3Data?.floor,
                // bathroom: !step3Data?.bathroom,
                // bedroom: !step3Data?.bedroom,
                city: !step3Data?.city,
                officeaddress: !step3Data?.officeaddress,
                landArea: !landArea,
                fullAddress: !fullAddress,
            };
            setStep3Errors(newErrors);
            if (Object.values(newErrors).some(error => error)) {
                isValid = false;
                title = 'Step 3 Error';
                message = [
                    newErrors.amenities ? 'Please enter amenities.' : '',
                    // newErrors.floor ? 'Please enter no. of floors' : '',
                    // newErrors.bathroom ? 'Please enter no. of bathroom.' : '',
                    // newErrors.bedroom ? 'Please enter no. of bathroom.' : '',
                    newErrors.landArea ? 'Please enter land area.' : '',
                    newErrors.city ? 'Please enter city.' : '',
                    newErrors.officeaddress ? 'Please enter Property address.' : '',
                    newErrors.fullAddress ? 'Please enter location on map' : '',
                ].filter(msg => msg).join('\n');
            }
        }

        if (step === 4) {
            const newErrors = {
                galleryImages: galleryImages.length < 3, // ✅ corrected to match message (at least 2)
                // videos: videos.length < 1,
                // propertyDocuments: propertyDocuments.length < 1,
                // masterPlanDoc: masterPlanDoc.length < 1,
            };

            setStep4Errors(newErrors);

            if (Object.values(newErrors).some(error => error)) {
                isValid = false;
                title = 'Step 4 Error';
                message = [
                    newErrors.galleryImages ? 'Please upload at least 3 gallery images.' : '',
                    // newErrors.videos ? 'Please upload at least 1 video.' : '',
                    // newErrors.propertyDocuments ? 'Please upload at least 1 property document.' : '',
                    // newErrors.masterPlanDoc ? 'Please upload a master plan document.' : '',
                ].filter(msg => msg).join('\n');
            }
        }


        if (!isValid) {
            setErrors(true);
            setSheetMessage({ title, message, type: 'error' });
            rbSheetRef.current.open();
        } else {
            setErrors(false);
        }

        return isValid;
    };


    const onNextStep = (step) => {
        if (!validateStep(step)) {
            setErrors(true);
        } else {
            setErrors(false);
        }
    };

    const handleAddAmenity = () => {
        if (amenity.trim() !== '') {
            setAmenities([...amenities, amenity.trim()]);
            setAmenity('');
        }
    };

    const requestPermissions = async (useCamera = false) => {
        if (useCamera) {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                setSheetMessage({
                    title: 'Error',
                    message: 'Sorry, we need camera permissions to make this work!',
                    type: 'error',
                });
                rbSheetRef.current.open();
                return false;
            }
        }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setSheetMessage({
                title: 'Error',
                message: 'Sorry, we need camera roll permissions to make this work!',
                type: 'error',
            });
            rbSheetRef.current.open();
            return false;
        }
        return true;
    };

    const openSourceModal = (type) => {
        setModalType(type);
        setModalVisible(true);
    };

    const pickMainImage = async (source) => {
        setModalVisible(false);
        if (source === 'camera') {
            if (!(await requestPermissions(true))) return;
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });
            if (!result?.canceled && result.assets?.length) {
                setMainImage(result.assets[0].uri);
            }
        } else {
            if (!(await requestPermissions())) return;
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });
            if (!result?.canceled && result.assets?.length) {
                setMainImage(result.assets[0].uri);
            }
        }
    };

    const pickGalleryImages = async (source) => {
        setModalVisible(false);
        if (source === 'camera') {
            if (!(await requestPermissions(true))) return;
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.5,
            });
            if (!result?.canceled && result.assets?.length) {
                setGalleryImages(prevImages => [...prevImages, result.assets[0].uri]);
            }
        } else {
            if (!(await requestPermissions())) return;
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.5,
            });
            if (!result?.canceled && result.assets?.length) {
                const selectedImages = result.assets.map(image => image.uri);
                setGalleryImages(prevImages => [...prevImages, ...selectedImages]);
            }
        }
    };

    const pickVideo = async (source) => {
        setModalVisible(false);
        const defaultThumbnail = typeof icons.videofile === "number" ? Image.resolveAssetSource(icons.videofile).uri : icons.videofile;
        if (source === 'camera') {
            if (!(await requestPermissions(true))) return;
            let result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                quality: 0.5,
            });
            if (!result?.canceled && result.assets?.length) {
                setVideos(prevVideos => [
                    ...prevVideos,
                    {
                        id: result.assets[0].uri,
                        uri: result.assets[0].uri,
                        thumbnailImages: defaultThumbnail,
                    },
                ]);
            }
        } else {
            if (!(await requestPermissions())) return;
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsMultipleSelection: true,
            });
            if (!result?.canceled && result.assets?.length) {
                const selectedVideos = result.assets.map(video => ({
                    id: video.uri,
                    uri: video.uri,
                    thumbnailImages: defaultThumbnail,
                }));
                setVideos(prevVideos => [...new Set([...prevVideos, ...selectedVideos])]);
            }
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

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`https://landsquire.in/api/get-categories`);
            if (response.data?.categories) {
                setCategoryData(response.data.categories);
                // console.log('categoryData', response.data.categories);
            } else {
                console.error("Unexpected API response format:", response.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        fetchCategories();
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
            setSheetMessage({
                title: 'Error',
                message: 'Could not retrieve user data.',
                type: 'error',
            });
            rbSheetRef.current.open();
            return null;
        }
    };

    const handleFormSubmission = async () => {
        const isStepValid = validateStep(4); // Validate step 4 explicitly
        if (isStepValid) {
            await handleSubmit(); // Only call handleSubmit if validation passes
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
            formData.append("subcategory", selectedSubCategory ?? "");
            formData.append("propertyfor", selectedPropertyFor ?? "Sell");
            formData.append("landarea", `${landArea} ${selectedUnit}` ?? "");
            // formData.append("status", selectedStatus ?? "");
            formData.append("roleid", id ?? "");
            formData.append("usertype", user_type ?? "");
            formData.append("amenities", JSON.stringify(amenities));
            // formData.append("historydate", step2Data?.historydate ? JSON.stringify(step2Data.historydate) : "[]");

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
            // console.log("Uploading FormData add property:", formData);

            // Send API request
            const response = await axios.post("https://landsquire.in/api/insertlisting", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    "Authorization": `Bearer ${userToken}`,
                },
            });

            // console.log("API Response:", response.data);
            if (response.status === 200 && !response.data.error) {
                setSheetMessage({
                    title: 'Success',
                    message: 'Property added successfully!',
                    type: 'success',
                });
                rbSheetRef.current.open();
            } else {
                console.error("Error", response.data.message || "Failed to add property.");
                setSheetMessage({
                    title: 'Error',
                    message: 'Failed to add property.',
                    type: 'error',
                });
                rbSheetRef.current.open();
            }
        } catch (error) {
            console.error("API Error:", error?.response?.data || error);
            setSheetMessage({
                title: 'Error',
                message: 'Something went wrong. Please try again.',
                type: 'error',
            });
            rbSheetRef.current.open();
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

    // Utility function to format number in Indian style (e.g., 10,00,000)
    const formatIndianNumber = (number) => {
        if (!number) return '';
        const numStr = number.toString().replace(/[^0-9]/g, ''); // Remove non-numeric characters
        // If number is less than 1,000, no formatting needed
        if (numStr.length <= 3) return numStr;
        const lastThree = numStr.slice(-3);
        const otherNumbers = numStr.slice(0, -3);
        const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
        return `${formattedOther},${lastThree}`;
    };


    const handleSearch = (text) => {
        setSearchTerm(text);
        setStep3Data({ ...step3Data, city: text }); // Sync city with input
        if (text.length > 2) {
            fetchSuggestions(text);
        } else {
            setSuggestions([]);
        }
    };

    const fetchSuggestions = async (input) => {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
                params: {
                    input,
                    components: 'country:IN',
                    types: '(cities)',
                    key: GOOGLE_MAPS_API_KEY,
                    sessiontoken: sessionToken,
                },
            });
            // console.log('API Response:', response.data); // Debug the response
            if (response.data.status === 'OK') {
                setSuggestions(response.data.predictions);
            } else {
                setSuggestions([]);
                setMessage({
                    type: 'error',
                    title: 'Error',
                    text: response.data.error_message || 'Failed to fetch suggestions.',
                });
                console.error('API Error:', response.data.error_message);
            }
        } catch (error) {
            console.error('Fetch Suggestions Error:', error);
            setSuggestions([]);
            setMessage({
                type: 'error',
                title: 'Error',
                text: 'An unexpected error occurred during search.',
            });
        }
    };

    const handleSelect = async (placeId) => {
        try {
            const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
                params: {
                    place_id: placeId,
                    fields: 'address_components,formatted_address',
                    key: GOOGLE_MAPS_API_KEY,
                    sessiontoken: sessionToken,
                },
            });
            // console.log('Place Details Response:', response.data); // Debug the response
            if (response.data.status === 'OK') {
                const components = response.data.result.address_components;
                let selectedCity = '';
                let selectedState = '';
                components.forEach(comp => {
                    if (comp.types.includes('locality') || comp.types.includes('sublocality')) {
                        selectedCity = comp.long_name;
                    }
                    if (comp.types.includes('administrative_area_level_1')) {
                        selectedState = comp.long_name;
                    }
                });
                if (selectedCity) {
                    setStep3Data({ ...step3Data, city: selectedCity });
                    setSearchTerm(selectedCity);
                    setSuggestions([]);
                    setSessionToken(uuidv4()); // Reset session token after selection
                } else {
                    setMessage({
                        type: 'error',
                        title: 'Error',
                        text: 'Could not extract city from selection.',
                    });
                }
            } else {
                setMessage({
                    type: 'error',
                    title: 'Error',
                    text: response.data.error_message || 'Failed to fetch place details.',
                });
            }
        } catch (error) {
            console.error('Handle Select Error:', error);
            setMessage({
                type: 'error',
                title: 'Error',
                text: 'An unexpected error occurred during selection.',
            });
        }
    };

    return (
        <View style={{ backgroundColor: '#fafafa', height: '100%', paddingHorizontal: 20 }}>


            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', }}>
                <Text style={{ fontSize: 18, textAlign: 'center', fontFamily: 'Rubik-Bold', color: '#234F68' }}>
                    Add Property To Sell
                </Text>
                <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', backgroundColor: '#f4f2f7', borderRadius: 50, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                    <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
                </TouchableOpacity>
                {/* <TouchableOpacity onPress={() => router.push('/notifications')}>
                    <Image source={icons.bell} className='size-6' />
                </TouchableOpacity> */}
            </View>

            <View style={styles.container}>
                <ProgressSteps>
                    <ProgressStep label="General"
                        nextBtnTextStyle={buttonNextTextStyle}
                        nextBtnText="Next"
                        previousBtnText="Back"
                        onNext={() => onNextStep(1)}
                        errors={errors}
                    >
                        <View style={styles.stepContent}>
                            <Text style={[styles.label, step1Errors.property_name && { color: 'red' }]}>Property Title</Text>
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
                            <Text style={[styles.label, step1Errors.description && { color: 'red' }]}>Property Description</Text>
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
                            <Text style={[styles.label, step1Errors.mainImage && { color: 'red' }]}>Property Thumbnail</Text>
                            <View className="flex-row items-center">
                                <TouchableOpacity onPress={() => openSourceModal('mainImage')} style={styles.dropbox}>
                                    <Ionicons name="image-outline" size={24} color="#234F68" style={styles.inputIcon} />
                                    <Text style={{ marginStart: 10 }}>Upload Thumbnail</Text>
                                </TouchableOpacity>
                                {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}
                            </View>
                        </View>

                        <View style={styles.stepContent}>
                            {/* <Text style={[styles.label, step1Errors.purpose && { color: 'red' }]}>Select Purpose</Text>
                            <View style={styles.categoryContainer}>
                                {Array.isArray(propertyfor) &&
                                    propertyfor.map((item, index) => (
                                        <TouchableOpacity
                                            key={index} // using index since your array doesn’t have `id`
                                            style={[
                                                styles.categoryButton,
                                                selectedPropertyFor === item.value && styles.categoryButtonSelected,
                                            ]}
                                            onPress={() => setSelectedPropertyFor(item.value)}
                                        >
                                            <Text
                                                style={[
                                                    styles.categoryText,
                                                    selectedPropertyFor === item.value && styles.categoryTextSelected,
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </View> */}


                            <Text style={[styles.label, step1Errors.category && { color: 'red' }]}>Select Category</Text>
                            <View style={styles.categoryContainer}>
                                {Array.isArray(categoryData) &&
                                    categoryData.map((category) => (
                                        <TouchableOpacity
                                            key={category.id}
                                            style={[
                                                styles.categoryButton,
                                                selectedCategory === category.label && styles.categoryButtonSelected,
                                            ]}
                                            onPress={() => {
                                                setSelectedCategory(category.label);
                                                setSelectedSubCategory(null); // reset subcategory when category changes
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.categoryText,
                                                    selectedCategory === category.label && styles.categoryTextSelected,
                                                ]}
                                            >
                                                {category.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                            </View>

                            {/* Show subcategory only when category is selected */}
                            {selectedCategory && (
                                <>
                                    <Text style={[styles.label, step1Errors.subcategory && { color: 'red' }]}>Select Sub Category</Text>
                                    <View style={styles.categoryContainer}>
                                        {Array.isArray(subcategoryOptions[selectedCategory]) &&
                                            subcategoryOptions[selectedCategory].map((subcategory) => (
                                                <TouchableOpacity
                                                    key={subcategory.value}
                                                    style={[
                                                        styles.categoryButton,
                                                        selectedSubCategory === subcategory.value &&
                                                        styles.categoryButtonSelected,
                                                    ]}
                                                    onPress={() => setSelectedSubCategory(subcategory.value)}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.categoryText,
                                                            selectedSubCategory === subcategory.value &&
                                                            styles.categoryTextSelected,
                                                        ]}
                                                    >
                                                        {subcategory.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                    </View>
                                </>
                            )}
                        </View>


                        <View style={styles.stepContent}>
                            <Text style={[styles.label, step1Errors.nearbylocation && { color: 'red' }]}>Near By Locations</Text>
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
                        onNext={() => onNextStep(2)}
                        errors={errors}
                    >
                        <View style={styles.stepContent}>
                            <Text style={[styles.label, step2Errors.approxrentalincome && { color: 'red' }]}>Approx Rental Income</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="pricetag-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="Enter approx rental income"
                                    value={formatIndianNumber(step2Data.approxrentalincome)}
                                    onChangeText={text => {
                                        const numericText = text.replace(/[^0-9]/g, '');
                                        setStep2Data(prevState => ({ ...prevState, approxrentalincome: numericText }));
                                    }}
                                />
                            </View>
                        </View>

                        <View style={styles.stepContent}>
                            <Text style={[styles.label, step2Errors.price && { color: 'red' }]}>Current Property Price</Text>
                            <View style={styles.inputContainer}>
                                <FontAwesome name="rupee" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    keyboardType="numeric"
                                    placeholder="Enter current price"
                                    value={formatIndianNumber(step2Data.price)}
                                    onChangeText={text => {
                                        const numericText = text.replace(/[^0-9]/g, '');
                                        setStep2Data(prevState => ({ ...prevState, price: numericText }));
                                    }}
                                />
                            </View>
                        </View>

                        {/* <View style={styles.stepContent}>
                            <View className='flex-row justify-between items-center'>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={[styles.label, step2Errors.historydate && { color: 'red' }]}>Historical Price</Text>
                                    <View style={styles.inputContainer}>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Historical Price"
                                            value={formatIndianNumber(historyPrice)}
                                            keyboardType="numeric"
                                            onChangeText={text => {
                                                const numericText = text.replace(/[^0-9]/g, '');
                                                setHistoryPrice(numericText);
                                            }}
                                        />
                                    </View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, step2Errors.historydate && { color: 'red' }]}>Historical Date</Text>
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
                        </View> */}

                    </ProgressStep>

                    <ProgressStep label="Details"
                        nextBtnText="Next"
                        previousBtnText="Back"
                        nextBtnTextStyle={buttonNextTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}
                        onNext={() => onNextStep(3)}
                        errors={errors}
                    >
                        <View style={styles.stepContent}>
                            <View className='flex flex-row items-center'>
                                <Text style={[styles.label, step3Errors.amenities && { color: 'red' }]}>Features & Amenities</Text>
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

                        {(selectedSubCategory !== 'Plot' && selectedSubCategory !== 'Land') && (
                            <View style={styles.stepContent}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1, marginRight: 5 }}>
                                        <Text style={[styles.label, step3Errors.floor && { color: 'red' }]}>Floor</Text>
                                        <View style={styles.inputContainer}>
                                            <MaterialCommunityIcons name="floor-plan" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                            <TextInput style={styles.input} placeholder="Floor" keyboardType="numeric" value={step3Data.floor} onChangeText={text => setStep3Data({ ...step3Data, floor: text })} />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, marginRight: 5 }}>
                                        <Text style={[styles.label, step3Errors.bathroom && { color: 'red' }]}>Bathroom</Text>
                                        <View style={styles.inputContainer}>
                                            <MaterialCommunityIcons name="bathtub-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                            <TextInput style={styles.input} placeholder="Bathroom" keyboardType="numeric" value={step3Data.bathroom} onChangeText={text => setStep3Data({ ...step3Data, bathroom: text })} />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, step3Errors.bedroom && { color: 'red' }]}>Bedroom</Text>
                                        <View style={styles.inputContainer}>
                                            <MaterialCommunityIcons name="bed-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                            <TextInput style={styles.input} placeholder="Bedrooms" keyboardType="numeric" value={step3Data.bedroom} onChangeText={text => setStep3Data({ ...step3Data, bedroom: text })} />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={styles.stepContent}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, }}>
                                    <Text style={[styles.label, step3Errors.landArea && { color: 'red' }]}>Land Area</Text>
                                    <View style={styles.inputContainer}>
                                        <MaterialIcons name="zoom-out-map" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                        <TextInput style={styles.input} placeholder="Land area" keyboardType="numeric" value={landArea} onChangeText={(value) => setLandArea(value)} />
                                        <View style={styles.unitpickerContainer}>
                                            <RNPickerSelect
                                                onValueChange={(value) => setSelectedUnit(value)}
                                                items={units}
                                                value={selectedUnit}
                                                style={pickerSelectStyles}
                                                placeholder={{ label: 'Choose an unit...', value: null }}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <View style={styles.stepContent}>
                            <View style={{ flex: 1, marginLeft: 5 }}>
                                <Text style={[styles.label, step3Errors.city && { color: 'red' }]}>City</Text>
                                <View style={styles.inputContainer}>
                                    <MaterialCommunityIcons name="city-variant-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                    <TextInput style={styles.input} placeholder="Enter City" onChangeText={handleSearch} value={step3Data.city} />
                                </View>
                            </View>

                            {message.text && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{message.title}: {message.text}</Text>
                                </View>
                            )}
                            {suggestions.length > 0 && (
                                <FlatList
                                    data={suggestions}
                                    keyExtractor={(item) => item.place_id}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.suggestionItem}
                                            onPress={() => handleSelect(item.place_id)}
                                        >
                                            <Text style={styles.suggestionText}>{item.description}</Text>
                                        </TouchableOpacity>
                                    )}
                                    style={styles.suggestionsList}
                                />
                            )}


                            <Text style={[styles.label, step3Errors.officeaddress && { color: 'red' }]}>Property Address</Text>
                            <TextInput
                                style={styles.textarea}
                                placeholder="Enter complete address"
                                value={step3Data.officeaddress}
                                onChangeText={text => setStep3Data({ ...step3Data, officeaddress: text })}
                                multiline
                                numberOfLines={5}
                                maxLength={120}
                            />
                        </View>
                        <View style={styles.stepContent}>
                            <Text style={[styles.label, step3Errors.fullAddress && { color: 'red' }]}>Find Location on Google Map</Text>
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
                                {/* <View className='flex-col bg-primary-100 rounded-lg mt-2 p-2'>
                                    <Text className='font-rubik-medium'>Latitude: {coordinates.latitude || "Not set"}</Text>
                                    <Text className='font-rubik-medium'>Longitude: {coordinates.longitude || "Not set"}</Text>
                                </View> */}
                            </View>
                        </View>
                    </ProgressStep>

                    <ProgressStep label="Files"
                        finishBtnText="Save"
                        previousBtnText="Back"
                        nextBtnTextStyle={buttonNextTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}
                        onSubmit={handleFormSubmission}>
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
                            <Text style={[styles.label, step4Errors.galleryImages && { color: 'red' }]}>Property Gallery</Text>
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
                            <TouchableOpacity onPress={() => openSourceModal('galleryImages')} style={styles.dropbox}>
                                <Ionicons name="images-outline" size={24} color="#234F68" style={styles.inputIcon} />
                                <Text style={{ textAlign: 'center' }}>Pick property images</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Upload video */}
                        <View style={[styles.label, step4Errors.videos && { color: 'red' }]}>
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

                            <TouchableOpacity onPress={() => openSourceModal('video')} style={styles.dropbox}>
                                <FontAwesome name="file-video-o" size={24} color="#234F68" style={styles.inputIcon} />
                                <Text style={{ textAlign: 'center' }}>Pick property videos</Text>
                            </TouchableOpacity>

                        </View>

                        {/* upload doc */}
                        <View style={[styles.label, step4Errors.propertyDocuments && { color: 'red' }]}>
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
                            <Text style={[styles.label, step4Errors.masterPlanDoc && { color: 'red' }]}>Upload Property Master Plan</Text>
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {modalType === 'video' ? 'Select Video Source' : 'Select Image Source'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                                <Text style={styles.modalCloseText}>×</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalContent}>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.modalOption}
                                onPress={() => {
                                    if (modalType === 'mainImage') pickMainImage('camera');
                                    else if (modalType === 'galleryImages') pickGalleryImages('camera');
                                    else if (modalType === 'video') pickVideo('camera');
                                }}
                            >
                                <View style={styles.modalOptionBackground}>
                                    <Ionicons name="camera-outline" size={40} color="#fff" style={styles.modalOptionIcon} />
                                    <Text style={styles.modalOptionText}>Camera</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.modalOption}
                                onPress={() => {
                                    if (modalType === 'mainImage') pickMainImage('gallery');
                                    else if (modalType === 'galleryImages') pickGalleryImages('gallery');
                                    else if (modalType === 'video') pickVideo('gallery');
                                }}
                            >
                                <View style={styles.modalOptionBackground}>
                                    <Ionicons name="images-outline" size={40} color="#fff" style={styles.modalOptionIcon} />
                                    <Text style={styles.modalOptionText}>Gallery</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <RBSheet
                ref={rbSheetRef}
                animationType="slide"
                height={400}
                openDuration={300}
                closeOnDragDown={true}
                closeOnPressMask={true}
                customStyles={{
                    container: styles.sheetContainer,
                    draggableIcon: styles.draggableIcon,
                }}
                onClose={() => {
                    if (sheetMessage.type === 'success') {
                        resetForm();
                        router.back();
                    }
                }}
            >
                <View style={styles.sheetHeader}>
                    <Text style={[
                        styles.sheetTitle,
                        { color: sheetMessage.type === 'success' ? '#4CAF50' : '#F44336' }
                    ]}>
                        {sheetMessage.title}
                    </Text>
                    <TouchableOpacity
                        style={styles.sheetCloseButton}
                        onPress={() => rbSheetRef.current.close()}
                    >
                        <Feather name="x" size={24} color="#234F68" />
                    </TouchableOpacity>
                </View>
                <View style={styles.sheetContent}>
                    <Feather
                        name={sheetMessage.type === 'success' ? 'check-circle' : 'alert-circle'}
                        size={48}
                        color={sheetMessage.type === 'success' ? '#4CAF50' : '#F44336'}
                        style={styles.sheetIcon}
                    />
                    <Text style={styles.sheetMessageText}>{sheetMessage.message}</Text>
                    <TouchableOpacity
                        style={[
                            styles.sheetActionButton,
                            { backgroundColor: sheetMessage.type === 'success' ? '#4CAF50' : '#F44336' }
                        ]}
                        onPress={() => {
                            rbSheetRef.current.close();
                            if (sheetMessage.type === 'success') {
                                resetForm();
                                router.back();
                            }
                        }}
                    >
                        <Text style={styles.sheetActionButtonText}>
                            {sheetMessage.type === 'success' ? 'Continue' : 'Try Again'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </RBSheet>
        </View>
    )
}

export default Addproperty

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingBottom: 50,
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
    addButton: {
        backgroundColor: '#234F68',
        padding: 10,
        marginTop: 10,
        borderRadius: 5,
    },
    addButtonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        borderEnd: 1,
        borderColor: '#c7c7c7',
        fontWeight: 600,
    },
    unitpickerContainer: {
        width: 110,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '# Conception: f3f4f6',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Rubik-Bold',
        color: '#234F68',
    },
    modalCloseButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#f4f2f7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseText: {
        fontSize: 20,
        color: '#234F68',
        fontWeight: 'bold',
    },
    modalContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalOption: {
        flex: 1,
        marginHorizontal: 10,
    },
    modalOptionBackground: {
        backgroundColor: '#234F68',
        borderRadius: 15,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOptionIcon: {
        marginBottom: 10,
    },
    modalOptionText: {
        fontSize: 16,
        fontFamily: 'Rubik-Regular',
        color: '#fff',
    },
    sheetContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    draggableIcon: {
        backgroundColor: '#D3D3D3',
        width: 40,
        height: 5,
        borderRadius: 3,
        marginVertical: 10,
        alignSelf: 'center',
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    sheetTitle: {
        fontSize: 20,
        fontFamily: 'Rubik-Bold',
        color: '#234F68',
    },
    sheetCloseButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F4F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    sheetIcon: {
        marginBottom: 16,
    },
    sheetMessageText: {
        fontSize: 16,
        fontFamily: 'Rubik-Regular',
        color: '#333333',
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    sheetActionButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '80%',
        alignItems: 'center',
    },
    sheetActionButtonText: {
        fontSize: 16,
        fontFamily: 'Rubik-Medium',
        color: '#FFFFFF',
    },
    suggestionsList: { backgroundColor: '#fff', borderRadius: moderateScale(10), maxHeight: verticalScale(200), width: '100%', marginBottom: verticalScale(10) },
    suggestionItem: { padding: moderateScale(10), borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    suggestionText: { fontFamily: 'Rubik-Regular', color: '#555', fontSize: scale(14) },
    errorContainer: {
        backgroundColor: '#FEE2E2',
        padding: 10,
        borderRadius: 10,
        marginVertical: 10,
    },
    errorText: {
        color: '#B91C1C',
        fontSize: 14,
        fontFamily: 'Rubik-Regular',
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
