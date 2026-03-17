import "./globals.css";
import type { Metadata } from "next";
import { Bodoni_Moda, Courier_Prime, Sanchez } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "~/lib/app-brand";

const headingFont = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const bodyFont = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
});

const navFont = Sanchez({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-nav",
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${navFont.variable} bg-gray-50 text-gray-900`}
      >
        {children}
      </body>
    </html>
  );
}
