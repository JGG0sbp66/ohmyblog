import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import i18n from "@/composables/lang.hook";
import "@/composables/theme.hook";
import { toastConfig } from "@/composables/toast.hook";
import Vue3Toastify from "vue3-toastify";

import "./css/tailwind.css";
import "./css/toast.css";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(i18n);
app.use(Vue3Toastify, toastConfig);

app.mount("#app");
