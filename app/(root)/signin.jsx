import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import images from '@/constants/images';
import icons from '@/constants/icons';
import * as WebBrowser from "expo-web-browser";
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import Constants from "expo-constants";
import Toast, { BaseToast } from 'react-native-toast-message';
import Ionicons from '@expo/vector-icons/Ionicons';

WebBrowser.maybeCompleteAuthSession();

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [userInfo, setUserInfo] = useState(null);

  const ANDROID_CLIENT_ID = Constants.expoConfig.extra.ANDROID_CLIENT_ID;
  const WEB_CLIENT_ID = Constants.expoConfig.extra.WEB_CLIENT_ID;
  const IOS_CLIENT_ID = Constants.expoConfig.extra.IOS_CLIENT_ID;
  const FACEBOOK_APP_ID = Constants.expoConfig.extra.FACEBOOK_APP_ID || 'your-facebook-app-id'; // Add to app.json

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

  // Google Auth Request
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
  });

  // Facebook Auth Request
  const [facebookRequest, facebookResponse, facebookPromptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
  });

  // Handle Email Login
  const emaillogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://investorlands.com/api/login-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.data));
        router.push('/'); // Redirect to dashboard
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getUserInfo = async (token, provider) => {
    if (!token) return;

    try {
      let url = provider === 'google'
        ? "https://www.googleapis.com/userinfo/v2/me"
        : "https://graph.facebook.com/me?access_token=" + token;

      const res = await fetch(url, {
        headers: provider === 'google' ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch user data: ${res.status}`);
      }

      const user = await res.json();
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setUserInfo(user);
      router.push('/'); // Redirect to dashboard
    } catch (error) {
      setError("Failed to fetch user data");
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (googleResponse?.type === 'success') {
        const { authentication } = googleResponse;
        if (authentication?.accessToken) {
          await getUserInfo(authentication.accessToken, 'google');
        }
      }
    } catch (error) {
      setError('Google Sign-In Error');
    }
  };

  const signInWithFacebook = async () => {
    try {
      if (facebookResponse?.type === 'success') {
        const { authentication } = facebookResponse;
        if (authentication?.accessToken) {
          await getUserInfo(authentication.accessToken, 'facebook');
        }
      }
    } catch (error) {
      setError('Facebook Sign-In Error');
    }
  };

  useEffect(() => {
    signInWithGoogle();
  }, [googleResponse]);

  useEffect(() => {
    signInWithFacebook();
  }, [facebookResponse]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Toast config={toastConfig} position="top" />

        <ImageBackground
          source={images.loginbanner}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            Let's <Text style={styles.highlight}>Sign In</Text>
          </Text>

          <Text style={styles.subtitle}> Get You Closer To Your Dream Home</Text>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="black" style={styles.inputIcon} />
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
            <Ionicons name="lock-closed-outline" size={20} color="black" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity onPress={() => Linking.openURL("https://investorlands.com/resetpassword")}>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.showPassword}>{showPassword ? 'Hide password' : 'Show password'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={emaillogin} style={styles.loginButton} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" style={styles.loginButtonText} />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* <Text style={styles.orText}>OR</Text>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity onPress={() => googlePromptAsync()} style={styles.socialButton} disabled={!googleRequest}>
              <Image source={icons.google} style={styles.socialIcon} resizeMode="contain" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => facebookPromptAsync()} style={styles.socialButton} disabled={!facebookRequest}>
              <Image source={icons.facebook} style={styles.socialIcon} resizeMode="contain" />
            </TouchableOpacity>
          </View> */}

        </View>
          <Link href="/signup" style={styles.registerLink}>
            <Text style={styles.registerText}>
              Don't have an account? <Text style={styles.highlight}>Register</Text>
            </Text>
          </Link>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Signin;

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  scrollContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'space-between' },
  backgroundImage: { width: '100%', height: 150 },
  formContainer: { paddingHorizontal: 40, width: '100%', alignItems: 'center' },
  title: { fontSize: 24, textAlign: 'center', fontFamily: 'Rubik-Bold', color: '#333', marginTop: 20 },
  highlight: { color: '#1F4C6B', fontFamily: 'Rubik-Bold', },
  subtitle: { fontSize: 18, fontFamily: 'Rubik-Regular', color: '#555', textAlign: 'center', marginVertical: 15 },
  errorText: { backgroundColor: '#1e3a8a', color: 'white', padding: 10, borderRadius: 5, marginBottom: 10, width: '100%', textAlign: 'center' },
  inputContainer: { flexDirection: 'row', padding: 10, alignItems: 'center', backgroundColor: '#f5f4f8', borderWidth: 0, borderRadius: 10, marginBottom: 10, width: '100%' },
  inputIcon: { marginLeft: 10 },
  input: { flex: 1, height: 45, paddingHorizontal: 10 },
  optionsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 10 },
  forgotPassword: { color: "#1F4C6B" },
  showPassword: { color: "#1F4C6B" },
  loginButton: { backgroundColor: '#8BC83F', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 10, width: '100%' },
  loginButtonText: { fontSize: 18, fontFamily: 'Rubik-Medium', color: 'white' },
  orText: { fontSize: 14, fontFamily: 'Rubik-Regular', color: '#555', textAlign: 'center', marginVertical: 20 },
  socialButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '60%' },
  socialButton: { backgroundColor: 'lightgrey', borderRadius: 50, padding: 10, alignItems: 'center', width: 60, height: 60, justifyContent: 'center' },
  socialIcon: { width: 30, height: 30 },
  registerLink: { marginBlock: 20, alignItems: 'center' },
  registerText: { fontSize: 16, fontFamily: 'Rubik-Regular', color: '#000', textAlign: 'center' },
});