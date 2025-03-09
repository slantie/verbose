"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

export function HeaderWrapper() {
  const pathname = usePathname();
  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify");
  if (isAuthPage) return null;
  return <Header />;
}
