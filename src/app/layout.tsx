import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThesisBench",
  description: "A falsifiability layer for US stock AI trading agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
