import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Warehouse WMS",
    short_name: "Warehouse WMS",
    description: "Warehouse Management System PT Advanta Seeds Indonesia.",
    start_url: "/operator/scan",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1a3272",
    icons: [
      {
        src: "/icons/warehouse-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/warehouse-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/warehouse-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
