<template>
  <div class="camera-layout">
    <div class="camera-monitor" :class="{ 'critical-alert': isRiskDetected }">
      <video ref="videoRef" autoplay muted playsinline></video>

      <canvas ref="canvasRef"></canvas>

      <div v-if="isRiskDetected" class="risk-overlay">
        🚨 CRITICAL RISK DETECTED! IMMEDIATE RESPONSE REQUIRED 🚨
      </div>
    </div>

    <div class="control-panel">
      <div class="card">
        <h3>Camera Status</h3>
        <p>Model: MoveNet Lightning</p>
        <p>Location: Hallway 3A</p>
        <div class="status-indicator" :class="{ active: detector }"></div>
        <p>{{ detector ? "Monitoring Active" : "Loading Model..." }}</p>
      </div>

      <div class="card">
        <h3>Danger Line Height (Y: {{ criticalY }})</h3>
        <p class="control-label">Define the threshold line in pixels.</p>
        <input
          type="range"
          min="100"
          max="480"
          v-model.number="criticalY"
          class="slider-blue"
        />
        <p class="throttle-info">Alert Cooldown: {{ THROTTLE_TIME / 1000 }}s</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";

// --- State Variables ---
const videoRef = ref(null);
const canvasRef = ref(null);
const isRiskDetected = ref(false);

let detector = null;
const criticalY = 300; // Define your virtual danger line (Y-coordinate from the top)
let lastAlertTimestamp = 0;
const THROTTLE_TIME = 15000; // 15 seconds cooldown for alerts (in milliseconds)

// Define the component's functions below...

/**
 * Loads the MoveNet model via the pose-detection package.
 */
async function loadMovenetModel() {
  try {
    await tf.ready(); // Ensure TensorFlow.js backend is ready

    // Configuration: Use the faster, single-person MoveNet variant
    const detectorConfig = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };

    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      detectorConfig
    );
    console.log("MoveNet Detector loaded successfully.");
  } catch (error) {
    console.error("Failed to load MoveNet model:", error);
  }
}

/**
 * Sends a POST request to the backend alert API.
 * @param {object} data - Alert payload.
 */
async function sendAlert(data) {
  // Check for throttling
  const now = Date.now();
  if (now - lastAlertTimestamp < THROTTLE_TIME) {
    console.log("Alert throttled.");
    return;
  }

  lastAlertTimestamp = now;

  try {
    const response = await fetch("http://localhost:3000/api/alert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log("✅ Alert successfully sent to backend.");
    } else {
      console.error("API failed to receive alert:", response.status);
    }
  } catch (error) {
    console.error("Network error sending alert:", error);
  }
}

/**
 * The main loop for video processing and pose detection.
 */
async function detectionLoop() {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    // Match canvas to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 1. Draw the current video frame onto the canvas
    // Note: use scaleX(-1) in CSS to flip, or ctx.scale() here
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (detector) {
      // 2. Run Pose Estimation
      const poses = await detector.estimatePoses(canvas);

      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;

        // 3. Apply Risk Logic: Check if ankles/feet cross the critical Y line
        // Keypoints related to feet: 'left_ankle', 'right_ankle', 'left_foot_index', 'right_foot_index'
        const footKeypoints = keypoints.filter(
          (kp) =>
            (kp.name.includes("ankle") || kp.name.includes("foot_index")) &&
            kp.score > 0.3
        );

        // If at least one foot/ankle is detected AND both detected points are ABOVE the critical Y line
        const isClimbing =
          footKeypoints.length > 0 &&
          footKeypoints.every((kp) => kp.y < criticalY);

        isRiskDetected.value = isClimbing;

        // 4. Trigger Alert
        if (isClimbing) {
          sendAlert({
            location: "Camera 1 - Hallway Railing",
            riskType: "Climbing/High-Risk Elevation",
          });
        }

        // 5. Visualization (Optional but recommended for debugging)
        drawKeypointsAndLine(ctx, keypoints, criticalY);
      }
    }
  }

  // Continue the loop
  requestAnimationFrame(detectionLoop);
}

/**
 * Initializes the camera, model, and the loop.
 */
onMounted(async () => {
  try {
    // 1. Get camera stream
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" }, // Use 'environment' for external cameras
    });
    videoRef.value.srcObject = stream;

    // Wait for video to load metadata (dimensions)
    await new Promise((resolve) => {
      videoRef.value.onloadedmetadata = () => {
        resolve();
      };
    });

    // 2. Load the MoveNet model
    await loadMovenetModel();

    // 3. Start the detection loop
    detectionLoop();
  } catch (err) {
    console.error("Error accessing camera or loading model:", err);
    // Display a user-friendly error message here
  }
});

// Helper function for drawing (Optional, but useful)
function drawKeypointsAndLine(ctx, keypoints, yLine) {
  // Draw the Critical Y Line
  ctx.beginPath();
  ctx.moveTo(0, yLine);
  ctx.lineTo(ctx.canvas.width, yLine);
  ctx.strokeStyle = isRiskDetected.value ? "red" : "yellow";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Draw keypoints (e.g., the ankles)
  ctx.fillStyle = isRiskDetected.value ? "red" : "green";
  keypoints
    .filter((kp) => kp.score > 0.3)
    .forEach((kp) => {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
}
</script>

<style scoped>
.camera-layout {
  display: flex;
  gap: 20px;
}
.camera-monitor {
  position: relative;
  width: 640px; /* Standard CCTV size */
  height: 480px;
  border: 4px solid var(--color-bg-secondary);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: border-color 0.2s;
}
video,
canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: scaleX(-1); /* Flip horizontally for mirror effect */
}
.control-panel {
  flex-basis: 300px; /* Fixed width for controls */
}

/* Risk indicator styling */
.critical-alert {
  border-color: var(--color-alert-red);
  /* Simple pulse animation for critical state */
  animation: pulse 1s infinite alternate;
}
@keyframes pulse {
  from {
    box-shadow: 0 0 15px var(--color-alert-red);
  }
  to {
    box-shadow: 0 0 30px var(--color-alert-red);
  }
}

.risk-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 10px;
  background-color: rgba(239, 68, 68, 0.8); /* Semi-transparent red */
  color: white;
  font-weight: bold;
  text-align: center;
  z-index: 10;
  animation: flash 0.5s infinite alternate;
}
@keyframes flash {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.6;
  }
}

/* Status Indicator Dot */
.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: var(--color-alert-red);
  transition: background-color 0.5s;
}
.status-indicator.active {
  background-color: var(--color-alert-red);
  animation: glow 1s infinite alternate;
}
@keyframes glow {
  from {
    box-shadow: 0 0 5px var(--color-alert-red);
  }
  to {
    box-shadow: 0 0 10px var(--color-alert-red);
  }
}
.control-label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}
</style>
