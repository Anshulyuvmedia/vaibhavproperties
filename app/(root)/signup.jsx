import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import images from '@/constants/images';
import { Link } from 'expo-router';
import Constants from "expo-constants";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useNavigation } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import Toast, { BaseToast } from 'react-native-toast-message';

WebBrowser.maybeCompleteAuthSession();
const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDocument, setCompanyDocument] = useState(null);
  const [isUser, setIsUser] = useState(true);
  const ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.ANDROID_CLIENT_ID || '';
  const WEB_CLIENT_ID = Constants.expoConfig?.extra?.WEB_CLIENT_ID || '';
  const navigation = useNavigation();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      native: 'com.investor.investorland:/oauth2redirect/google',
      useProxy: Constants.appOwnership === 'expo', // Only use proxy in Expo Go
    }),
  });
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleSignIn(id_token);
    }
  }, [response]);

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

  const handleGoogleSignIn = async (idToken) => {
    try {
      const response = await fetch('https://investorlands.com/api/googleRegister', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: idToken,
          user_type: isUser ? 'user' : 'agent',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'You are registered successfully!' });
        navigation.navigate('Home');
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: result.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Google Registration Error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'An unexpected error occurred' });
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

      const selectedFile = result.assets[0];

      if (!['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(selectedFile.mimeType)) {
        Toast.show({ type: 'error', text1: 'Invalid File', text2: 'Please select a PDF or an image file (PNG, JPG, JPEG).' });
        return;
      }

      setCompanyDocument(selectedFile);
    } catch (error) {
      console.error('Document Picker Error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'An error occurred while selecting a document.' });
    }
  };

  const handleRegister = async () => {
    if (email && password && username && mobile && (isUser || (companyName && companyDocument))) {
      const formData = new FormData();
      formData.append('user_type', isUser ? 'user' : 'agent');
      formData.append('name', username);
      formData.append('mobile', mobile);
      formData.append('email', email);
      formData.append('password', password);

      if (!isUser && companyName && companyDocument) {
        formData.append('company_name', companyName);
        formData.append('company_document', {
          uri: companyDocument.uri,
          name: companyDocument.name,
          type: companyDocument.mimeType || 'application/octet-stream',
        });
      }

      try {
        const response = await fetch('https://investorlands.com/api/register-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          Toast.show({ type: 'success', text1: 'Success', text2: 'User registered successfully!' });
          setUsername('');
          setMobile('');
          setEmail('');
          setPassword('');
          setCompanyName('');
          setCompanyDocument(null);

          setTimeout(() => {
            navigation.navigate('signin');
          }, 2000);
        } else {
          Toast.show({ type: 'error', text1: 'Error', text2: result.message || 'Registration failed' });
        }
      } catch (error) {
        console.error('Registration Error:', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'An unexpected error occurred' });
      }
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all required fields' });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Image source={images.appfavicon} className="w-full h-20" resizeMode="contain" />
        <View className='pt-5'>
          <Text className='font-rubik-bold text-center'>Join Us and Explore New Opportunities</Text>
        </View>

        <View className="flex-row justify-around mt-3">
          <TouchableOpacity onPress={() => setIsUser(true)}>
            <View className={`px-10 py-2 rounded-2xl ${isUser ? 'bg-yellow-800' : 'bg-white border'}`}>
              <Text className={`${isUser ? 'text-white' : 'text-black'} font-rubik-bold`} >User</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsUser(false)}>
            <View className={`px-10 py-2 rounded-2xl ${!isUser ? 'bg-yellow-800' : 'bg-white border'}`}>
              <Text className={`${!isUser ? 'text-white' : 'text-black'} font-rubik-bold`}>Agent</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="px-10">
          <Text className="text-lg font-regular text-gray-700 text-center mt-3">
            Register As {isUser ? 'User' : 'Agent'}
          </Text>

          <Text style={styles.label}>Username</Text>
          <TextInput style={styles.input} placeholder="Username" onChangeText={setUsername} />

          <Text style={styles.label}>Mobile No.</Text>
          <TextInput style={styles.input} placeholder="Mobile" onChangeText={setMobile} />

          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />

          {!isUser && (
            <>
              <Text style={styles.label}>Company Name</Text>
              <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Enter company name" />

              <Text style={styles.label}>Company Documents</Text>
              <Text>{companyDocument ? companyDocument.name : "No document selected"}</Text>
              <TouchableOpacity onPress={pickDocument} style={styles.dropbox}>
                <Text style={styles.downloadText}>Add Company Document</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            onPress={handleRegister}
            className="bg-yellow-700 rounded-2xl py-4 mt-5 items-center"
          >
            <Text className="text-lg font-rubik text-white">
              {isUser ? 'Register Now' : 'Sign Up as Agent'}
            </Text>
          </TouchableOpacity>

          {/* <Text style={styles.orText}>Or with</Text>

          <TouchableOpacity onPress={() => promptAsync()} style={styles.googleButton}>
            <View style={styles.googleContent}>
              <Image source={icons.google} style={styles.googleIcon} resizeMode="contain" />
              <Text style={styles.googleText}>Register with Google</Text>
            </View>
          </TouchableOpacity> */}

          <Link href="/signin" style={{ margin: 20, alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: 'Rubik-Regular',
                color: '#00000',
                textAlign: 'center',
              }}
            >
              Already have an account? <Text style={styles.highlight}>Login now!</Text>
            </Text>
          </Link>
        </View>
        <Toast config={toastConfig} position="bottom" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    marginVertical: 5,
  },
  input: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 5,
    fontFamily: 'Rubik-Regular',
  },
  dropbox: {
    backgroundColor: '#e0e0e0',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  downloadText: {
    color: '#8a4c00',
  },
  highlight: { color: '#854d0e' },
  orText: { fontSize: 14, fontFamily: 'Rubik-Regular', color: '#555', textAlign: 'center', marginTop: 30 },
  googleButton: { backgroundColor: 'lightgrey', borderRadius: 50, paddingVertical: 15, marginTop: 20, alignItems: 'center', width: '100%' },
  googleContent: { flexDirection: 'row', alignItems: 'center' },
  googleIcon: { width: 20, height: 20 },
  googleText: { fontSize: 18, fontFamily: 'Rubik-Medium', color: '#333', marginLeft: 10 },
});
