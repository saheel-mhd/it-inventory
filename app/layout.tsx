import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "~/lib/app-brand";

// One face for the whole app. Inter holds up at the 12-14px sizes this UI
// leans on and has the tabular figures the inventory tables need.
const uiFont = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${uiFont.variable} bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
