import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dim Sum Montijo — Your Digital Waiter",
  description:
    "Skip the wait. Upload your menu, get AI recommendations, and order instantly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
