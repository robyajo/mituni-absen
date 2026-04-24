import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, Dimensions, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  runOnJS,
  Easing,
  FadeIn
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationComplete: () => void;
}

export default function AnimatedSplashScreen({ onAnimationComplete }: AnimatedSplashScreenProps) {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    // Start entrance animation
    logoScale.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.back(1.5)),
    });
    logoOpacity.value = withTiming(1, {
      duration: 800,
    });

    // After a delay, trigger the completion (fade out)
    const timeout = setTimeout(() => {
      containerOpacity.value = withTiming(0, {
        duration: 800,
      }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      });
    }, 2500); // Show for 2.5 seconds total

    return () => clearTimeout(timeout);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Premium Background */}
      <Image 
        source={require('../assets/images/splash-bg.png')} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Glassmorphism Overlay for Logo */}
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('../assets/images/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.textContainer}>
            <Text style={styles.appName}>MITUNI</Text>
            <Text style={styles.appSubtitle}>Attendance System</Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View 
        entering={FadeIn.delay(1000).duration(800)}
        style={styles.footer}
      >
        <Text style={styles.footerText}>Powered by MITUNI Tech</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#001A3D',
    zIndex: 9999,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    letterSpacing: 1,
  },
});
