import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nunes Connect",
    short_name: "Nunes Connect",
    description: "Customer messaging, service and calibration portal for Nunes Instrumentation",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f7f6",
    theme_color: "#0d7a59",
    orientation: "portrait",
  };
}
