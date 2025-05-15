import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Vérification d'onboarding avec useEffect pour éviter les problèmes de navigation trop précoce
function useOnboardingState() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('@onboarding_completed');
        const onboardingComplete = value === 'true';
        setIsOnboardingComplete(onboardingComplete);

        const inAuthGroup = segments[0] === '(tabs)';
        const inOnboarding = segments[0] === 'onboarding';

        if (!onboardingComplete && !inOnboarding) {
          // Si l'onboarding n'est pas terminé et que l'utilisateur n'est pas sur l'écran d'onboarding
          router.replace('/onboarding');
        } else if (onboardingComplete && inOnboarding) {
          // Si l'onboarding est terminé et que l'utilisateur est sur l'écran d'onboarding
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'onboarding:', error);
        setIsOnboardingComplete(true); // Par défaut, laisser accéder à l'application
      }
    };

    if (isOnboardingComplete === null) {
      checkOnboarding();
    }
  }, [isOnboardingComplete, segments, router]);

  return isOnboardingComplete;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Charger l'état de l'onboarding
  const isOnboardingComplete = useOnboardingState();

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded || isOnboardingComplete === null) {
    return <Slot />;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="detail-location" options={{ title: "Détails du spot" }} />
      </Stack>
    </ThemeProvider>
  );
}