<template>
  <div class="dashboard-grid">
    <div class="stat-card critical">
      <h3>Unacknowledged Alerts</h3>
      <p class="stat-number">{{ unacknowledgedCount }}</p>
    </div>

    <div class="stat-card">
      <h3>System Status</h3>
      <p class="stat-number">
        <span
          :class="{ 'active-text': isPolling, 'inactive-text': !isPolling }"
        >
          {{ isPolling ? "LIVE" : "STOPPED" }}
        </span>
      </p>
      <button @click="fetchAlerts" class="btn-refresh">
        <span class="refresh-icon">🔄</span> Refresh Now
      </button>
    </div>

    <div class="log-area card">
      <h2>Alert Log ({{ alerts.length }} Total)</h2>
      <table class="alert-table">
        <thead>
          <tr>
            <th>Time (UTC)</th>
            <th>Location</th>
            <th>Risk Type</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="alert in alerts"
            :key="alert.id"
            :class="{ 'critical-row': alert.status === 'Unacknowledged' }"
          >
            <td>{{ formatTimestamp(alert.timestamp) }}</td>
            <td>{{ alert.location }}</td>
            <td>{{ alert.riskType }}</td>
            <td>
              <span
                class="status-badge"
                :class="{
                  'badge-critical': alert.status === 'Unacknowledged',
                  'badge-acknowledged': alert.status === 'Acknowledged',
                }"
              >
                {{ alert.status }}
              </span>
            </td>
            <td>
              <button
                v-if="alert.status === 'Unacknowledged'"
                @click="acknowledgeAlert(alert.id)"
                class="btn-acknowledge"
              >
                Acknowledge
              </button>
            </td>
          </tr>
          <tr v-if="alerts.length === 0">
            <td colspan="5" class="no-alerts">
              No alerts logged yet. Monitoring is clear.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";

const alerts = ref([]);
const isPolling = ref(true);
let pollInterval = null;
const BACKEND_URL = "http://localhost:3000/api/alerts";
const ACKNOWLEDGE_URL = "http://localhost:3000/api/acknowledge";

const unacknowledgedCount = computed(() => {
  return alerts.value.filter((a) => a.status === "Unacknowledged").length;
});

/**
 * Fetches the alert log from the backend API.
 */
async function fetchAlerts() {
  try {
    const response = await fetch(BACKEND_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    // Assuming the backend returns the latest alerts first
    alerts.value = data;
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    // You could set a reactive error message here
  }
}

/**
 * Starts the periodic data fetching.
 */
function startPolling() {
  // Fetch immediately, then set up the interval
  fetchAlerts();
  pollInterval = setInterval(fetchAlerts, 5000); // Poll every 5 seconds
}

/**
 * Stops the periodic data fetching.
 */
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    isPolling.value = false;
  }
}

/**
 * Helper to format the ISO timestamp.
 */
function formatTimestamp(isoString) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// --- Lifecycle Hooks ---
onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling(); // Crucial to prevent memory leaks when leaving the component
});

/**
 * Sends a request to the backend to mark an alert as acknowledged.
 */
async function acknowledgeAlert(id) {
  try {
    // Send POST request to backend
    const response = await fetch(`${ACKNOWLEDGE_URL}/${id}`, {
      method: "POST",
    });

    if (response.ok) {
      // Optimistic UI update: update the local state immediately
      const index = alerts.value.findIndex((a) => a.id === id);
      if (index !== -1) {
        alerts.value[index].status = "Acknowledged";
      }
    } else {
      console.error("Failed to acknowledge alert on server.");
    }
  } catch (error) {
    console.error("Network error acknowledging alert:", error);
  }
}
</script>

<style scoped>
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.log-area {
  grid-column: 1 / span 3; /* Table spans all columns */
  padding: 0; /* Card padding is inside the .card class */
}

/* Stat Cards */
.stat-card {
  padding: 25px;
  text-align: center;
}
.stat-card h3 {
  border: none;
  font-size: 1em;
  color: var(--color-text-secondary);
}
.stat-number {
  font-size: 3em;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}
.stat-card.critical .stat-number {
  color: var(--color-alert-red);
}

.active-text {
  color: var(--color-accent-blue);
}
.inactive-text {
  color: var(--color-alert-red);
}

/* Table Styling */
.alert-table {
  width: 100%;
  border-collapse: collapse;
}
.alert-table th,
.alert-table td {
  padding: 15px;
  border-bottom: 1px solid var(--color-bg-primary); /* Use primary BG color for lines */
  background-color: var(--color-bg-secondary);
}
.alert-table th {
  background-color: var(--color-bg-primary); /* Darker header */
  color: var(--color-accent-blue);
  text-transform: uppercase;
  font-weight: 500;
  font-size: 0.9em;
}

/* Critical Alert Row Visuals */
.critical-row {
  background-color: var(--color-alert-bg) !important;
  color: var(--color-text-primary);
  animation: pulse-row 1.5s ease-out infinite alternate;
}
@keyframes pulse-row {
  from {
    opacity: 1;
  }
  to {
    opacity: 0.9;
  }
}

/* Status Badges (Pills) */
.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: bold;
  text-transform: uppercase;
}
.badge-critical {
  background-color: var(--color-alert-red);
  color: white;
}
.badge-acknowledged {
  background-color: #4a5568; /* Gray background */
  color: var(--color-text-primary);
}

/* Action Buttons */
.btn-acknowledge {
  background-color: var(--color-accent-blue);
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-acknowledge:hover {
  background-color: #63b3ed;
}
.btn-refresh {
  background: none;
  border: 1px solid var(--color-text-secondary);
  color: var(--color-text-secondary);
  padding: 5px 10px;
  border-radius: 4px;
  margin-top: 10px;
  cursor: pointer;
}
.btn-refresh:hover {
  color: var(--color-text-primary);
  border-color: var(--color-text-primary);
}
.refresh-icon {
  display: inline-block;
  animation: spin 2s linear infinite; /* Subtle animation for visual feedback */
  animation-play-state: paused;
}
.btn-refresh:hover .refresh-icon {
  animation-play-state: running;
}

.no-alerts {
  text-align: center;
  font-style: italic;
  color: var(--color-text-secondary);
  padding: 20px !important;
}
</style>
