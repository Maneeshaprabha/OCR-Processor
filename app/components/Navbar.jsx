"use client";
 
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import {
  ChevronLeft,
  Languages,
  Settings,
  Sun,
  Moon,
  LogOut,
  Menu,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/components/context/AuthProvider";
import supabase from "@/lib/supabaseClient";
 
export default function Navbar({ collapsed, setCollapsed, setMobileOpen }) {
  const [open, setOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState(null);
 
  const [profile, setProfile] = useState(null);
  const { signOut } = useAuth();
  const dropdownRef = useRef(null);
  const [profileUpdated, setProfileUpdated] = useState(false);
 
  useEffect(() => {
    const updateDatabase = async () => {
      // Sync theme and language preferences to DB whenever they change
 
      if (user && resolvedTheme && i18n.language) {
        console.log("Syncing to DB ->", resolvedTheme, i18n.language);
 
        const { error } = await supabase
          .from("profiles")
          .update({
            theme_pref: resolvedTheme, // 'dark' or 'light'
            language_pref: i18n.language, // 'en' or 'ja'
          })
          .eq("id", user.id);
 
        if (error) {
          console.error("+++ DB Update Error:", error.message);
        }
      }
    };
 
    updateDatabase();
  }, [resolvedTheme, i18n.language, user]);
 
  useEffect(() => {
    setMounted(true);
 
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
 
    getUser();
  }, []);
 
  useEffect(() => {
    const handleMouseDown = (event) => {
      if (!dropdownRef.current) return;
 
      if (!dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
 
    document.addEventListener("mousedown", handleMouseDown);
 
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);
 
  const toggleLanguage = async () => {
    const newLang = i18n.language === "en" ? "ja" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("appLanguage", newLang);
    if (user) {
      await supabase
        .from("profiles")
        .update({ language_pref: newLang })
        .eq("id", user.id);
    }
  };
 
  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (user) {
      await supabase
        .from("profiles")
        .update({ theme_pref: newTheme })
        .eq("id", user.id);
    }
  };
 
  const handleLogout = async () => {
    try {
      console.log("+++++= Attempting logout...");
 
      await signOut();
 
      console.log("[[[]]] Logout successful!");
      router.push("/login");
    } catch (err) {
      console.error(" 404 Logout error:", err?.message || err);
 
      alert(err?.message || "Logout failed. Please try again.");
    }
  };
 
  useEffect(() => {
    const getProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
 
      setProfile(data);
    };
 
    if (user) {
      getProfile();
    }
  }, [user]);
 
  //if (!profile) return null;
 
  const fullName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "Loading...";
 
  const firstLetter = fullName.charAt(0).toUpperCase();
 
  return (
    <nav className="w-full bg-card border-b border-border h-14 flex z-50 transition-colors duration-300">
      {/* LEFT SECTION */}
      <div
        className={`${
          collapsed
            ? "lg:w-20 lg:justify-center"
            : "lg:w-64 lg:px-6 lg:justify-between"
        } w-auto px-4 justify-start h-full flex items-center border-r-0 lg:border-r border-border transition-all duration-300 ease-in-out bg-card`}
      >
        <Link
          href="/"
          className="flex items-center gap-3 pl-4 lg:pl-0 hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={24}
              height={24}
              className="invert dark:invert-0"
            />
          </div>
 
          {!collapsed && (
            <span suppressHydrationWarning className="text-lg font-semibold text-foreground whitespace-nowrap hidden lg:block">
              {t("appName")}
            </span>
          )}
          <span suppressHydrationWarning className="text-lg font-semibold text-foreground whitespace-nowrap lg:hidden">
            {t("appName")}
          </span>
        </Link>
 
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="hidden lg:block p-1 rounded hover:bg-accent hover:text-accent-foreground transition text-muted-foreground"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>
 
      <div className="flex-1 h-full flex items-center justify-end gap-3 lg:gap-5 pr-4 lg:pr-6 relative">
        {/* Theme Toggle - Visible always */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-accent text-foreground transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
 
        {/* Language Toggle - Visible always */}
        {mounted && (
          <Languages
            size={18}
            className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
            onClick={toggleLanguage}
          />
        )}
 
        {/* Mobile Menu Button - Mobile Only */}
        <button
          suppressHydrationWarning
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-1 text-muted-foreground hover:text-foreground ml-2"
        >
          <Menu size={24} />
        </button>
 
 
        {/* User Profile with Dropdown - Desktop Only */}
        <div className="hidden lg:block relative">
          {/* User Profile Button */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setOpen(!open)}
          >
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">
              {firstLetter}
            </div>
 
            <span className="text-sm text-foreground">{fullName}</span>
          </div>
 
          {/* Dropdown */}
          {open && (
            <div
              ref={dropdownRef}
              className="absolute right-0 top-full mt-2 w-56 bg-popover text-popover-foreground shadow-lg rounded-lg text-sm border border-border"
            >
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-semibold">
                  {firstLetter}
                </div>
                <div>
                  <p className="font-medium">
                    {profile?.first_name && profile?.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : "User"}
                  </p>
                  <p className="text-muted-foreground text-xs">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => router.push("/settings")}
                className="w-full p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center gap-2 rounded-md"
              >
                <Settings size={16} />
                <span suppressHydrationWarning>{t("sidebar.settings")}</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full p-2 hover:bg-destructive/10 hover:text-destructive cursor-pointer text-destructive flex items-center gap-2 rounded-md"
              >
                <LogOut size={16} />
                <span suppressHydrationWarning>{t("sidebar.logout")}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}