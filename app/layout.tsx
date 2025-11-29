import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { ThemeProvider } from "@/components/theme-provider"
import { PortalCleanup } from "@/components/PortalCleanup"
import { ErrorBoundary } from "@/components/ErrorBoundary"
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FindMyPet - Pet Rescue, Missing Pet Reporting & Animal Lovers Hub",
  description: "Find missing pets, report found animals, and help save stray animals. Join our community to reunite pets with their owners.",
  keywords: ["pet rescue", "find missing pet", "report a missing pet", "save stray animals", "lost pet", "found pet", "animal lovers hub", "saving one pet a time"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <PortalCleanup />
            <main>
              {children}
            </main>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
