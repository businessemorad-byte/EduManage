import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export { geistSans, geistMono };

/** Font variable class names shared by every root layout. */
export const fontVariables = `${geistSans.variable} ${geistMono.variable}`;