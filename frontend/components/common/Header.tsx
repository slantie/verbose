"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { MessageSquare, Menu, X, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Debug logging to identify auth issues
  useEffect(() => {
    console.log("Header auth state:", { isAuthenticated, user });
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    console.log("Logging out...");
    logout();
    router.push("/");
    setIsOpen(false);
  };

  const AuthenticatedNav = () => (
    <>
      <div className="hidden sm:flex items-center gap-5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                <User className="h-5 w-5 text-purple-600" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{user?.username || "User"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-red-600 dark:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="sm:hidden p-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </>
  );

  const UnauthenticatedNav = () => (
    <>
      <div className="hidden sm:flex items-center gap-5">
        <Link href="/login">
          <Button
            variant="ghost"
            className="text-base px-5 py-2 transition-all duration-300 hover:text-purple-600 dark:hover:text-purple-400 font-medium hover:bg-purple-50 dark:hover:bg-purple-950/30"
          >
            Log in
          </Button>
        </Link>
        <Link href="/signup">
          <Button className="text-base font-medium px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-all duration-300 hover:shadow-md hover:shadow-purple-500/20 border-0">
            Sign Up
          </Button>
        </Link>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="sm:hidden p-1.5 hover:bg-purple-50 dark:hover:bg-purple-950/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>
    </>
  );

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <nav
        className={`border-b border-gray-100/30 dark:border-gray-800/50 ${
          scrolled
            ? "bg-white/95 dark:bg-gray-900/95"
            : "bg-white/90 dark:bg-black/90"
        } backdrop-blur-lg transition-all duration-300`}
      >
        <div className="container flex h-16 items-center justify-between px-4 sm:px-8 max-w-[1920px] mx-auto">
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-all duration-300 hover:scale-105"
          >
            <MessageSquare className="h-6 w-6 text-purple-600 drop-shadow-sm" />
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400">
              Verbose Chat
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <ThemeToggle />
            {isAuthenticated ? <AuthenticatedNav /> : <UnauthenticatedNav />}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-x-0 sm:hidden bg-white/95 dark:bg-gray-900/95 backdrop-blur-md transition-all duration-300 ease-in-out shadow-lg ${
          isOpen ? "top-16 opacity-100" : "-top-full opacity-0"
        }`}
      >
        <div className="flex flex-col gap-4 p-6">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                  <User className="h-5 w-5 text-purple-600" />
                </div>
                <span className="font-medium">{user?.username || "User"}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-base font-medium text-red-600 dark:text-red-400 transition-colors rounded-md px-4 py-3 hover:bg-red-50/50 dark:hover:bg-red-950/30 text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors rounded-md px-4 py-3 hover:bg-purple-50/50 dark:hover:bg-purple-950/30"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-all rounded-md px-4 py-3 text-center shadow-sm hover:shadow-md"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
