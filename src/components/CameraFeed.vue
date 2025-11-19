<template>
  <div class="camera-layout">
    <div class="camera-monitor" :class="{ 'critical-alert': isRiskDetected }">
      <video ref="videoRef" autoplay muted playsinline></video>
      <canvas ref="canvasRef"></canvas>

      <div v-if="isRiskDetected" class="risk-overlay">
        🚨 CRITICAL RISK DETECTED! IMMEDIATE RESPONSE REQUIRED 🚨
      </div>

      <div v-if="!hasCameraStarted" class="initial-overlay">
        <button @click="startCamera" class="btn-primary">
          Start Camera Feed
        </button>
        <p v-if="cameraError" class="error-message">{{ cameraError }}</p>
      </div>
    </div>

    <div class="controls-and-status-area">
      <div class="control-card card">
        <h3>Camera & Model Status</h3>
        <p>Location: Hallway 3A</p>
        <p>Model: MoveNet Lightning</p>

        <div class="status-group">
          <span
            class="status-indicator"
            :class="{ active: hasCameraStarted }"
          ></span>
          <p>{{ hasCameraStarted ? "Feed Active" : "Feed Stopped" }}</p>
        </div>
        <div class="status-group">
          <span
            class="status-indicator"
            :class="{
              active: isModelLoaded,
              loading: hasCameraStarted && !isModelLoaded,
            }"
          ></span>
          <p>
            {{
              isModelLoaded
                ? "Monitoring Active"
                : hasCameraStarted
                ? "Awaiting Model Load"
                : "Model Unloaded"
            }}
          </p>
        </div>

        <hr />

        <button
          @click="loadAndStartMonitoring"
          :disabled="!hasCameraStarted || isModelLoaded"
          class="btn-primary"
        >
          Load Model & Start Monitoring
        </button>
        <button
          @click="resetCamera"
          :disabled="!hasCameraStarted"
          class="btn-secondary"
        >
          Reset Camera / Stop Feed
        </button>
      </div>

      <div class="control-card card">
        <h3>Danger Line Height (Y: {{ criticalY }})</h3>
        <p class="control-label">
          Define the critical elevation threshold (100 - 600).
        </p>
        <input
          type="range"
          min="100"
          max="600"
          v-model.number="criticalY"
          class="slider-blue"
        />

        <button
          @click="saveCriticalLine"
          :disabled="!hasCameraStarted"
          class="btn-save"
        >
          Save Threshold Position
        </button>

        <p class="throttle-info">
          Current Alert Cooldown: {{ THROTTLE_TIME / 1000 }}s
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";

const videoRef = ref(null);
const canvasRef = ref(null);
const isRiskDetected = ref(false);
const isModelLoaded = ref(false);
const hasCameraStarted = ref(false);
const cameraError = ref("");

let detector = null;
const CRITICAL_Y_KEY = "campusguard_critical_y";
const criticalY = ref(parseInt(localStorage.getItem(CRITICAL_Y_KEY) || 300));
let lastAlertTimestamp = 0;
const THROTTLE_TIME = 15000;
const BACKEND_ALERT_URL = "http://localhost:3000/api/alert";

async function startCamera() {
  cameraError.value = "";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    videoRef.value.srcObject = stream;
    hasCameraStarted.value = true;

    await new Promise((resolve) => {
      videoRef.value.onloadedmetadata = () => {
        if (canvasRef.value) {
          canvasRef.value.width = videoRef.value.videoWidth;
          canvasRef.value.height = videoRef.value.videoHeight;
        }
        resolve();
      };
    });
  } catch (err) {
    cameraError.value = "Failed to access camera. Check permissions.";
    console.error("Camera access error:", err);
    hasCameraStarted.value = false;
  }
}

function saveCriticalLine() {
  localStorage.setItem(CRITICAL_Y_KEY, criticalY.value.toString());
  alert(`Critical Line Threshold saved at Y: ${criticalY.value}`);
}

function resetCamera() {
  isModelLoaded.value = false;

  if (videoRef.value && videoRef.value.srcObject) {
    videoRef.value.srcObject.getTracks().forEach((track) => track.stop());
  }
  videoRef.value.srcObject = null;
  hasCameraStarted.value = false;

  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  }
}

async function loadAndStartMonitoring() {
  if (!hasCameraStarted.value) return;

  try {
    await loadMovenetModel();
    isModelLoaded.value = true;
    detectionLoop();
  } catch (error) {
    console.error("Failed to load and start monitoring:", error);
    isModelLoaded.value = false;
    alert("Failed to load ML model. Check console for details.");
  }
}

async function loadMovenetModel() {
  await tf.ready();
  const detectorConfig = {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  };
  detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    detectorConfig
  );
  console.log("MoveNet Detector loaded successfully.");
}

async function sendAlert(data) {
  const now = Date.now();
  if (now - lastAlertTimestamp < THROTTLE_TIME) {
    return;
  }
  lastAlertTimestamp = now;

  try {
    const response = await fetch(BACKEND_ALERT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      console.log("Alert successfully sent to backend.");
    } else {
      console.error("API failed to receive alert:", response.status);
    }
  } catch (error) {
    console.error("Network error sending alert:", error);
  }
}

async function detectionLoop() {
  const video = videoRef.value;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");

  if (!isModelLoaded.value || !hasCameraStarted.value) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (detector) {
      const poses = await detector.estimatePoses(canvas);

      if (poses.length > 0) {
        const keypoints = poses[0].keypoints;

        const footKeypoints = keypoints.filter(
          (kp) =>
            (kp.name.includes("ankle") || kp.name.includes("foot_index")) &&
            kp.score > 0.3
        );

        const isClimbing =
          footKeypoints.length > 0 &&
          footKeypoints.every((kp) => kp.y < criticalY.value);

        isRiskDetected.value = isClimbing;

        if (isClimbing) {
          sendAlert({
            location: "Camera 1 - Hallway Railing",
            riskType: "Climbing/High-Risk Elevation",
          });
        }

        drawKeypointsAndLine(ctx, keypoints, criticalY.value);
      }
    }
  }

  requestAnimationFrame(detectionLoop);
}

function drawKeypointsAndLine(ctx, keypoints, yLine) {
  ctx.beginPath();
  ctx.moveTo(0, yLine);
  ctx.lineTo(ctx.canvas.width, yLine);
  ctx.strokeStyle = isRiskDetected.value ? "#EF4444" : "yellow";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = isRiskDetected.value ? "#EF4444" : "#10B981";
  keypoints
    .filter((kp) => kp.score > 0.3)
    .forEach((kp) => {
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
}

onUnmounted(() => {
  resetCamera();
});
</script>

<style scoped>
.camera-layout {
  display: flex;
  flex-direction: column; /* Stacks children vertically */
  gap: 20px;
  align-items: center; /* Centers the whole block on the page */
}

.controls-and-status-area {
  display: flex; /* Makes the cards sit side-by-side */
  gap: 20px;
  width: 800px; /* IMPORTANT: Match this width to the .camera-monitor width */
}

.camera-monitor {
  position: relative;
  /* Use the larger dimensions requested previously */
  width: 800px;
  height: 600px;
  border: 4px solid var(--color-bg-secondary);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: border-color 0.2s;
}
video,
canvas {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: scaleX(-1);
}

.control-panel {
  /* This class will now be used inside controls-and-status-area */
  flex: 1; /* Allows the control cards to share the space equally */
  min-width: 380px; /* Ensures controls don't get too squeezed */
}

.critical-alert {
  border-color: var(--color-alert-red);
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
  background-color: rgba(239, 68, 68, 0.8);
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

.initial-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(26, 32, 44, 0.9);
  z-index: 100;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.status-group {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.error-message {
  color: var(--color-alert-red);
  margin-top: 15px;
}
.status-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: #4a5568;
  transition: background-color 0.5s;
}
.status-indicator.active {
  background-color: var(--color-success-green);
  animation: glow 1s infinite alternate;
}
.status-indicator.loading {
  background-color: var(--color-accent-blue);
  animation: spin 2s linear infinite;
}
@keyframes glow {
  from {
    box-shadow: 0 0 5px var(--color-success-green);
  }
  to {
    box-shadow: 0 0 10px var(--color-success-green);
  }
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.control-label {
  font-size: 0.9em;
  color: var(--color-text-secondary);
}
.throttle-info {
  font-size: 0.8em;
  color: var(--color-text-secondary);
  margin-top: 10px;
}
</style>
