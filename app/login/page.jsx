"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, Lock, Languages, Sun, Moon, EyeOff, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import client from "@/lib/supabaseClient";
import { useRouter } from "next/navigation"; // For redirect after login
import { useAuth } from "@/app/components/context/AuthProvider"; 
export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signIn } = useAuth()
  const [dbStatus, setDbStatus] = useState(null); // For connection test

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("language", i18n.language);
  }, [i18n.language]);

  // Test Supabase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 Testing Supabase connection...');
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        // Simple test to check if Supabase is reachable
        const { error } = await client.auth.getSession();

        if (error) {
          console.log('!! Supabase responded with:', error.message);
          setDbStatus('connected but needs auth');
        } else {
          console.log('++ Supabase connection successful!');
          setDbStatus('connected');
        }
      } catch (err) {
        console.error('+++Cannot connect to Supabase:', err.message);
        setDbStatus('failed');
      }
    };

    testConnection();
  }, []);


  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)

      console.log("---- Login successful for:", email)
      router.push("/dashboard")
    } catch (err) {
      setError(err.message)
      console.error("+++ Login error for:", email, "Error:", err.message)
    } finally {
      setLoading(false)
    }
    console.log("Login process completed for:", email)
  }

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ja" : "en";
    i18n.changeLanguage(newLang);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Debug info - remove after testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          DB Status: {dbStatus || 'checking...'}
        </div>
      )}

      {/* LEFT IMAGE SECTION */}
      <div className="hidden lg:flex flex-1 relative">
        <Image
          src="/login-bg.png"
          alt="Background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* RIGHT LOGIN SECTION */}
      <div className="w-full lg:flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12 relative bg-background">
        {/* Language and Theme Toggles - Top Right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 z-10">
          <button
            onClick={toggleLanguage}
            className="p-2 sm:p-2.5 rounded-lg border border-border bg-card hover:bg-accent shadow-sm transition-colors"
            aria-label="Toggle Language"
          >
            <Languages className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
          {mounted && (
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-lg border border-border bg-card hover:bg-accent shadow-sm transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              )}
            </button>
          )}
        </div>

        <div className="w-full max-w-md">
          {/* Logo and Title */}
          <div className="flex flex-col items-center space-y-3 mb-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-xl flex items-center justify-center relative">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain p-2 invert dark:invert-0"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              {t("welcome")}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground text-center">
              {t("loginSubtitle")}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              Error: {error}
            </div>
          )}

          {/* Form - Add onSubmit handler */}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("emailLabel")}
              </label>
              <div className="flex items-center border border-border rounded-xl px-4 py-2.5 sm:py-3 bg-card focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-colors">
                <Mail className="w-5 h-5 text-muted-foreground mr-2" />
                <input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full outline-none text-foreground text-sm sm:text-base bg-transparent placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {t("passwordLabel")}
              </label>
              <div className="flex items-center border border-border rounded-xl px-4 py-2.5 sm:py-3 bg-card focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-colors">
                <Lock className="w-5 h-5 text-muted-foreground mr-2" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full outline-none text-foreground text-sm sm:text-base bg-transparent placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"        
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 sm:py-3.5 rounded-xl font-medium hover:bg-primary/90 transition text-sm sm:text-base disabled:opacity-50"
            >

              {loading ? t("loginProcessing") : t("loginButton")}
            </button>
          </form>

          {/* Divider */}
          {/* <div className="my-6 sm:my-8 flex items-center">
            <div className="flex-grow h-px bg-border" />
            
            <div className="flex-grow h-px bg-border" />
          </div> */}

          
          {/* <div className="flex justify-end">
            <Link
              href="/forgotPassword"
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div> */}
          {/* Sign Up Link */}
          <p className="text-center text-sm sm:text-base text-muted-foreground mt-6 sm:mt-8">
            {t("noAccount")}{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}