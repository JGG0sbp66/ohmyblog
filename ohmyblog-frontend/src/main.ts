// src/main.ts
import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import i18n from "@/composables/lang.hook";

import "./css/tailwind.css";
import "./css/animations.css";
import "./css/toast.css";
import "./css/tiptap/index.css";

const app = createApp(App);

app.use(createPinia());
app.use(i18n);
app.use(router);

app.mount("#app");
