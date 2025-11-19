import { createRouter, createWebHistory } from "vue-router";
import CameraFeed from "../components/CameraFeed.vue";
import AlertDashboard from "../views/AlertDashboard.vue";

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
