import "./globals.css";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { HeaderWrapper } from "@/components/common/HeaderWrapper"; // Update import
import { RootProvider } from "@/components/providers/RootProvider";

const dmSans = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Verbose Chat",
  description: "A real-time chat application with OTP verification",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={dmSans.className}>
        <RootProvider>
          <HeaderWrapper /> {/* Replace Header with HeaderWrapper */}
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
