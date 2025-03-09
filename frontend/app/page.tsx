import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black overflow-hidden">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50/20 dark:from-purple-900/10 pointer-events-none" />
          <div className="container max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col items-center gap-6 sm:gap-8 text-center animate-fade-in">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-400">
                Connect and chat in real-time{" "}
                <br className="hidden sm:inline" />
                with Verbose Chat
              </h1>
              <p className="max-w-[800px] text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                A modern chat application with real-time messaging, email
                authentication, and a beautiful UI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-8 w-full sm:w-auto">
                <Link href="/signup" className="w-full sm:w-auto group">
                  <Button className="w-full h-12 sm:h-14 text-lg bg-purple-600 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto group">
                  <Button
                    variant="outline"
                    className="w-full h-12 sm:h-14 text-lg group-hover:border-purple-500 transition-all duration-300 transform hover:scale-105"
                  >
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-20 sm:py-32 px-4">
          <div className="container max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
              {[
                {
                  icon: <MessageSquare className="h-8 w-8 text-purple-600" />,
                  title: "Real-time Messaging",
                  description:
                    "Instant message delivery with Socket.io integration",
                },
                {
                  icon: (
                    <svg
                      className="h-8 w-8 text-purple-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7H2Z" />
                      <path d="M6 11v.01" />
                      <path d="M12 11v.01" />
                      <path d="M18 11v.01" />
                    </svg>
                  ),
                  title: "Beautiful UI",
                  description: "Modern design with dark and light mode support",
                },
                {
                  icon: (
                    <svg
                      className="h-8 w-8 text-purple-600"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 12h2l-8-10-8 10h2v8h12z" />
                    </svg>
                  ),
                  title: "Secure Authentication",
                  description:
                    "Email-based authentication with OTP verification",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-black p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-50/50 dark:from-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="rounded-full bg-purple-50 dark:bg-purple-900/20 p-4 w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
