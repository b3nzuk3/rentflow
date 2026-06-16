import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentFlow — Property Management Platform",
  description: "Multi-tenant SaaS platform for African property management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background-custom text-on-surface antialiased">
        {children}
      </body>
    </html>
  );
}
