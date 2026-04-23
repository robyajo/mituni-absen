## Get started di Android Studio / Device

0. Cek Device

   ```bash
   npm uninstall react-native-web react-dom

   ```

1. Cek Device

   ```bash
   adb devices
   ```

2. Reverse port adb ke device
   ```bash
   adb -s RR8W504R1ZY reverse tcp:8000 tcp:8000
   ```
3. Start project dan jalankan di android

   ```bash
   npm run android

   ```

## Get started build windows

0. Cek Device

   ```bash
   cd android

   ```

1. Cek Device

   ```bash
   .\gradlew.bat assembleRelease
   ```
