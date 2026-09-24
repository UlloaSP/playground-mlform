import "./styles.css";
import { mountDemoPreview, mountDemoShell } from "./demo-shell.js";

if (new URLSearchParams(window.location.search).get("preview") === "1") {
  mountDemoPreview();
} else {
  mountDemoShell();
}
