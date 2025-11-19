import { createRouter, createWebHistory } from "vue-router";
import CameraFeed from "../components/CameraFeed.vue"; // Your existing component
import AlertDashboard from "../views/AlertDashboard.vue"; // Component to create next

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "CameraFeed",
      component: CameraFeed,
      meta: { title: "Camera Setup" },
    },
    {
      path: "/dashboard",
      name: "AlertDashboard",
      component: AlertDashboard,
      meta: { title: "Alert Dashboard" },
    },
  ],
});

export default router;
