# 🚀 Complete Arduino IDE & Real-Time Dashboard Guide

This guide gives you the exact step-by-step instructions from opening Arduino IDE to seeing live real-time data on your dashboard.

---

## 📋 Overview of the Process

```text
[ 1. Preferences & Library ] ➔ [ 2. Open Code & Set WiFi ] ➔ [ 3. Select Board & Port ] ➔ [ 4. Flash ESP32 ] ➔ [ 5. Get IP Address ] ➔ [ 6. Connect Dashboard ]
```

---

## 🛠️ Step 1: Open Arduino IDE & Setup Preferences (One-Time Setup)

### 1. Open Arduino Software
* Launch **Arduino IDE** (version 2.0+ recommended) on your Windows laptop.

### 2. Enter URL in Preferences Tab
1. In Arduino IDE, click **File** (top-left) ➔ **Preferences** (or press `Ctrl + Comma`).
2. Look for the box labeled:  
   👉 **"Additional boards manager URLs"**
3. Copy and paste this exact URL into the box:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
   *(Note: If there is already another link in this box, add a comma `,` at the end and then paste this link).*
4. Click **OK** at the bottom to save.

---

## 📦 Step 2: Install ESP32 Board & Required Library

### 1. Install ESP32 Board Package
1. On the left sidebar of Arduino IDE, click the **Boards Manager icon** (icon showing a circuit board with chips).
2. In the search box, type: `esp32`
3. Look for **esp32 by Espressif Systems**.
4. Click **INSTALL** (wait 1–2 minutes for it to download).

### 2. Install WebSockets Library
1. On the left sidebar of Arduino IDE, click the **Library Manager icon** (icon showing books, or press `Ctrl + Shift + I`).
2. In the search box, type: `WebSockets`
3. Look for **WebSockets by Markus Sattler**.
4. Click **INSTALL**.

> 💡 **Good News:** That is the **ONLY** library you need! All 8 DSA structures (Linked Lists, BST, Stacks, Queues, Sorting, Searching) and the temperature sensor bit-bang driver are custom coded in pure C++ inside the project files.

---

## 💻 Step 3: Open the Project Code in Arduino IDE

1. In Arduino IDE, click **File** ➔ **Open...** (or press `Ctrl + Open` / `Ctrl + O`).
2. Navigate to your cloned project repository and open:
   ```text
   MicroplasticDetectorESP32_WiFi/MicroplasticDetectorESP32_WiFi.ino
   ```
   *(Alternatively, `MicroplasticDetectorESP32/MicroplasticDetectorESP32_WiFi.ino` works as well).*
3. Click **Open**.

### What you will see:
Arduino IDE will open the main sketch `MicroplasticDetectorESP32_WiFi.ino` and automatically load **all 10 DSA header files as tabs** across the top:
- `AlertQueue.h`
- `CalibrationStack.h`
- `CircularBuffer.h`
- `DetectionBST.h`
- `EventDoublyList.h`
- `MicroplasticEvent.h`
- `SearchAlgorithms.h`
- `SensorLinkedList.h`
- `SensorReading.h`
- `SortingAlgorithms.h`

---

## ✍️ Step 4: What Code to Enter / Edit in Arduino IDE

You only need to edit **two lines** in the `MicroplasticDetectorESP32_WiFi.ino` tab.

1. Scroll down to lines **36–37**:
   ```cpp
   // ============================================================
   //  WiFi CONFIGURATION — CHANGE THESE!
   // ============================================================
   const char* WIFI_SSID     = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   ```

2. Replace them with your actual Hotspot or WiFi credentials:

   **Example for Mobile Phone Hotspot:**
   ```cpp
   const char* WIFI_SSID     = "Your_Phone_Hotspot";
   const char* WIFI_PASSWORD = "your_hotspot_password";
   ```

   **Example for Windows Laptop Mobile Hotspot:**
   ```cpp
   const char* WIFI_SSID     = "MicroDetector";
   const char* WIFI_PASSWORD = "your_hotspot_password";
   ```

> ⚠️ **CRITICAL HOTSPOT RULE (2.4 GHz Only):**  
> The ESP32 does not support 5 GHz WiFi.
> - **Android:** Hotspot settings ➔ AP Band ➔ select **2.4 GHz Band**.
> - **iPhone:** Personal Hotspot settings ➔ turn ON **Maximize Compatibility**.

---

## 🔌 Step 5: Connect ESP32, Select Board & Port

1. Plug your ESP32 board into your laptop using a **USB data cable** (make sure it is a data cable, not a power-only charging cable).
2. In Arduino IDE, go to the top **Tools** menu:
   - **Board** ➔ **esp32** ➔ Select **ESP32 Dev Module** *(or DOIT ESP32 DEVKIT V1 / NodeMCU-32S)*.
   - **Port** ➔ Select your ESP32's COM port (e.g., `COM3`, `COM4`, `COM5`). *(Avoid COM1)*.
   - **Upload Speed** ➔ Select **`115200`** (or `921600` for faster upload).

---

## ⚡ Step 6: Compile & Upload (Flash to ESP32)

1. Click the **Upload button** (the right arrow `➔` icon at the top-left of Arduino IDE, or press `Ctrl + U`).
2. The bottom console will display `Compiling sketch...`.
3. When the console displays:
   ```text
   Connecting........_____....._____.....
   ```
   🚨 **The BOOT Button Trick:**  
   **Press and hold down the physical `BOOT` (or `IO0`) button** on your ESP32 board for 2 seconds.  
   As soon as you see `Writing at 0x00010000... (xx%)`, release the button!
4. The upload will finish with:
   ```text
   Leaving...
   Hard resetting via RTS pin...
   Done uploading.
   ```

---

## 📡 Step 7: Open Serial Monitor & Get ESP32 IP Address

1. In Arduino IDE, click the **Serial Monitor icon** in the top-right corner (magnifying glass icon, or press `Ctrl + Shift + M`).
2. In the Serial Monitor toolbar:
   - Change the baud rate dropdown to **`115200 baud`**.
   - Change the line ending dropdown to **`Newline`**.
3. Press the **EN** (or **RST**) reset button on your physical ESP32 board once.
4. You will see the startup banner:
   ```text
   ==========================================
   |   MICROPLASTIC DETECTION SYSTEM        |
   |   DSA Project — ESP32 + WiFi Version   |
   ==========================================
   [WiFi] Connecting to: Your_Phone_Hotspot ..........
   [WiFi] Connected successfully!
   [WiFi] ESP32 IP Address: 192.168.43.105
   [WS] WebSocket server started on port 81
   ```
5. 📝 **Copy or note down the IP Address** (e.g., `192.168.43.105`).

---

## 🌐 Step 8: Start Dashboard & Connect for Real-Time Data

1. Open your terminal or file manager and navigate into the `dashboard/` folder:
   ```bash
   cd dashboard
   ```
2. If running for the first time on a new computer, install dependencies:
   ```bash
   npm install
   ```
3. Start the dashboard in **Real Mode**:
   - **On Windows:** Double-click `start_real.bat`
   - **Or in Terminal (Windows / Mac / Linux):**
     ```bash
     npm run real
     ```
4. Open your web browser to:
   ```text
   http://localhost:3001
   ```
5. In the dashboard top-bar or sidebar:
   - Enter your **ESP32 IP Address** (e.g., `192.168.43.105`).
   - Click **Connect**.
6. The badge will instantly change to a green **CONNECTED** state!
7. Live photodiode voltages, turbidity levels, temperature readings, laser chamber animations, and all 8 DSA visualizer pages will now stream live data from your ESP32 in real time!
