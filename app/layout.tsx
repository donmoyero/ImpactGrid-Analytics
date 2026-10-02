import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ImpactGrid Analytics — Websites built for you",
  description:
    "Run your business from one place: customers, staff, appointments, products and your own website, built and managed with ImpactGrid Analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="bg-ink text-paper font-body antialiased">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
