import { createApp } from "vue";
import App from "./App.vue";
import "@/assets/main.css";
import terminal from "virtual:terminal";
globalThis.console = terminal;

createApp(App).mount("#app");
