import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeatherWise - Aether Weather",
  description: "An elegant, futuristic weather dashboard powered by Open-Meteo API.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
