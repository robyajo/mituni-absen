import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#042f2e", "#0f172a"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Header Section */}
          <Animated.View entering={FadeInUp.delay(200)} style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../assets/images/logo-h.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.subtitle}>Sistem Absensi Digital</Text>
          </Animated.View>

          {/* Main Action Card */}
          <Animated.View
            entering={FadeInDown.delay(400)}
            style={styles.mainCard}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
              style={styles.cardGradient}
            >
              <View style={styles.cardIconContainer}>
                <Ionicons name="qr-code-outline" size={80} color="#0d9488" />
              </View>

              <Text style={styles.cardTitle}>Siap untuk Absen?</Text>
              <Text style={styles.cardDescription}>
                Arahkan kamera Anda ke QR Code yang disediakan untuk mencatat
                kehadiran secara otomatis.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.scanButton}
                onPress={() => router.push("/absen")}
              >
                <LinearGradient
                  colors={["#0d9488", "#0f766e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <Ionicons
                    name="camera"
                    size={24}
                    color="#fff"
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Scan QR Sekarang</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Animated.View
              entering={FadeInDown.delay(600)}
              style={styles.infoRow}
            >
              <View style={styles.infoIconBox}>
                <Ionicons name="flash-outline" size={20} color="#fbbf24" />
              </View>
              <Text style={styles.infoText}>
                Absensi instan dengan deteksi cerdas.
              </Text>
            </Animated.View>
          </View>
        </View>

        {/* Footer */}
        <Animated.View entering={FadeInDown.delay(1000)} style={styles.footer}>
          <Text style={styles.footerText}>
            MITUNI v2.0 • Advanced Attendance
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#042f2e",
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
  },
  logoContainer: {
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 12,
  },
  logo: {
    width: width * 0.6,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 1,
  },
  mainCard: {
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 40,
  },
  cardGradient: {
    padding: 32,
    alignItems: "center",
  },
  cardIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(13, 148, 136, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 15,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  scanButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d9488",
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  infoSection: {
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 16,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoText: {
    color: "#cbd5e1",
    fontSize: 14,
    fontWeight: "400",
  },
  footer: {
    paddingBottom: 24,
    alignItems: "center",
  },
  footerText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
