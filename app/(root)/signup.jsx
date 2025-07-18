import { View, StyleSheet, Text, Image, TextInput, TouchableOpacity, ScrollView, ImageBackground, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Link } from 'expo-router';
import Constants from "expo-constants";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useNavigation } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import Toast, { BaseToast } from 'react-native-toast-message';
import { Ionicons, Octicons } from '@expo/vector-icons';
import images from '@/constants/images';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';

WebBrowser.maybeCompleteAuthSession();

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [bankName, setBankName] = useState('');
  const [companyDocument, setCompanyDocument] = useState(null);
  const [userType, setUserType] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const ANDROID_CLIENT_ID = Constants.expoConfig?.extra?.ANDROID_CLIENT_ID || '';
  const WEB_CLIENT_ID = Constants.expoConfig?.extra?.WEB_CLIENT_ID || '';
  const navigation = useNavigation();

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({
      native: 'com.investor.investorland:/oauth2redirect/google',
      useProxy: Constants.appOwnership === 'expo',
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

  const handleGoogleSignIn = async (idToken) => {
    try {
      const response = await fetch('https://landsquire.in/api/googleRegister', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_token: idToken,
          user_type: userType,
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
    if (email && password && username && mobile && city && state &&
      (userType === 'user' ||
        (userType === 'broker' && companyName && companyDocument) ||
        (userType === 'bankagent' && bankName))) {
      const formData = new FormData();
      formData.append('user_type', userType);
      formData.append('name', username);
      formData.append('mobile', mobile);
      formData.append('city', city);
      formData.append('state', state);
      formData.append('email', email);
      formData.append('password', password);

      if (userType === 'broker' && companyName && companyDocument) {
        formData.append('company_name', companyName);
        formData.append('company_document', {
          uri: companyDocument.uri,
          name: companyDocument.name,
          type: companyDocument.mimeType || 'application/octet-stream',
        });
      } else if (userType === 'bankagent' && bankName) {
        formData.append('bankname', bankName);
      }

      try {
        const response = await fetch('https://landsquire.in/api/register-user', {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/form-data' },
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          Toast.show({ type: 'success', text1: 'Success', text2: 'User registered successfully!' });
          setUsername('');
          setMobile('');
          setCity('');
          setState('');
          setEmail('');
          setPassword('');
          setCompanyName('');
          setBankName('');
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
    <View style={styles.container}>
      {/* <ImageBackground
        source={images.loginbanner}
        style={styles.backgroundImage}
        resizeMode="cover"
      /> */}
      <View style={styles.headerContainer}>
        <Image
          source={images.applogo}
          style={styles.applogo}
          resizeMode="cover"
        />
        <View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join Us and Explore New Opportunities</Text>
        </View>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity onPress={() => setUserType('user')}>
          <View style={[styles.toggleButton, userType === 'user' ? styles.toggleButtonActive : {}]}>
            <Text style={[styles.toggleText, userType === 'user' ? styles.toggleTextActive : {}]}>User</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setUserType('broker')}>
          <View style={[styles.toggleButton, userType === 'broker' ? styles.toggleButtonActive : {}]}>
            <Text style={[styles.toggleText, userType === 'broker' ? styles.toggleTextActive : {}]}>Broker</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setUserType('bankagent')}>
          <View style={[styles.toggleButton, userType === 'bankagent' ? styles.toggleButtonActive : {}]}>
            <Text style={[styles.toggleText, userType === 'bankagent' ? styles.toggleTextActive : {}]}>Bank Agent</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Toast config={toastConfig} position="top" />
        <View style={styles.formContainer}>
          {userType === 'broker' && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="business-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingLeft: 10 }]}
                  placeholder="Company Name"
                  value={companyName}
                  onChangeText={setCompanyName}
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
                <Text style={[styles.input, { paddingTop: 13, color: '#555' }]}>
                  {companyDocument ? companyDocument.name : "Company Document"}
                </Text>
                <TouchableOpacity onPress={pickDocument} style={styles.uploadButton}>
                  <Text style={styles.uploadText}>Upload</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {userType === 'bankagent' && (
            <View style={styles.inputContainer}>
              <Ionicons name="business-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingLeft: 10 }]}
                placeholder="Bank Name"
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={24} color="#1F4C6B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full name"
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.inputContainer}>
            <Octicons name="device-mobile" size={20} color="#1F4C6B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Mobile No."
              keyboardType="number-pad"
              value={mobile}
              onChangeText={setMobile}
            />
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.inputContainerHalf]}>
              <Ionicons name="location-outline" size={20} color="#1F4C6B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="City"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.inputContainer, styles.inputContainerHalf]}>
              <Ionicons name="map-outline" size={20} color="#1F4C6B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="State"
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#1F4C6B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#1F4C6B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'Placeholder for Terms of Service')}>
              <Text style={styles.termsText}>Terms of service</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showPassword}>{showPassword ? 'Hide password' : 'Show password'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      <Link href="/signin" style={styles.loginLink}>
        <Text style={styles.loginText}>
          Already have an account? <Text style={styles.loginHighlight}>Login now!</Text>
        </Text>
      </Link>
    </View>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa', alignItems: 'center', justifyContent: 'center' },
  scrollContainer: { flexGrow: 1, alignItems: 'center', paddingBottom: verticalScale(20) },
  headerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: verticalScale(10) },
  backgroundImage: { width: '100%', height: 100 },
  applogo: { width: scale(50), height: scale(50), borderRadius: moderateScale(100), marginRight: scale(10) },
  formContainer: { paddingInline: 20, width: '100%', alignItems: 'center' },
  title: { fontSize: scale(20), fontFamily: 'Rubik-Bold', color: '#1F4C6B', textAlign: 'left' },
  subtitle: { fontSize: scale(14), fontFamily: 'Rubik-Regular', color: '#555', textAlign: 'left', marginVertical: verticalScale(5) },
  toggleContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: verticalScale(7) },
  toggleButton: { paddingVertical: verticalScale(4), paddingHorizontal: scale(15), borderRadius: moderateScale(20), borderWidth: 1, borderColor: '#ccc', marginHorizontal: scale(5) },
  toggleButtonActive: { backgroundColor: '#1F4C6B' },
  toggleText: { fontSize: scale(14), fontFamily: 'Rubik-Medium', color: '#555' },
  toggleTextActive: { color: 'white' },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', },
  inputContainer: { flexDirection: 'row', padding: moderateScale(10), alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: moderateScale(10), marginBottom: verticalScale(10), width: '100%' },
  inputContainerHalf: { width: '48%' }, // Half width for city and state inputs
  inputIcon: { marginLeft: scale(10) },
  input: { flex: 1, height: verticalScale(45), paddingHorizontal: scale(10), fontFamily: 'Rubik-Regular' },
  uploadButton: { padding: moderateScale(10) },
  uploadText: { color: '#1e40af', fontFamily: 'Rubik-Medium' },
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: verticalScale(10) },
  termsText: { color: '#1e40af', fontFamily: 'Rubik-Regular' },
  showPassword: { color: '#1e40af', fontFamily: 'Rubik-Regular' },
  registerButton: { backgroundColor: '#8BC83F', borderRadius: moderateScale(10), paddingVertical: verticalScale(14), alignItems: 'center', marginTop: verticalScale(10), width: '100%' },
  registerButtonText: { fontSize: scale(18), fontFamily: 'Rubik-Medium', color: 'white' },
  loginLink: { marginVertical: verticalScale(20), alignItems: 'center' },
  loginText: { fontSize: scale(16), fontFamily: 'Rubik-Regular', color: '#000' },
  loginHighlight: { color: '#1e40af', fontFamily: 'Rubik-Bold' },
});