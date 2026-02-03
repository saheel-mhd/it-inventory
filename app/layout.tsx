import "./globals.css";
import { Bodoni_Moda, Courier_Prime, Sanchez } from "next/font/google";

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
