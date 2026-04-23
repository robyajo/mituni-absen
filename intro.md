## Get started di Android Studio / Device

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
