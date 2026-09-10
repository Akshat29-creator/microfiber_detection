# 🌐 How to Deploy the Microplastic Detector Demo to Vercel (Step-by-Step)

This guide walks you through deploying **only the Demo Mode** of the Microplastic Detection & Environmental Analysis System to **Vercel** so you can share a live, publicly accessible link with your professors, evaluators, or classmates.

---

## 🌟 Why Vercel?
- **Zero Cost (100% Free):** Vercel provides a free Hobby tier with unlimited deployments.
- **Native Next.js Support:** Next.js was created by Vercel, ensuring zero configuration and 30-second automated builds.
- **Hardware-Free Showcase:** The Demo Mode simulates all physical sensors (photodiode laser drops, turbidity failsafe, water temperature) and computes all 8 C++ DSA structures directly in the user's browser—meaning **anyone in the world can test and interact with your project on their phone or laptop without needing an ESP32!**

---

## 🚀 Method 1: Deploy via Vercel Web Dashboard (Recommended & Easiest)

Since your code is already pushed to GitHub (`Akshat29-creator/microfiber_detection`), this method takes less than **2 minutes**:

### Step 1: Sign In to Vercel
1. Go to **[https://vercel.com](https://vercel.com)**.
2. Click **Log In** or **Sign Up** using your **GitHub account** (`Akshat29-creator`).

---

### Step 2: Import the GitHub Repository
1. On your Vercel Dashboard, click the **"Add New..."** button (top right) and select **"Project"**.
2. Under the **"Import Git Repository"** section, look for:
   ```text
   Akshat29-creator/microfiber_detection
   ```
3. Click the blue **"Import"** button next to it.  
   *(If you don't see your repository, click the dropdown to configure GitHub permissions and grant Vercel access to `microfiber_detection`).*

---

### Step 3: 🚨 CRITICAL STEP — Configure the Root Directory
Because this repository is a unified project containing both the ESP32 C++ firmware (`MicroplasticDetectorESP32/`) and the Next.js web application (`dashboard/`), you **must** tell Vercel where the web dashboard is located:

1. In the **Configure Project** screen, find the field labeled **"Root Directory"**.
2. Click the **"Edit"** button next to `./`.
3. Select or type:
   ```text
   dashboard
   ```
4. Click **"Continue"**.

> ⚠️ **Why this is critical:** If you leave it as `./`, Vercel will look at the root folder and report that no Next.js project was found. Setting it to `dashboard` tells Vercel to look inside the `dashboard/` subfolder where `package.json` lives!

---

### Step 4: Configure Framework & Environment Variables
1. **Framework Preset:** Vercel will automatically detect **Next.js** (leave default).
2. **Build and Output Settings:** Leave all toggles as default (`npm run build`).
3. **Environment Variables:**
   - Click to expand the **"Environment Variables"** dropdown.
   - Add the following variable:
     - **Key:** `NEXT_PUBLIC_MODE`
     - **Value:** `demo`
   - Click **"Add"**.

*(Note: The codebase is already engineered to default to `demo` if unspecified, but adding this environment variable guarantees 100% Demo Mode).*

---

### Step 5: Click "Deploy"
1. Click the blue **"Deploy"** button at the bottom.
2. Vercel will spin up a build container, install dependencies, compile TypeScript, and optimize all 10 pages.
3. In approximately **35–50 seconds**, you will see:
   ```text
   🎉 Congratulations! Your project has been deployed.
   ```
4. Vercel will display an interactive preview and assign you a live production URL, such as:
   👉 **`https://microfiber-detection-dashboard.vercel.app`** *(or your custom chosen project name)*.

---

## 💻 Method 2: Deploy via Vercel CLI (From Your Terminal)

If you prefer deploying directly from your computer terminal without opening the browser:

1. Open **Command Prompt** or **PowerShell** on your PC.
2. Navigate into the dashboard folder:
   ```cmd
   cd d:\kirti_project\dashboard
   ```
3. Run the Vercel CLI via `npx`:
   ```cmd
   npx vercel
   ```
4. Answer the interactive setup questions:
   - `Log in to Vercel`: Select your preferred login method (GitHub).
   - `Set up and deploy "d:\kirti_project\dashboard"?`: Type **`y`** and press Enter.
   - `Which scope do you want to deploy to?`: Press Enter (selects your personal account).
   - `Link to existing project?`: Type **`n`** (No).
   - `What’s your project’s name?`: Type **`microplastic-detector-demo`** and press Enter.
   - `In which directory is your code located?`: Leave as **`./`** and press Enter.
5. Vercel will upload and deploy the application.
6. To deploy directly to production with a permanent URL, run:
   ```cmd
   npx vercel --prod
   ```

---

## 📱 What Visitors Can Test on the Live Vercel Demo

Anyone who opens your Vercel link can experience the full project without physical hardware:

1. **HUD Telemetry Dashboard (`/`)**:
   - Interactive live dials for Laser Voltage, Water Turbidity, and Temperature.
   - Live hardware toggle switches (Laser active, Pump relay).
   - Historical voltage charts.
2. **Interactive Simulation Pipeline (`/simulation`)**:
   - Custom sample slider (5–30 samples).
   - Real-time animated testing stages: Optical baseline calibration $\rightarrow$ Pump fluid intake $\rightarrow$ Turbidity safety check $\rightarrow$ Laser scattering detection $\rightarrow$ Automated data structure population.
3. **8 Interactive C++ DSA Visualizers**:
   - **Singly Linked List (`/sensor-log`)**: Pointer memory addresses, manual node insertion, deletion by index, sensor filtering.
   - **Doubly Linked List (`/events`)**: Bidirectional Forward (Head $\rightarrow$ Tail) and Reverse (Tail $\rightarrow$ Head) traversal, $O(1)$ event deletion.
   - **Circular Linked List (`/sliding-window`)**: 10-slot circular ring buffer with real-time DSP moving average.
   - **LIFO Stack (`/calibration`)**: Sensor baseline calibration with interactive Push & Undo (Pop).
   - **FIFO & Priority Queue (`/alerts`)**: Live alert notifications with safety breach preemption.
   - **Binary Search Tree (`/bst`)**: Dynamic recursive tree visualizer with In-Order, Pre-Order, Post-Order traversals, Range queries, and custom node insertion.
   - **Sorting Algorithms (`/sorting`)**: 5 algorithms (Bubble, Selection, Insertion, Merge, Quick) benchmarked directly on photodiode voltages with microsecond execution timers and step animations.
   - **Searching Algorithms (`/searching`)**: Linear vs Binary search showdown with comparison counters and breach event scanner.
   - **System Diagnostics (`/system`)**: ESP32 Free Heap, CPU clock (240 MHz), uptime, and GPIO pin statuses.

---

## 🔄 Automatic Continuous Deployment (CI/CD)

Any time you make updates to the `dashboard/` directory and push to GitHub:
```cmd
git add .
git commit -m "Update dashboard feature"
git push origin main
```
Vercel will **automatically detect the push, rebuild the app, and update your live URL in under 45 seconds!**

---
*MIT Manipal | B.Tech Cyber Physical Systems | 3rd Semester DSA Project*
