"use client";
 
import {
  LayoutDashboard,
  Upload,
  Download,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/components/context/AuthProvider"
const menuItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "documentUpload", href: "/upload", icon: Upload },
  { key: "exportData", href: "/export", icon: Download },
  { key: "settings", href: "/settings", icon: Settings },
];
 
import { useTheme } from "next-themes";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Sun, Moon, Languages, LogOut } from "lucide-react";
import { useRouter } from 'next/navigation';
import supabase from "@/lib/supabaseClient";
 
export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [user, setUser] = useState(null);
  const { signOut } = useAuth()
  const [profile, setProfile] = useState(null)
 
  useEffect(() => {
    setMounted(true);
 
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
 
    getUser();
  }, []);
 
  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (user) {
      await supabase.from("profiles").update({ theme_pref: newTheme }).eq("id", user.id);
    }
  };
 
  const toggleLanguage = async () => {
    const newLang = i18n.language === "en" ? "ja" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("appLanguage", newLang);
    if (user) {
      await supabase.from("profiles").update({ language_pref: newLang }).eq("id", user.id);
    }
  };
 
 
  const handleLogout = async () => {
    try {
      console.log("+++++= Attempting logout...")
 
      await signOut()
 
      console.log("[[[[[[]]]]]] Logout successful!")
      router.push("/login")
 
    } catch (err) {
      console.error("404 Logout error:", err?.message || err)
 
      alert(err?.message || "Logout failed. Please try again.")
    }
  }
  useEffect(() => {
    const getProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single()
 
      setProfile(data)
    }
 
    if (user) {
      getProfile()
    }
  }, [user])
  const fullName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user?.email?.split("@")[0] || "User";
 
  const firstLetter = fullName.charAt(0).toUpperCase();
  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
 
      {/* Sidebar Container */}
      <header
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-card border-r border-border flex flex-col justify-between transition-all duration-300 ease-in-out
          ${collapsed ? "lg:w-20" : "lg:w-64"}
          ${mobileOpen ? "translate-x-0 w-64 shadow-xl" : "-translate-x-full lg:translate-x-0 w-64"}
        `}
      >
        <div className="space-y-2 p-4 flex-1 overflow-y-auto">
          <div className="w-full flex justify-end lg:justify-center mb-4">
            {/* Mobile Close Button */}
            <button
              suppressHydrationWarning
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-accent text-muted-foreground hover:text-accent-foreground"
            >
              <ChevronRight size={18} className="rotate-180" />
            </button>
 
            {/* Desktop Collapse Button */}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="hidden lg:block p-1 rounded hover:bg-accent text-muted-foreground hover:text-accent-foreground"
              >
                <ChevronRight size={18} />
              </button>
            )}
          </div>
 
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
 
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center ${
                collapsed ? "lg:justify-center" : "gap-3"
                  } px-4 py-3 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-accent/10 border border-border shadow-sm text-foreground font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {(!collapsed || mobileOpen) && (
                  <span suppressHydrationWarning className={`whitespace-nowrap ${collapsed ? "lg:hidden" : ""}`}>
                    {t(`sidebar.${item.key}`)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
 
        {/* Mobile Profile & Footer Section */}
        {(!collapsed || mobileOpen) && (
          <div className="border-t border-border p-4">
            {/* Mobile Only Profile & Toggles */}
            <div className="lg:hidden mb-6 space-y-4">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
                <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white font-medium">{firstLetter}</span>
                </div>
                {/* //<Image src="/avatar.png" width={36} height={36} className="rounded-full" alt="User" /> */}
                <div className="overflow-hidden">
                  <p className="font-medium text-sm text-foreground truncate"> {profile?.first_name && profile?.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
 
              <div className="grid grid-cols-2 gap-2">
                <button suppressHydrationWarning onClick={toggleTheme} className="flex items-center justify-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-accent transition text-foreground">
                  {mounted && theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
                  <span className="text-xs font-medium">{mounted && theme === 'dark' ? "Light" : "Dark"}</span>
                </button>
                <button suppressHydrationWarning onClick={toggleLanguage} className="flex items-center justify-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-accent transition text-foreground">
                  <Languages size={16}/>
                  <span className="text-xs font-medium">{mounted ? (i18n.language === 'en' ? "日本語" : "English") : "English"}</span>
                </button>
              </div>
 
              <button suppressHydrationWarning onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20 transition">
                <LogOut size={16} />
                <span suppressHydrationWarning className="text-xs font-medium">{t("sidebar.logout")}</span>
              </button>
            </div>
 
            <div suppressHydrationWarning className={`text-xs text-muted-foreground text-center ${collapsed ? "lg:hidden" : ""}`}>
              © 2026 {t("appTitle")}. {t("rightsReserved")}
              <br />
              v1.0.2
            </div>
          </div>
        )}
      </header>
    </>
  );
}
