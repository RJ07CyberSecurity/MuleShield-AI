import type { Metadata } from "next";
import "./globals.css";
import MainLayout from "../components/layout/MainLayout";
import QueryProvider from "../components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "MuleShield AI | Investigative Suite",
  description: "Forensic intelligence for financial crime teams.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryProvider>
          <MainLayout>{children}</MainLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
