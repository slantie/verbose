import { RootProvider } from "@/components/providers/RootProvider";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chat App",
  description: "Real-time chat application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} h-[100dvh] overflow-hidden`}>
        <RootProvider>
          <div className="flex flex-col h-full">
            {/* App header would go here if present */}
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </RootProvider>
      </body>
    </html>
  );
}
