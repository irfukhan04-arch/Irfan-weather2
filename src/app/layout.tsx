import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skylight Weather",
  description: "A clear look at the weather today and all week.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
