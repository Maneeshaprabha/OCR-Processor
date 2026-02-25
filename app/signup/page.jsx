// app/(auth)/signup/page.jsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Languages, Sun, Moon, Eye, EyeOff } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/app/components/context/AuthProvider";

export default function SignUpPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { signUp } = useAuth(); // "" AuthContext hook

  const [mounted, setMounted] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const [error, setError] = useState(null);

  // Mounted flag
  useEffect(() => setMounted(true), []);

  // Language from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && savedLang !== i18n.language)
      i18n.changeLanguage(savedLang);
  }, []);

  useEffect(() => {
    localStorage.setItem("language", i18n.language);
  }, [i18n.language]);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "ja" : "en";
    i18n.changeLanguage(newLang);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // ===============================
  // Signup handler
  // ===============================
  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null); // clear old errors

    // 1. 1st check the basic validations (empty fields, password strength, agreed to terms)
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    //  2. check password matching
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError(
        "Password must contain at least one special character (e.g., !@#$%^&*).",
      );
      return;
    }

    //  3. last check checkbox
    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      console.log("Attempting to sign up user with email:", email);

      //  call the function have authcontext
      await signUp(
        firstName,
        lastName,
        email,
        password,
        resolvedTheme || theme,
        i18n.language,
      );

      console.log(" $$ User signed up successfully!");

      // Redirect to login after signup
      router.push("/login");
    } catch (err) {
      console.error("Signup Error:", err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* LEFT IMAGE  set to hidden on smaller screens */}
      <div className="hidden lg:flex flex-1 relative">
        <Image
          src="/signup.png"
          alt="Signup"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* RIGHT SIGNUP SECTION */}
      <div className="w-full lg:flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12 relative bg-background">
        {/* Language and Theme Toggles */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex gap-2 z-10">
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-lg border border-border bg-card hover:bg-accent shadow-sm transition-colors"
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

        {/* Form Container - Centered */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 md:px-14 pb-20">
          <div className="w-full max-w-md">
            {/* Logo and Title */}
            <div className="flex flex-col items-center space-y-2 mb-5">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center relative">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain p-2 invert dark:invert-0"
                />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                {t("welcome")}
              </h1>
              <p className="text-sm text-muted-foreground text-center">
                {t("signUpSubtitle")}
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSignup}>
              {/* First & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t("firstname")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("firstname")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    {t("lastname")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("lastname")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t("emailLabel")}
                </label>
                <input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground text-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t("passwordLabel")}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-card text-foreground text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (

                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  {t("confirmPassword")}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("confirmPassword")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-card text-foreground text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <Eye className="w-4 h-4" />
                    ) : (

                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex items-start space-x-2 text-xs">
                <input
                  type="checkbox"
                  id="terms-checkbox"
                  checked={agreed} //  connect the checkbox state
                  onChange={(e) => setAgreed(e.target.checked)} // whenc checkbox change update the state
                  className="mt-1 rounded border-gray-300 focus:ring-black"
                />
                <label htmlFor="terms-checkbox" className="text-muted-foreground leading-relaxed">
                  {t("agree")}{" "}
                  <span className="text-foreground font-medium ">
                    {t("terms")}
                  </span>{" "}
                  /{" "}
                  <span className="text-foreground font-medium ">
                    {t("privacy")}
                  </span>
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full  cursor-pointer bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:bg-primary/90 transition text-sm"
              >
                {loading ? t("signUpProcessing") : t("signUp")}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t("Already")}{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                {t("login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}