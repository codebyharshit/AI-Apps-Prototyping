import "./globals.css";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/utils";
import { SidebarProvider } from "@/components/ui/sidebar";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AI App Prototyper",
  description: "Build interactive AI-powered prototypes quickly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <SidebarProvider
          defaultOpen={false}
          style={{
            "--sidebar-width": "24rem",
          }}
        >
          {children}
        </SidebarProvider>
      </body>
    </html>
  );
}
