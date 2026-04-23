import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface AttendanceErrorProps {
  message: string;
  onClose: () => void;
}

export default function AttendanceError({
  message,
  onClose,
}: AttendanceErrorProps) {
  const [countdown, setCountdown] = React.useState(10);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      onClose();
    }
  }, [countdown]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fef2f2", "#ffffff"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeIn} style={styles.content}>
        {/* Error Icon */}
        <Animated.View
          entering={ZoomIn.delay(300)}
          style={styles.iconContainer}
        >
          <LinearGradient
            colors={["#ef4444", "#dc2626"]}
            style={styles.iconGradient}
          >
            <Ionicons name="close-sharp" size={60} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)} style={styles.textCenter}>
          <Text style={styles.errorTitle}>Absensi Gagal</Text>
          <Text style={styles.errorMessage}>
            {message || "Terjadi kesalahan saat memproses absensi Anda."}
          </Text>
        </Animated.View>

        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.card}>
          <View style={styles.infoRow}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#ef4444"
            />
            <Text style={styles.infoText}>
              Silakan periksa koneksi internet atau coba beberapa saat lagi.
            </Text>
          </View>
        </Animated.View>

        {/* Bottom Button */}
        <Animated.View entering={FadeInDown.delay(900)} style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.button}
          >
            <LinearGradient
              colors={["#ef4444", "#dc2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Coba Lagi ({countdown}s)</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 24,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  textCenter: {
    alignItems: "center",
    marginBottom: 32,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#991b1b",
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: "#b91c1c",
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#fff",
    width: "100%",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
    marginBottom: 40,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  footer: {
    width: "100%",
  },
  button: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
