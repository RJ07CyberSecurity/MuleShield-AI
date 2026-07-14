import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "../components/layout/MainLayout";

export const metadata: Metadata = {
  title: "MuleShield AI | Investigative Suite",
  description: "Forensic intelligence for financial crime teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
