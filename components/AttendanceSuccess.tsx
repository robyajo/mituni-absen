import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface AttendanceSuccessProps {
  data: {
    success: boolean;
    message: string;
    user: {
      name: string;
      role: string;
      avatar_url: string;
    };
    jam_absen: string;
    attendance: {
      status: string;
      location: string;
    };
  };
  onClose: () => void;
}

export default function AttendanceSuccess({
  data,
  onClose,
}: AttendanceSuccessProps) {
  const { user, jam_absen, attendance } = data;
  const [countdown, setCountdown] = React.useState(5);

  useEffect(() => {
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
        colors={["#f0fdfa", "#ffffff"]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeIn} style={styles.content}>
        {/* Success Icon */}
        <Animated.View entering={ZoomIn.delay(300)} style={styles.iconContainer}>
          <LinearGradient
            colors={["#0d9488", "#0f766e"]}
            style={styles.iconGradient}
          >
            <Ionicons name="checkmark-sharp" size={60} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)} style={styles.textCenter}>
          <Text style={styles.successTitle}>Absensi Berhasil!</Text>
          <Text style={styles.successMessage}>
            Data kehadiran Anda telah tercatat di sistem.
          </Text>
        </Animated.View>

        {/* User Card */}
        <Animated.View entering={FadeInDown.delay(700)} style={styles.card}>
          <View style={styles.profileSection}>
            <Image
              source={{ uri: user.avatar_url }}
              style={styles.avatar}
              contentFit="cover"
              transition={500}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Waktu</Text>
              <Text style={styles.detailValue}>
                {new Date(jam_absen).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tanggal</Text>
              <Text style={styles.detailValue}>
                {new Date(jam_absen).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{attendance.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Lokasi</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {attendance.location === "Testing Location" ? "Kantor" : attendance.location}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Bottom Button */}
        <Animated.View entering={FadeInDown.delay(900)} style={styles.footer}>
          <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.button}>
            <LinearGradient
              colors={["#0d9488", "#0f766e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Selesai ({countdown}s)</Text>
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
    shadowColor: "#22c55e",
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
  successTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#134e4a",
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 16,
    color: "#0d9488",
    textAlign: "center",
    opacity: 0.8,
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
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0fdf4",
    borderWidth: 3,
    borderColor: "#dcfce7",
  },
  userInfo: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  userRole: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 20,
  },
  detailItem: {
    width: "50%",
  },
  detailLabel: {
    fontSize: 12,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
  },
  statusBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#166534",
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
