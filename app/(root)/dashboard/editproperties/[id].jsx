import { Image, StyleSheet, Text, ScrollView, TouchableOpacity, View, TextInput, FlatList, Platform, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import icons from '@/constants/icons';
import { ProgressSteps, ProgressStep } from 'react-native-progress-steps';
import * as ImagePicker from 'expo-image-picker';
import RNPickerSelect from 'react-native-picker-select';
import { router, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from "react-native-maps";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import Constants from "expo-constants";
import 'react-native-get-random-values';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import RBSheet from 'react-native-raw-bottom-sheet';
import { Ionicons, MaterialCommunityIcons, Feather, AntDesign, MaterialIcons, FontAwesome } from '@expo/vector-icons';

const Editproperty = () => {
    const { id } = useLocalSearchParams();
    const navigation = useNavigation();

    const GOOGLE_MAPS_API_KEY = Constants.expoConfig.extra.GOOGLE_MAPS_API_KEY;
    const [step1Data, setStep1Data] = useState({ property_name: '', description: '', nearbylocation: '' });
    const [step2Data, setStep2Data] = useState({ approxrentalincome: '', historydate: [], price: '' });
    const [step3Data, setStep3Data] = useState({ sqfoot: '', bathroom: '', floor: '', city: '', officeaddress: '', bedroom: '' });
    const [isValid, setIsValid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [propertyData, setPropertyData] = useState([]);
    const [propertyDocuments, setPropertyDocuments] = useState([]);
    const [masterPlanDoc, setMasterPlanDoc] = useState([]);
    const [errors, setErrors] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("unpublished");
    const [mainImage, setMainImage] = useState(null);
    const [amenity, setAmenity] = useState([]);
    const [amenities, setAmenities] = useState([]);
    const [successVisible, setSuccessVisible] = useState(false);
    const [errorVisible, setErrorVisible] = useState(false);
    const [historyPrice, setHistoryPrice] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [show, setShow] = useState(false);
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
    const [errorField, setErrorField] = useState(null);
    const [videos, setVideos] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    // Use useRef for RBSheet
    const successSheetRef = useRef(null);
    const errorSheetRef = useRef(null);

    const buttonPreviousTextStyle = {
        paddingHorizontal: 20,
        paddingVertical: 5,
        borderRadius: 25,
        backgroundColor: '#234F68',
        color: 'white',
        marginTop: 10, // Add margin to prevent overlap
    };
    const buttonNextTextStyle = {
        paddingHorizontal: 20,
        paddingVertical: 5,
        borderRadius: 25,
        backgroundColor: '#8bc83f',
        color: 'white',
        marginTop: 10, // Add margin to prevent overlap
    };
    const buttonFinishTextStyle = {
        paddingHorizontal: 20,
        paddingVertical: 5,
        borderRadius: 25,
        backgroundColor: '#8bc83f',
        color: 'white',
        marginTop: 10, // Align with next button
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

    const [visibleData, setVisibleData] = useState(step2Data.historydate.slice(0, 10));
    const [currentIndex, setCurrentIndex] = useState(10);

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

    const validateStep = (step) => {
        if (step === 1) {
            if (!step1Data.property_name) { setErrorField('Property Title'); setErrorVisible(true); return false; }
            if (!step1Data.description) { setErrorField('Property Description'); setErrorVisible(true); return false; }
            if (!step1Data.nearbylocation) { setErrorField('Near By Locations'); setErrorVisible(true); return false; }
            return true;
        }
        if (step === 2) {
            if (!step3Data.sqfoot) { setErrorField('Square Foot'); setErrorVisible(true); return false; }
            if (!step3Data.bathroom) { setErrorField('Bathroom'); setErrorVisible(true); return false; }
            if (!step3Data.floor) { setErrorField('Floor'); setErrorVisible(true); return false; }
            if (!step3Data.city) { setErrorField('City'); setErrorVisible(true); return false; }
            return true;
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
            setErrorField('Permissions');
            setErrorVisible(true);
            return false;
        }
        return true;
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

    const handleDateChange = (event, date) => {
        setShow(false);
        if (date) {
            const formattedDate = date.toLocaleDateString("en-GB");
            setSelectedDate(formattedDate);
        }
    };

    const formatDate = (dateString) => {
        const [day, month, year] = dateString.split("/");
        return `${year}-${month}-${day}`;
    };

    const addPriceHistory = () => {
        if (selectedDate && historyPrice) {
            const newHistoryEntry = {
                dateValue: formatDate(selectedDate),
                priceValue: historyPrice
            };
            setStep2Data((prevData) => {
                const updatedHistory = [newHistoryEntry, ...prevData.historydate];
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
        setVisibleData((prevData) => prevData.filter((_, i) => i !== index));
    };

    const pickGalleryImages = async () => {
        if (!(await requestPermissions())) return;
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.5,
        });

        if (!result.canceled && result.assets?.length) {
            const selectedImages = result.assets.map(image => image.uri);
            setGalleryImages(prevImages => [...prevImages, ...selectedImages]);
        }
    };

    const pickVideo = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsMultipleSelection: true,
        });

        if (!result.canceled) {
            const defaultThumbnail = typeof icons.videofile === "number"
                ? Image.resolveAssetSource(icons.videofile).uri
                : icons.videofile;
            const selectedVideos = result.assets.map(video => ({
                id: video.uri,
                uri: video.uri,
                thumbnailImages: defaultThumbnail,
            }));
            setVideos(prevVideos => [...new Set([...prevVideos, ...selectedVideos])]);
        }
    };

    const pickDocument = async () => {
        let result = await DocumentPicker.getDocumentAsync({
            type: 'application/pdf',
            multiple: true,
        });

        if (!result.canceled) {
            const selectedDocuments = Array.isArray(result.assets) ? result.assets : [result];
            const newDocuments = selectedDocuments.map(doc => ({
                uri: doc.uri,
                name: doc.name || 'Unnamed Document',
                thumbnail: 'https://cdn-icons-png.flaticon.com/512/337/337946.png',
            }));
            setPropertyDocuments(prevDocs => [...prevDocs, ...newDocuments]);
        }
    };

    const pickMasterPlan = async () => {
        let result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            multiple: true,
        });

        if (!result.canceled) {
            const selectedDocuments = Array.isArray(result.assets) ? result.assets : [result];
            const newDocuments = selectedDocuments.map(doc => ({
                uri: doc.uri,
                name: doc.name || 'Unnamed Document',
                thumbnail: doc.mimeType.startsWith('image') ? doc.uri : 'https://cdn-icons-png.flaticon.com/512/337/337946.png',
            }));
            setMasterPlanDoc(prevDocs => [...prevDocs, ...newDocuments]);
        }
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

    const removeGalleryImage = async (index, imageUri) => {
        setGalleryImages(prevImages => prevImages.filter((_, i) => i !== index));
        if (imageUri.startsWith("http")) {
            try {
                await axios.post("https://vaibhavproperties.cigmafeed.in/api/deletefile", {
                    property_id: propertyData.id,
                    file_type: "gallery",
                    file_path: imageUri.replace("https://vaibhavproperties.cigmafeed.in/", ""),
                });
            } catch (error) {
                console.error("Failed to delete image:", error);
            }
        }
    };

    const removeVideo = async (index, videoUri) => {
        setVideos(prevVideos => prevVideos.filter((_, i) => i !== index));
        if (videoUri.startsWith("http")) {
            try {
                await axios.post("https://vaibhavproperties.cigmafeed.in/api/deletefile", {
                    property_id: propertyData.id,
                    file_type: "video",
                    file_path: videoUri.replace("https://vaibhavproperties.cigmafeed.in/", ""),
                });
            } catch (error) {
                console.error("Failed to delete video:", error);
            }
        }
    };

    const removeDocument = async (index, docUri) => {
        setPropertyDocuments(prevDocs => prevDocs.filter((_, i) => i !== index));
        if (docUri.startsWith("http")) {
            try {
                await axios.post("https://vaibhavproperties.cigmafeed.in/api/deletefile", {
                    property_id: propertyData.id,
                    file_type: "document",
                    file_path: docUri.replace("https://vaibhavproperties.cigmafeed.in/", ""),
                });
            } catch (error) {
                console.error("Failed to delete document:", error);
            }
        }
    };

    const removeMasterPlan = async (index, docUri) => {
        setMasterPlanDoc(prevDocs => prevDocs.filter((_, i) => i !== index));
        if (docUri.startsWith("http")) {
            try {
                await axios.post("https://vaibhavproperties.cigmafeed.in/api/deletefile", {
                    property_id: propertyData.id,
                    file_type: "masterplan",
                    file_path: docUri.replace("https://vaibhavproperties.cigmafeed.in/", ""),
                });
            } catch (error) {
                console.error("Failed to delete master plan document:", error);
            }
        }
    };

    const handleMapPress = (e) => {
        if (!e?.nativeEvent?.coordinate) return;
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setRegion({
            latitude,
            longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.0121,
        });
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
            return null;
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            console.log('Starting handleSubmit, successSheetRef:', successSheetRef.current);
            const { userData, userToken } = await getUserData();
            if (!userData || !userToken) {
                throw new Error("User is not authenticated. Token missing.");
            }
            const propertyId = propertyData?.id ?? id;
            const { id: userId, user_type } = userData;

            const formData = new FormData();
            [step1Data, step2Data, step3Data].forEach(data => {
                Object.entries(data).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formData.append(key, value);
                    }
                });
            });

            formData.append("bedroom", step3Data?.bedroom ?? "");
            formData.append("category", selectedCategory ?? "");
            formData.append("status", selectedStatus ?? "");
            formData.append("roleid", userId ?? "");
            formData.append("usertype", user_type ?? "");
            formData.append("amenities", JSON.stringify(amenities));
            formData.append("historydate", step2Data?.historydate ? JSON.stringify(step2Data.historydate) : "[]");
            formData.append("location", JSON.stringify({
                Latitude: coordinates.latitude,
                Longitude: coordinates.longitude,
            }));

            if (mainImage && !mainImage.startsWith("http")) {
                const fileType = mainImage.split('.').pop();
                formData.append("thumbnailImages", {
                    uri: mainImage,
                    name: `thumbnail.${fileType}`,
                    type: `image/${fileType}`,
                });
            }

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

            const fileData = {
                galleryImages: galleryImages.filter(img => !img.startsWith("http")),
                propertyvideos: videos.filter(vid => vid.uri && !vid.uri.startsWith("http")),
                thumbnailImages: mainImage && !mainImage.startsWith("http") ? [mainImage] : [],
                documents: propertyDocuments.filter(doc => doc.uri && !doc.uri.startsWith("http")),
                masterplandocument: masterPlanDoc.filter(doc => doc.uri && !doc.uri.startsWith("http")),
            };
            formData.append("fileData", JSON.stringify(fileData));

            const response = await axios.post(`https://vaibhavproperties.cigmafeed.in/api/updatelisting/${propertyId}`, formData, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "multipart/form-data; charset=utf-8",
                    "Authorization": `Bearer ${userToken}`
                },
            });

            // console.log('API response:', response.data);
            if (response.status === 200 && !response.data.error) {
                console.log('Setting successVisible to true');
                setSuccessVisible(true);
            } else {
                console.log('Setting errorVisible to true, message:', response.data.message);
                setErrorField(response.data.message || "Unknown error");
                setErrorVisible(true);
            }
        } catch (error) {
            console.error('handleSubmit error:', error);
            setErrorField(error.message || "Failed to update property");
            setErrorVisible(true);
        } finally {
            console.log('Setting loading to false');
            setLoading(false);
        }
    };

    const fetchPropertyData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`https://vaibhavproperties.cigmafeed.in/api/property-details/${id}`);
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
                let parsedAmenities = fetchedAmenities;
                if (typeof fetchedAmenities === "string") {
                    try {
                        parsedAmenities = JSON.parse(fetchedAmenities);
                    } catch (error) {
                        console.error("Error parsing amenities:", error);
                        parsedAmenities = [];
                    }
                }
                if (Array.isArray(parsedAmenities)) {
                    setAmenities([...parsedAmenities]);
                }

                if (apiData.maplocations) {
                    try {
                        const locationData = JSON.parse(apiData.maplocations);
                        const latitude = parseFloat(locationData.Latitude);
                        const longitude = parseFloat(locationData.Longitude);
                        if (latitude && longitude) {
                            setCoordinates({ latitude, longitude });
                            setRegion({
                                latitude,
                                longitude,
                                latitudeDelta: 0.015,
                                longitudeDelta: 0.0121,
                            });
                        }
                    } catch (error) {
                        console.error("Error parsing map locations:", error);
                    }
                }

                if (apiData.gallery) {
                    try {
                        let galleryArray = typeof apiData.gallery === 'string' ? JSON.parse(apiData.gallery) : apiData.gallery;
                        const galleryImages = galleryArray.map(img =>
                            img.startsWith('http') ? img : `https://vaibhavproperties.cigmafeed.in/${img}`
                        );
                        setGalleryImages(galleryImages);
                    } catch (error) {
                        console.error("Error processing gallery images:", error);
                    }
                }

                if (apiData.videos) {
                    try {
                        let galleryVideos = typeof apiData.videos === 'string' ? JSON.parse(apiData.videos) : apiData.videos;
                        const defaultThumbnail = typeof icons.videofile === "number"
                            ? Image.resolveAssetSource(icons.videofile).uri
                            : icons.videofile;
                        const videoObjects = galleryVideos.map(video => ({
                            id: video,
                            uri: video.startsWith('http') ? video : `https://vaibhavproperties.cigmafeed.in/${video}`,
                            thumbnailImages: defaultThumbnail,
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
                                uri: uri.startsWith('http') ? uri : `https://vaibhavproperties.cigmafeed.in/${uri}`,
                                name: uri.split('/').pop() || 'Unnamed Document',
                                thumbnail: 'https://cdn-icons-png.flaticon.com/512/337/337946.png',
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
                            : [apiData.masterplandoc];
                        setMasterPlanDoc(
                            masterPlanDocs.map(filePath => ({
                                uri: filePath.startsWith('http') ? filePath : `https://vaibhavproperties.cigmafeed.in/${filePath}`,
                                name: filePath.split('/').pop() || 'Unnamed Document',
                                thumbnail: filePath.endsWith('.pdf')
                                    ? 'https://cdn-icons-png.flaticon.com/512/337/337946.png'
                                    : `https://vaibhavproperties.cigmafeed.in/${filePath}`,
                            }))
                        );
                    } catch (error) {
                        console.error("Error processing masterplandoc:", error);
                    }
                }

                let priceHistoryData = apiData.pricehistory;
                if (typeof priceHistoryData === "string") {
                    try {
                        priceHistoryData = JSON.parse(priceHistoryData);
                    } catch (error) {
                        console.error("Error parsing pricehistory:", error);
                        priceHistoryData = [];
                    }
                }
                if (Array.isArray(priceHistoryData)) {
                    priceHistoryData.sort((a, b) => new Date(b.dateValue) - new Date(a.dateValue));
                    setStep2Data((prevData) => ({
                        ...prevData,
                        historydate: priceHistoryData.map(item => ({
                            dateValue: item.dateValue,
                            priceValue: item.priceValue.toString(),
                        })),
                    }));
                }

                if (apiData.thumbnail) {
                    setMainImage(
                        apiData.thumbnail.startsWith('http')
                            ? apiData.thumbnail
                            : `https://vaibhavproperties.cigmafeed.in/assets/images/Listings/${apiData.thumbnail}`
                    );
                }
            }
        } catch (error) {
            console.error('Error fetching property data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Lifecycle and navigation debugging
    // useEffect(() => {
    //     console.log('Editproperty component mounted');
    //     console.log('Success RBSheet mounted, ref:', successSheetRef.current);
    //     console.log('Error RBSheet mounted, ref:', errorSheetRef.current);
    //     return () => {
    //         console.log('Editproperty component unmounted');
    //         console.log('Success RBSheet unmounted');
    //         console.log('Error RBSheet unmounted');
    //     };
    // }, []);

    // Navigation state listener
    useEffect(() => {
        const unsubscribe = navigation.addListener('state', (e) => {
            // console.log('Navigation state changed:', e.data);
        });
        return unsubscribe;
    }, [navigation]);

    // Open RBSheet when state changes
    useEffect(() => {
        if (successVisible && successSheetRef.current) {
            // console.log('Opening success sheet via useEffect, ref:', successSheetRef.current);
            successSheetRef.current.open();
        } else if (successVisible) {
            console.log('Success sheet ref is null when trying to open via useEffect');
        }
    }, [successVisible]);

    useEffect(() => {
        if (errorVisible && errorSheetRef.current) {
            console.log('Opening error sheet via useEffect, ref:', errorSheetRef.current);
            errorSheetRef.current.open();
        } else if (errorVisible) {
            console.log('Error sheet ref is null when trying to open via useEffect');
        }
    }, [errorVisible]);

    useEffect(() => {
        if (id) {
            fetchPropertyData();
        }
    }, [id]);

    if (loading) {
        return <ActivityIndicator size="large" color="#8bc83f" style={{ marginTop: 400 }} />;
    }

    if (!propertyData) {
        return <ActivityIndicator size="large" color="#8bc83f" style={{ marginTop: 400 }} />;
    }

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
        <View style={{ backgroundColor: '#fafafa', height: '100%', paddingHorizontal: 20 }}>
            {/* Test button for debugging */}
            {/* <TouchableOpacity
                style={{ backgroundColor: '#28a745', padding: 10, borderRadius: 10, marginTop: 20 }}
                onPress={() => {
                    console.log('Test opening success sheet, ref:', successSheetRef.current);
                    if (successSheetRef.current) {
                        successSheetRef.current.open();
                    } else {
                        console.log('Success sheet ref is null');
                    }
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Test Success Sheet</Text>
            </TouchableOpacity> */}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 18, marginRight: 10, textAlign: 'center', fontFamily: 'Rubik-Bold', color: '#234F68' }}>
                    Edit Property
                </Text>
                <TouchableOpacity
                    onPress={() => {
                        console.log('Back button pressed');
                        router.back();
                    }}
                    style={{ flexDirection: 'row', backgroundColor: '#f3f4f6', borderRadius: 50, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                    <Image source={icons.backArrow} style={{ width: 20, height: 20 }} />
                </TouchableOpacity>
            </View>

            {/* Property Card */}
            <View className="justify-between items-center mt-2 p-3 rounded-3xl flex-row bg-primary-100">
                <View className='flex-row justify-between items-center'>
                    {mainImage && <Image source={{ uri: mainImage }} style={styles.image} />}
                    <View className='ms-2 flex-1'>
                        <Text className="font-rubik-medium text-base">{step1Data.property_name}</Text>
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="location-outline" size={16} color="#234F68" />
                            <Text className="text-base font-rubik text-black ml-1">
                                {step3Data.city}, {step3Data.officeaddress}
                            </Text>
                        </View>
                        <View className="flex-row items-center justify-between mt-1">
                            <Text className="text-base font-rubik text-black-300">
                                {formatINR(step2Data.price)}
                            </Text>
                            <View className="bg-primary-300 rounded-3xl px-3">
                                <Text className="text-base font-rubik text-white">
                                    {selectedCategory}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.container}>
                <ProgressSteps>
                    <ProgressStep
                        label="General"
                        nextBtnTextStyle={buttonNextTextStyle}
                        nextBtnText="Next"
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

                    <ProgressStep
                        label="Price"
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

                    <ProgressStep
                        label="Details"
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

                    <ProgressStep
                        label="Files"
                        finishBtnText="Save"
                        previousBtnText="Back"
                        nextBtnTextStyle={buttonFinishTextStyle}
                        previousBtnTextStyle={buttonPreviousTextStyle}

                        onSubmit={() => {
                            console.log('ProgressSteps onSubmit triggered');
                            handleSubmit();
                        }}
                    >
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
                                            <Text className="text-center font-rubik">Image: {index + 1}</Text>
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
                                <Ionicons name="images-outline" size={24} color="#234F68" style={styles.inputIcon} />
                                <Text style={{ textAlign: 'center' }}>Pick property images</Text>
                            </TouchableOpacity>
                        </View>
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
                                            <Text className="text-center font-rubik">Video {index + 1}</Text>
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
                                <FontAwesome name="file-video-o" size={24} color="#234F68" style={styles.inputIcon} />
                                <Text style={{ textAlign: 'center' }}>Pick property videos</Text>
                            </TouchableOpacity>
                        </View>
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
                                            <Text className="text-center font-rubik">Doc {index + 1}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeDocument(index, item.uri)}
                                                style={styles.deleteButton}>
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
                                            <Text className="text-center font-rubik">Plan {index + 1}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeMasterPlan(index, item.uri)}
                                                style={styles.deleteButton}>
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

            {/* Success RBSheet */}
            <RBSheet
                ref={successSheetRef}
                closeOnDragDown={true}
                closeOnPressMask={true}
                customStyles={{
                    container: {
                        backgroundColor: '#f4f2f7',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 20,
                    },
                }}
                height={300}
                openDuration={250}
            >
                <View style={{ alignItems: 'center' }}>
                    {/* <Ionicons name="checkmark-circle" size={50} color="#28a745" /> */}
                    <Image source={icons.alertSuccess} style={{ width: 100, height: 100 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#28a745', marginTop: 10 }}>
                        Success
                    </Text>
                    <Text style={{ fontSize: 16, textAlign: 'center', marginTop: 10 }}>
                        Property updated successfully!
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: '#28a745', padding: 10, borderRadius: 10, marginTop: 20 }}
                        onPress={() => {
                            // console.log('Closing success sheet');
                            setSuccessVisible(false);
                            if (successSheetRef.current) successSheetRef.current.close();
                            // Optionally navigate: router.push('/some-route');
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </RBSheet>

            {/* Error RBSheet */}
            <RBSheet
                ref={errorSheetRef}
                closeOnDragDown={true}
                closeOnPressMask={true}
                customStyles={{
                    container: {
                        backgroundColor: '#f4f2f7',
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        padding: 20,
                    },
                }}
                height={errorField ? 300 : 200}
                openDuration={250}
            >
                <View style={{ alignItems: 'center' }}>
                    {/* <Ionicons name="close-circle" size={50} color="#dc3545" /> */}
                    <Image source={icons.alertDanger} style={{ width: 100, height: 100 }} />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#dc3545', marginTop: 10 }}>
                        Error
                    </Text>
                    <Text style={{ fontSize: 16, textAlign: 'center', marginTop: 10 }}>
                        {errorField && typeof errorField === 'string' && !errorField.includes('Failed')
                            ? `Please fill the ${errorField} field.`
                            : errorField || 'An error occurred. Please try again.'}
                    </Text>

                    <TouchableOpacity
                        style={{ backgroundColor: '#dc3545', padding: 10, borderRadius: 10, marginTop: 10 }}
                        onPress={() => {
                            // console.log('Closing error sheet');
                            setErrorVisible(false);
                            if (errorSheetRef.current) errorSheetRef.current.close();
                        }}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Close</Text>
                    </TouchableOpacity>
                </View>
            </RBSheet>
        </View>
    );
};

export default Editproperty;

// Styles remain unchanged
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    stepContent: {
        borderWidth: 1,
        backgroundColor: '#fff',
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
    inputIcon: { marginEnd: 10 },
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