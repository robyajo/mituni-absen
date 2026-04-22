import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Stack, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import { useState } from "react";
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

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  "http://192.168.1.1:8000";
const CLOCK_IN_URL = `${API_URL}/api/test/attendance/clock-in`;
const CLOCK_OUT_URL = `${API_URL}/api/test/attendance/clock-out`;

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
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation("Kantor");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(`${loc.coords.latitude},${loc.coords.longitude}`);
    } catch {
      setLocation("Kantor");
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
      await fetchLocation();
      setShowForm(true);
    } catch (e) {
      console.log("[SCAN] Error:", e);
      Alert.alert("QR Code Tidak Valid", "QR Code tidak valid untuk absensi", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    }
  };

  const submitAbsensi = async (
    photoUri: string,
    absenTypeParam?: "clock-in" | "clock-out",
  ) => {
    const type = absenTypeParam || absenType;

    console.log("[ABSEN] submitAbsensi called");
    console.log("[ABSEN] employeeData:", employeeData);
    console.log("[ABSEN] absenType (param):", absenTypeParam);
    console.log("[ABSEN] absenType (state):", absenType);
    console.log("[ABSEN] Final type:", type);
    console.log("[ABSEN] location:", location);
    console.log("[ABSEN] photoUri:", photoUri);

    if (!employeeData?.uuid || !type) {
      console.log("[ABSEN] Missing data - returning");
      Alert.alert("Error", "Data tidak lengkap");
      return;
    }

    setLoading(true);
    try {
      console.log("[ABSEN] Submitting:", {
        uuid: employeeData.uuid,
        absenType: type,
        location,
      });

      const timestamp = new Date().toISOString();
      console.log("[ABSEN] Timestamp:", timestamp);

      const formData = new FormData();
      formData.append("uuid", employeeData.uuid);
      formData.append("timestamp", timestamp);
      formData.append("location", location || "");

      console.log("[ABSEN] uuid:", employeeData.uuid);
      console.log("[ABSEN] timestamp:", timestamp);
      console.log("[ABSEN] location:", location || "");
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

      const url = type === "clock-in" ? CLOCK_IN_URL : CLOCK_OUT_URL;
      console.log("[ABSEN] URL:", url);

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      console.log("[ABSEN] Response Status:", response.status);
      const result = (await response.json()) as ApiErrorResponse;
      console.log("[ABSEN] Response:", JSON.stringify(result, null, 2));

      if (result.success) {
        const { user, jam_absen } = result;
        const message = user
          ? `${type === "clock-in" ? "Clock In" : "Clock Out"} berhasil!\n\n${user.name} (${user.role})\nJam: ${jam_absen}`
          : `${type === "clock-in" ? "Clock In" : "Clock Out"} berhasil!`;
        Alert.alert("Berhasil", message, [
          { text: "OK", onPress: () => router.back() },
        ]);
        Speech.speak("Absensi berhasil");
      } else {
        const errorMsg = result.errors
          ? Object.values(result.errors).flat().join("\n")
          : result.message;
        console.log("[ABSEN] Error Message:", errorMsg);
        Alert.alert("Gagal", errorMsg, [
          { text: "OK", onPress: () => setLoading(false) },
        ]);
      }
    } catch (error: any) {
      console.log("[ABSEN] Catch Error:", error?.message || error?.toString() || error);
      console.log("[ABSEN] Catch Error Full:", JSON.stringify(error, null, 2));
      Alert.alert("Gagal", `Terjadi kesalahan: ${error?.message || "Jaringan tidak stabil"}`, [
        { text: "OK", onPress: () => setLoading(false) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAbsen = async (type: "clock-in" | "clock-out") => {
    setAbsenType(type);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Izin Diperlukan",
        "Izin galeri diperlukan untuk upload foto",
        [{ text: "OK" }],
      );
      return;
    }

    Alert.alert("Ambil Foto", "Pilih sumber foto", [
      {
        text: "Kamera",
        onPress: async () => {
          const camStatus = await ImagePicker.requestCameraPermissionsAsync();
          if (camStatus.status !== "granted") {
            Alert.alert("Izin Diperlukan", "Izin kamera diperlukan", [
              { text: "OK" },
            ]);
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            submitAbsensi(result.assets[0].uri, type);
          } else {
            setLoading(false);
          }
        },
      },
      {
        text: "Galeri",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            submitAbsensi(result.assets[0].uri, type);
          } else {
            setLoading(false);
          }
        },
      },
    ]);
  };

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

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Konfirmasi Absensi</Text>
            <TouchableOpacity
              onPress={() => {
                setShowForm(false);
                setScanned(false);
                setEmployeeData(null);
                setAbsenType(null);
              }}
            >
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.employeeInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {employeeData?.name?.[0] || "?"}
              </Text>
            </View>
            <Text style={styles.employeeName}>
              {employeeData?.name || "Karyawan"}
            </Text>
            <Text style={styles.employeeId}>ID: {employeeData?.uuid}</Text>
          </View>

          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Lokasi:</Text>
            {locationLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.locationValue}>{location}</Text>
            )}
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>UUID:</Text>
            {locationLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.locationValue}>{employeeData?.uuid}</Text>
            )}
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Time:</Text>
            {locationLoading ? (
              <ActivityIndicator size="small" />
            ) : (
              <Text style={styles.locationValue}>
                {new Date().toLocaleString()}
              </Text>
            )}
          </View>

          <View style={styles.typeContainer}>
            <Text style={styles.typeLabel}>Pilih Jenis Absensi:</Text>
            <View style={styles.typeButtons}>
              <TouchableOpacity
                style={[styles.typeButton, styles.clockInButton]}
                onPress={() => handleAbsen("clock-in")}
                disabled={loading}
              >
                {loading && absenType === "clock-in" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.typeButtonText}>Clock In</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, styles.clockOutButton]}
                onPress={() => handleAbsen("clock-out")}
                disabled={loading}
              >
                {loading && absenType === "clock-out" ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.typeButtonText}>Clock Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {!showForm && (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
          <View style={styles.instructions}>
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
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  camera: { flex: 1, width: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanArea: {
    width: 250,
    height: 250,
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#007AFF",
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructions: { position: "absolute", bottom: 100, alignItems: "center" },
  instructionText: { color: "#fff", fontSize: 16, marginBottom: 16 },
  scanAgainButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanAgainText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  closeButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: { color: "#fff", fontSize: 16 },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  buttonSecondary: { paddingHorizontal: 32, paddingVertical: 16 },
  buttonTextSecondary: { color: "#aaa", fontSize: 16 },
  formContainer: { flex: 1, backgroundColor: "#fff", padding: 24 },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 16,
  },
  formTitle: { fontSize: 24, fontWeight: "bold", color: "#1a1a1a" },
  closeText: { fontSize: 24, color: "#666" },
  employeeInfo: { alignItems: "center", marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, color: "#fff", fontWeight: "bold" },
  employeeName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  employeeId: { fontSize: 14, color: "#666" },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
  },
  locationLabel: { fontSize: 14, color: "#666", marginRight: 8 },
  locationValue: { fontSize: 14, color: "#1a1a1a", flex: 1 },
  typeContainer: { flex: 1 },
  typeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  typeButtons: { flexDirection: "row", gap: 16 },
  typeButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  typeButtonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
  clockInButton: { backgroundColor: "#34C759" },
  clockOutButton: { backgroundColor: "#FF3B30" },
});
