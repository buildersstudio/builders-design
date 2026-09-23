import type { Metadata } from "next";
import { Toaster } from "@/components/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: "Builders Design",
  description: "Brands, decks and pages for the ventures of Builders Studio.",
  icons: { icon: "/brand/spark-black.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
