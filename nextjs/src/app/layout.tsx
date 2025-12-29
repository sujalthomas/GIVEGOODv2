import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google'


export const metadata: Metadata = {
  title: "Give Good Club | Feed Street Animals with Love",
  description: "A grassroots volunteer initiative building DIY PVC-pipe dog feeders for street animals in Bangalore. Join us in spreading kindness, one feeder at a time.",
  keywords: "street dogs, animal welfare, Bangalore, NGO, volunteer, community, dog feeders, animal rescue, Karnataka",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let theme = process.env.NEXT_PUBLIC_THEME
  if(!theme) {
    theme = "theme-givegood"
  }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  return (
    <html lang="en">
    <body className={theme}>
      {children}
      <Analytics />
      <CookieConsent />
      { gaID && (
          <GoogleAnalytics gaId={gaID}/>
      )}

    </body>
    </html>
  );
}
