import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Wineify",
  description: "Fota en vinmeny och fa personliga rekommendationer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="h-full antialiased">
      <body className={`${jost.className} min-h-full flex flex-col bg-white text-black`}>
        {children}
      </body>
    </html>
  );
}
