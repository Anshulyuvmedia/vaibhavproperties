import { ScrollView, StyleSheet, Text, View, Image, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import images from '@/constants/images';
import icons from '@/constants/icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import axios from 'axios';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast, { BaseToast } from 'react-native-toast-message';
import { Ionicons, Octicons, Feather } from '@expo/vector-icons';

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

            const response = await axios.get(`https://landsquire.in/api/userprofile?id=${parsedUserData.id}`);
            const data = response.data.data;

            setUserId(data.id);
            setUsername(data.username);
            setUsertype(data.user_type);
            setEmail(data.email);
            setPhoneNumber(data.mobilenumber);
            setCompanyName(data.company_name);
            setCompanyDocs(data.company_document ? [data.company_document] : []);

            let profileImage = data.profile;
            if (typeof profileImage === 'number') {
                profileImage = profileImage.toString();
            }

            if (typeof profileImage === 'string' && profileImage.trim() !== '' && profileImage !== 'null' && profileImage !== 'undefined') {
                profileImage = profileImage.startsWith('http')
                    ? profileImage
                    : `https://landsquire.in/adminAssets/images/Users/${profileImage}`;
            } else {
                profileImage = images.avatar;
            }

            setImage(profileImage);
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.adminAssets[0].uri);
        }
    };

    const pickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
                multiple: false,
            });

            if (result.canceled) return;

            const { mimeType, uri, name } = result.adminAssets[0];

            if (!['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(mimeType)) {
                Toast.show({
                    type: 'error',
                    text1: 'Invalid File',
                    text2: 'Please select a PDF or an image file (PNG, JPG, JPEG).',
                });
                return;
            }

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

            const fileUrl = `https://landsquire.in/adminAssets/images/Users/${fileName}`;
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

            if (image && image.startsWith('file://')) {
                formData.append('myprofileimage', {
                    uri: image,
                    name: 'profile.jpg',
                    type: 'image/jpeg',
                });
            }

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

            const response = await axios.post(
                `https://landsquire.in/api/updateuserprofile/${userId}`,
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
                fetchProfileData();
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
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Image source={icons.backArrow} style={styles.backIcon} resizeMode="contain" />
                </TouchableOpacity>
                <Text style={styles.headerText} className="capitalize">Edit {usertype} Profile</Text>
                <View style={styles.placeholder} />
            </View>

            <Toast config={toastConfig} position="top" />

            {loading ? (
                <ActivityIndicator size="large" color="#1F4C6B" style={styles.loadingIndicator} />
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={image ? { uri: image } : images.avatar}
                            style={styles.profileImage}
                            resizeMode="cover"
                        />
                        <TouchableOpacity onPress={pickImage} style={styles.editIconContainer}>
                            <Feather name="edit" size={24} color="#1F4C6B" style={styles.inputIcon} />
                        </TouchableOpacity>
                        <Text style={styles.usernameText} className="capitalize">{username}</Text>
                        <Text style={styles.roleText} className="capitalize">{usertype}</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Username"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#1F4C6B" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="Email Address"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Octicons name="device-mobile" size={20} color="#1F4C6B" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                placeholder="Phone Number"
                                keyboardType="phone-pad"
                            />
                        </View>

                        {usertype === 'agent' && (
                            <>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="business-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        value={companyName}
                                        onChangeText={setCompanyName}
                                        placeholder="Company Name"
                                    />
                                </View>

                                <Text style={styles.label}>Company Document</Text>
                                {companyDocs.length > 0 ? (
                                    companyDocs.map((doc, index) => {
                                        const fileName = typeof doc === "string" ? doc : doc.name;
                                        const displayFileName = fileName.length > 15 ? `${fileName.substring(0, 15)}...` : fileName;
                                        const fileExtension = fileName.split('.').pop();

                                        return (
                                            <View key={index} style={styles.docContainer}>
                                                <Image
                                                    source={{ uri: "https://cdn-icons-png.flaticon.com/512/337/337946.png" }}
                                                    style={styles.docThumbnail}
                                                    resizeMode="contain"
                                                />
                                                <Text style={styles.docText}>{displayFileName}.{fileExtension}</Text>
                                                <TouchableOpacity
                                                    onPress={() => openFileInBrowser(typeof doc === 'string' ? doc : doc.name)}
                                                    style={styles.viewDocButton}
                                                >
                                                    <Text style={styles.viewDocText}>View</Text>
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })
                                ) : (
                                    <Text style={styles.noDocText}>No document available</Text>
                                )}

                                <TouchableOpacity onPress={pickDocument} style={styles.uploadButton}>
                                    <Text style={styles.uploadText}>Change Company Document</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                </ScrollView>
            )}
            <View className='px-4'>
                <TouchableOpacity onPress={handleSubmit} style={styles.submitButton} disabled={loading}>
                    <Text style={styles.submitButtonText}>
                        {loading ? 'Updating...' : 'Update Profile'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default EditProfile;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fafafa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backButton: {
        backgroundColor: '#e5e7eb',
        borderRadius: 20,
        padding: 8,
    },
    backIcon: {
        width: 20,
        height: 20,
    },
    headerText: {
        fontSize: 20,
        fontFamily: 'Rubik-Bold',
        color: '#1F4C6B',
    },
    placeholder: {
        width: 40, // Placeholder to balance the header layout
    },
    loadingIndicator: {
        marginTop: 50,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    profileImageContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: '#1F4C6B',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: 60,
        right: '35%',
        // backgroundColor: '#1F4C6B',
        borderRadius: 15,
        padding: 5,
    },
    editIcon: {
        width: 20,
        height: 20,
    },
    usernameText: {
        fontSize: 18,
        fontFamily: 'Rubik-Bold',
        color: '#1F4C6B',
        marginTop: 10,
    },
    roleText: {
        fontSize: 16,
        fontFamily: 'Rubik-Regular',
        color: '#555',
        marginTop: 5,
    },
    formContainer: {
        marginTop: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        marginBottom: 10,
        padding: 10,
    },
    inputIcon: {
        marginLeft: 10,
    },
    input: {
        flex: 1,
        height: 45,
        paddingHorizontal: 10,
        fontFamily: 'Rubik-Regular',
        color: '#333',
    },
    label: {
        fontSize: 16,
        fontFamily: 'Rubik-Medium',
        color: '#1F4C6B',
        marginVertical: 5,
    },
    docContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    docThumbnail: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    docText: {
        flex: 1,
        fontFamily: 'Rubik-Regular',
        color: '#333',
    },
    viewDocButton: {
        padding: 5,
    },
    viewDocText: {
        color: '#1F4C6B',
        fontFamily: 'Rubik-Medium',
        textDecorationLine: 'underline',
    },
    noDocText: {
        fontFamily: 'Rubik-Regular',
        color: '#555',
        marginBottom: 10,
    },
    uploadButton: {
        backgroundColor: '#e5e7eb',
        borderRadius: 5,
        padding: 10,
        alignItems: 'center',
        marginBottom: 20,
    },
    uploadText: {
        color: '#1F4C6B',
        fontFamily: 'Rubik-Medium',
    },
    submitButton: {
        backgroundColor: '#8BC83F',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        marginVertical: 20,
    },
    submitButtonText: {
        fontSize: 16,
        fontFamily: 'Rubik-Medium',
        color: 'white',
    },
});