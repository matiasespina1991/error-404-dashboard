import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: {
    default: "Error404 — Dashboard",
    template: "%s · Error404 Dashboard",
  },
  icons: {
    icon: [
      { url: "/icons/error404-v2.png", type: "image/png", sizes: "48x48" },
    ],
    shortcut: "/icons/error404-v2.png",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-background font-sans antialiased">
        <ThemeProvider>
          {children}
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
