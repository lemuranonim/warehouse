import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Warehouse WMS",
    short_name: "Warehouse WMS",
    description: "Inventory operations, LPN scanning, receiving, picking, and dispatch.",
    start_url: "/operator/scan",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#16202b",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
