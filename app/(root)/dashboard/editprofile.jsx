import { ScrollView, StyleSheet, Text, View, SafeAreaView, Image, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import images from '@/constants/images';
import icons from '@/constants/icons';
import * as IntentLauncher from 'expo-intent-launcher';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import axios from 'axios';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { BaseToast } from 'react-native-toast-message';

const EditProfile = () => {
    const [image, setImage] = useState(null);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [usertype, setUsertype] = useState('');
    const [companyDocs, setCompanyDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);

    // Fetch existing profile data
    useEffect(() => {

        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const parsedUserData = JSON.parse(await AsyncStorage.getItem('userData'));

            if (!parsedUserData || !parsedUserData.id) {
                await AsyncStorage.removeItem('userData');
                router.push('/signin');
                return;
            }

            const response = await axios.get(`https://investorlands.com/api/userprofile?id=${parsedUserData.id}`);
            const data = response.data.data;
            // console.log(response.data.data);

            setUserId(data.id);
            setUsername(data.name);
            setUsertype(data.user_type);
            setEmail(data.email);
            setPhoneNumber(data.mobile);
            setCompanyName(data.company_name);
            setCompanyDocs(data.company_document ? [data.company_document] : []);

            let profileImage = data.profile_photo_path;

            // 🔹 Ensure profile_photo_path is a valid string before setting it
            if (typeof profileImage === 'number') {
                profileImage = profileImage.toString(); // Convert number to string
            }

            if (typeof profileImage === 'string' && profileImage.trim() !== '' && profileImage !== 'null' && profileImage !== 'undefined') {
                profileImage = profileImage.startsWith('http')
                    ? profileImage
                    : `https://investorlands.com/assets/images/Users/${profileImage}`;
            } else {
                profileImage = images.avatar; // Ensure default image is a valid source
            }

            // console.log('Final Image URL:', profileImage); // Debugging
            setImage(profileImage);
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

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

    // Handle image selection
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    // Handle document selection
    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) return;

            const { mimeType, uri, name } = result.assets[0]; // Ensure correct structure

            if (!['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(mimeType)) {
                Toast.show({
                    type: 'error',
                    text1: 'Invalid File',
                    text2: 'Please select a PDF or an image file (PNG, JPG, JPEG).',
                });
                return;
            }

            // Replace the old document with the new one
            setCompanyDocs([{ uri, name, mimeType }]);

            Toast.show({
                type: 'success',
                text1: 'File Added',
                text2: `${name} has been successfully added.`,
            });

        } catch (error) {
            console.error('Document Picker Error:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'An error occurred while selecting a document.',
            });
        }
    };

    const openFileInBrowser = async (fileName) => {
        try {
            if (!fileName) {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'File not found.',
                });
                return;
            }

            const fileUrl = `https://investorlands.com/assets/images/Users/${fileName}`;
            await Linking.openURL(fileUrl);
        } catch (error) {
            console.error('Error opening file:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Could not open the file.',
            });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('name', username);
            formData.append('email', email);
            formData.append('mobile', phoneNumber);
            formData.append('company_name', companyName);
    
            // ✅ Append image ONLY if it's a local file
            if (image && image.startsWith('file://')) { 
                formData.append('myprofileimage', {
                    uri: image,
                    name: 'profile.jpg',
                    type: 'image/jpeg',
                });
            }
    
            // ✅ Append document if changed
            if (companyDocs.length > 0) {
                const doc = companyDocs[0];
                if (doc.uri && doc.uri.startsWith('file://')) {
                    formData.append('company_document', {
                        uri: doc.uri,
                        name: doc.name || 'document.pdf',
                        type: doc.mimeType || 'application/pdf',
                    });
                }
            }
    
            console.log("Submitting FormData:", formData);
    
            const response = await axios.post(
                `https://investorlands.com/api/updateuserprofile/${userId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Accept': 'application/json',
                    },
                }
            );
    
            if (response.status === 200) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Profile updated successfully!',
                });
    
                fetchProfileData(); // Refresh profile
            } else {
                throw new Error('Unexpected server response.');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            Toast.show({
                type: 'error',
                text1: 'Update Failed',
                text2: 'Could not update profile. Try again later.',
            });
        } finally {
            setLoading(false);
        }
    };
    
    

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Image source={icons.backArrow} style={styles.icon} />
                </TouchableOpacity>
                <Text style={styles.headerText} className="capitalize">Edit {usertype} Profile</Text>
                <View></View>
            </View>
            <Toast config={toastConfig} position="top" />

            {loading ? (
                <ActivityIndicator size="large" color="#8a4c00" style={{ marginTop: 50 }} />
            ) : (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.profileImageContainer}>
                        <Image source={image ? { uri: image } : images.avatar} style={styles.profileImage} />
                        <TouchableOpacity onPress={pickImage} style={styles.editIconContainer}>
                            <Image source={icons.edit} style={styles.editIcon} />
                        </TouchableOpacity>
                        <Text style={styles.roleText} className="capitalize text-black font-rubik-bold">{username}</Text>
                        <Text style={styles.roleText} className="capitalize font-rubik">{usertype}</Text>
                    </View>

                    <View>
                        <Text style={styles.label}>Username</Text>
                        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Enter your name" />

                        <Text style={styles.label}>Email Address</Text>
                        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Enter email address" />

                        <Text style={styles.label}>Phone Number</Text>
                        <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter phone number" />
                        {usertype === 'agent' && (
                            <View>
                                <Text style={styles.label}>Company Name</Text>
                                <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Enter company name" />

                                <Text style={styles.label}>Company Document</Text>
                                {companyDocs.length > 0 ? (
                                    companyDocs.map((doc, index) => {
                                        const fileName = typeof doc === "string" ? doc : doc.name;
                                        const displayFileName = fileName.length > 10 ? `${fileName.substring(0, 10)}...` : fileName;
                                        const fileExtension = fileName.split('.').pop();

                                        return (
                                            <View key={index} style={styles.docItem}>
                                                <Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/337/337946.png" }} style={styles.thumbnail} />
                                                <Text>{displayFileName}.{fileExtension}</Text>
                                                <TouchableOpacity onPress={() => openFileInBrowser(typeof doc === 'string' ? doc : doc.name)} style={styles.dropbox}>
                                                    <Text style={styles.downloadText}>View Document</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text>No document available</Text>
                                )}



                                <TouchableOpacity onPress={pickDocument} style={styles.dropbox}>
                                    <Text style={styles.downloadText}>Change Company Document</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}

            <TouchableOpacity onPress={handleSubmit} style={styles.submitButton} disabled={loading}>
                <Text style={styles.submitButtonText}>{loading ? 'UPDATING...' : 'UPDATE PROFILE'}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

export default EditProfile;

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    backButton: {
        backgroundColor: '#ccc',
        borderRadius: 20,
        padding: 10,
    },
    icon: {
        width: 20,
        height: 20,
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 70,
        right: 135,
    },
    editIcon: {
        width: 30,
        height: 30,
    },
    roleText: {
        fontSize: 16,
        fontWeight: 'normal',
        marginTop: 10,
    },
    label: {
        fontSize: 16,
        marginVertical: 5,
    },
    input: {
        backgroundColor: '#edf5ff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    docItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    thumbnail: {
        width: 50,
        height: 50,
        marginRight: 10,
    },
    dropbox: {
        backgroundColor: '#e0e0e0',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    downloadText: {
        color: 'black',
    },
    submitButton: {
        backgroundColor: '#8a4c00',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 20,
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
