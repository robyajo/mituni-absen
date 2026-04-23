import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AttendanceError from "../components/AttendanceError";
import AttendanceSuccess from "../components/AttendanceSuccess";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://192.168.1.1:8000";

const IS_DEBUG = process.env.EXPO_PUBLIC_APP_DEBUG === "true";
const CLOCK_IN_URL = `${API_URL}/api/${IS_DEBUG ? "test/" : ""}attendance/clock-in`;
const CLOCK_OUT_URL = `${API_URL}/api/${IS_DEBUG ? "test/" : ""}attendance/clock-out`;
const SUBMIT_URL = `${API_URL}/api/${IS_DEBUG ? "test/" : ""}attendance/submit`;

interface EmployeeQRData {
  uuid: string;
  name?: string;
}

interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  user?: {
    name: string;
    role: string;
    avatar_url: string;
  };
  jam_absen?: string;
  attendance?: {
    id: number;
    user_id: number;
    schedule_id: number;
    clock_in: string;
    clock_out: string | null;
    status: string;
    photo_path: string;
    clock_out_photo_path: string | null;
    location: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  };
}

export default function AbsenScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeQRData | null>(null);
  const [absenType, setAbsenType] = useState<"clock-in" | "clock-out" | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [errorResult, setErrorResult] = useState<string | null>(null);
  const [inactivityCountdown, setInactivityCountdown] = useState(120); // 2 minutes
  const router = useRouter();

  // 2-minute inactivity timeout with visible countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setInactivityCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (inactivityCountdown === 0) {
      console.log("[ABSEN] Inactivity timeout reached");
      router.back();
    }
  }, [inactivityCountdown]);

  const fetchLocation = async (): Promise<string> => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        const fallback = "Kantor";
        setLocation(fallback);
        return fallback;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = `${loc.coords.latitude},${loc.coords.longitude}`;
      setLocation(coords);
      return coords;
    } catch {
      const fallback = "Kantor";
      setLocation(fallback);
      return fallback;
    } finally {
      setLocationLoading(false);
    }
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    console.log("[SCAN] Raw QR Data:", result.data);

    try {
      let uuid: string;

      const trimmedData = result.data.trim();
      console.log("[SCAN] Trimmed Data:", trimmedData);

      if (trimmedData.startsWith("{")) {
        const data = JSON.parse(trimmedData) as EmployeeQRData;
        console.log("[SCAN] Parsed JSON:", data);
        if (!data.uuid) {
          throw new Error("QR Code tidak valid");
        }
        uuid = data.uuid;
        setEmployeeData(data);
      } else {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        console.log("[SCAN] UUID Regex Test:", uuidRegex.test(trimmedData));
        if (!uuidRegex.test(trimmedData)) {
          throw new Error("Format UUID tidak valid");
        }
        uuid = trimmedData;
        setEmployeeData({ uuid });
      }

      console.log("[SCAN] Final UUID:", uuid);
      const currentLoc = await fetchLocation();

      // Auto take photo and submit
      if (cameraRef.current) {
        setLoading(true);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
        });
        if (photo) {
          submitAbsensi(uuid, currentLoc, photo.uri);
        } else {
          setLoading(false);
          setScanned(false);
        }
      }
    } catch (e) {
      console.log("[SCAN] Error:", e);
      Alert.alert("QR Code Tidak Valid", "QR Code tidak valid untuk absensi", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    }
  };

  const submitAbsensi = async (
    uuid: string,
    locationParam: string,
    photoUri: string,
  ) => {
    console.log("[ABSEN] submitAbsensi called");
    console.log("[ABSEN] uuid:", uuid);
    console.log("[ABSEN] location:", locationParam);
    console.log("[ABSEN] photoUri:", photoUri);

    if (!uuid) {
      console.log("[ABSEN] Missing data - returning");
      Alert.alert("Error", "Data tidak lengkap");
      return;
    }

    setLoading(true);
    try {
      console.log("[ABSEN] Submitting:", {
        uuid,
        location: locationParam,
      });

      const timestamp = new Date().toISOString();
      console.log("[ABSEN] Timestamp:", timestamp);

      const formData = new FormData();
      formData.append("uuid", uuid);
      formData.append("timestamp", timestamp);
      formData.append("location", locationParam || "");

      console.log("[ABSEN] uuid:", uuid);
      console.log("[ABSEN] timestamp:", timestamp);
      console.log("[ABSEN] location:", locationParam || "");
      console.log("[ABSEN] photoUri:", photoUri);

      const filename = photoUri.split("/").pop() || "photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const imageType = match ? `image/${match[1]}` : "image/jpeg";

      console.log("[ABSEN] Photo:", {
        filename,
        type: imageType,
        uri: photoUri,
      });

      formData.append("photo", {
        uri: photoUri,
        name: filename,
        type: imageType,
      } as any);

      const url = SUBMIT_URL; // Always use unified submit
      console.log("[ABSEN] URL:", url);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      console.log("[ABSEN] Response Status:", response.status);
      const result = (await response.json()) as ApiErrorResponse;
      console.log("[ABSEN] Response:", JSON.stringify(result, null, 2));

      if (result.success) {
        Speech.speak("Absensi berhasil");
        setSuccessResult(result);
      } else {
        const errorMsg = result.errors
          ? Object.values(result.errors).flat().join("\n")
          : result.message;
        console.log("[ABSEN] Error Message:", errorMsg);
        setErrorResult(errorMsg);
      }
    } catch (error: any) {
      console.log(
        "[ABSEN] Catch Error:",
        error?.message || error?.toString() || error,
      );
      console.log("[ABSEN] Catch Error Full:", JSON.stringify(error, null, 2));
      setErrorResult(
        error?.message || "Jaringan tidak stabil atau server tidak merespons",
      );
    } finally {
      setLoading(false);
    }
  };

  // handleAbsen is no longer needed as it's automatic

  if (!permission || !cameraPermission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted || !cameraPermission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Izin Diperlukan</Text>
          <Text style={styles.permissionText}>
            Kamera dan galeri diperlukan untuk absensi
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              requestPermission();
              requestCameraPermission();
            }}
          >
            <Text style={styles.buttonText}>Izinkan</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonTextSecondary}>Kembali</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack screenOptions={{ headerShown: false }} />

      <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="front"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Memproses Absensi...</Text>
            </View>
          )}
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
          <View style={styles.instructions}>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>Kembali ke Home dalam {inactivityCountdown}s</Text>
            </View>
            <Text style={styles.instructionText}>Scan QR Code Karyawan</Text>
            {scanned && (
              <TouchableOpacity
                style={styles.scanAgainButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainText}>Scan Lagi</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Text style={styles.closeButtonText}>Tutup</Text>
          </TouchableOpacity>
        </View>

      {successResult && (
        <Modal visible={true} animationType="fade" transparent={false}>
          <AttendanceSuccess
            data={successResult}
            onClose={() => {
              setSuccessResult(null);
              router.back();
            }}
          />
        </Modal>
      )}

      {errorResult && (
        <Modal visible={true} animationType="fade" transparent={false}>
          <AttendanceError
            message={errorResult}
            onClose={() => {
              setErrorResult(null);
              setLoading(false);
              setScanned(false);
            }}
          />
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#042f2e" },
  cameraContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { flex: 1, width: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 47, 46, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 260,
    height: 260,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#0d9488",
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  topLeft: { top: -2, left: -2, borderTopWidth: 5, borderLeftWidth: 5, borderTopLeftRadius: 12 },
  topRight: { top: -2, right: -2, borderTopWidth: 5, borderRightWidth: 5, borderTopRightRadius: 12 },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 5, borderLeftWidth: 5, borderBottomLeftRadius: 12 },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 12,
  },
  instructions: { position: "absolute", bottom: 100, alignItems: "center", width: "100%" },
  timerBadge: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  timerText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "600",
  },
  instructionText: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 16 
  },
  scanAgainButton: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#0d9488",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scanAgainText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  closeButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  closeButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#0f172a",
  },
  permissionTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#0d9488",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    width: "100%",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" },
  buttonSecondary: { paddingHorizontal: 32, paddingVertical: 16 },
  buttonTextSecondary: { color: "#94a3b8", fontSize: 16, fontWeight: "500" },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 47, 46, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
