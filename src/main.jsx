import ReactDOM from "react-dom/client";
import { LocaleProvider } from "@douyinfe/semi-ui";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import "./index.css";
import "./i18n/i18n.js";

const isElectron = import.meta.env.VITE_ELECTRON === "true";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LocaleProvider locale={en_US}>
    <App />
    {!isElectron && <Analytics />}
  </LocaleProvider>,
);
