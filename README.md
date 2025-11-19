# 🛡️ CampusGuard: Real-Time AI Campus Safety System

## 🌟 Project Overview

**CampusGuard** is a web-based, privacy-first Machine Learning application designed to function as an automated early-warning system for high-risk areas on a campus. By utilizing **TensorFlow.js** for real-time video analysis in the browser, the system actively detects anomalous, high-risk behaviors—specifically **climbing above safe height thresholds** or entering administrator-defined "danger zones."

The primary motivation is to **reduce response time** to critical incidents, such as falls or self-harm risks, by providing security personnel with immediate, location-based alerts without storing sensitive video footage.

### Key Technologies

- **Frontend & ML:** **Vue 3 (Vite)**, **TensorFlow.js**, and **MoveNet** (for Real-Time Pose Estimation).
- **Backend & Deployment:** **Vercel Serverless Functions** and **MongoDB Atlas** (for persistent, secure alert logging).

---

## ✨ Features & Functionality

- **Privacy-First Design:** Video analysis (pose estimation) is performed entirely **client-side** (in the user's browser). Raw video data is never sent to the server, preserving student anonymity.
- **Real-Time Pose Estimation:** Utilizes the lightweight **MoveNet (SinglePose Lightning)** model to track 17 key human body points (ankles, nose, shoulders, etc.).
- **Virtual Geofencing:** Administrators can dynamically adjust and save a virtual "**Danger Line**" (**Critical Y-coordinate**) using an interactive slider.
- **Anomaly Detection Logic:** The system monitors the Y-coordinates of the subject's **ankles/feet**. If these keypoints cross the saved "Danger Line," a "**Critical Risk**" alert is triggered.
- **Alert Dashboard & Triage:** A high-contrast dashboard for security staff to view real-time, throttled alerts (Timestamp, Location, Risk Type) and acknowledge (triage) them once handled.

---

## 🛠️ Local Development Setup

Follow these steps to get the CampusGuard frontend and backend running locally for testing and development.

### Prerequisites

- Node.js (v18+) and npm
- A camera feed (webcam)
- **MongoDB Atlas** connection string (stored in a local `.env` file).

### 1. Backend Server Setup (Vercel Simulation)

Since the deployed frontend expects the API at a relative path (`/api/`), we must simulate that locally using an Express server that utilizes your MongoDB connection logic.

1.  Navigate to your server directory (or where your `server.js` file is located).
2.  Install dependencies and run the server:

    ```bash
    npm install express cors body-parser
    node server.js # Runs the Express server on port 3000
    ```

    _(Ensure you have set the `MONGODB_URI` environment variable locally for the Node server to connect.)_

### 2. Frontend Setup

1.  Navigate to the project root (`campusguard-app`).
2.  Install all required Vue and TensorFlow.js dependencies:

    ```bash
    npm install
    ```

3.  Start the Vue development server:

    ```bash
    npm run dev
    ```

The application will be accessible at `http://localhost:5173` (or similar).

### 3. Usage Instructions

1.  Navigate to the **Camera Feed** page.
2.  Click **"Start Camera Feed"** and grant camera permissions.
3.  Use the slider in the control panel to define the **Danger Line Height** (Critical Y-coordinate) that represents the railing height. Click **"Save Threshold Position."**
4.  Click **"Load Model & Start Monitoring"** to initiate the real-time pose estimation.
5.  If a person's feet cross the drawn yellow line, a red alert should fire, be logged on the server (check your `server.js` console output), and immediately appear on the **Alert Dashboard**.

---

## ☁️ Deployment

The CampusGuard architecture uses the free tiers of Vercel and MongoDB Atlas.

### Vercel Deployment Steps

1.  **Commit Code:** Ensure all current code, including the `api/` directory and `vercel.json` config, is pushed to your Git repository. **Ensure `.gitignore` is up to date.**
2.  **Environment Variables (CRITICAL):** In the Vercel dashboard for your project, go to **Settings > Environment Variables**.
3.  Add the variable:
    - **Name:** `MONGODB_URI`
    - **Value:** Your full MongoDB Atlas connection string (containing username and password).
4.  **Deploy:** Deploy the project. Vercel will build the Vue app and map the `api/` files to secure serverless endpoints.

---

## 🤝 Contribution

Contributions, issues, and feature requests are welcome!

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add new feature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

_Developed for Campus Safety_
