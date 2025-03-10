"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";

export function HeaderWrapper() {
  const pathname = usePathname();
  console.log("Current pathname:", pathname); // Add this debug line

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify");

  console.log("isAuthPage:", isAuthPage); // Add this debug line

  if (isAuthPage) return null;
  return <Header />;
}
