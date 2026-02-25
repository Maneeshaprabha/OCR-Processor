"use client"

import React, { useEffect, useState } from "react"
import { Globe, Palette, User, Check, Moon, Sun, Monitor, Save, Lock, Edit, Trash2, X, CircleCheckBig, EyeOff, Eye, } from "lucide-react"

import Card from "@/app/components/ui/card"
import Image from "next/image"
import { Input } from "@/app/components/ui/Input"
import { useTranslation } from "react-i18next"
import { useTheme } from "next-themes"
import { useAuth } from "@/app/components/context/AuthProvider"
import client from "@/lib/supabaseClient";
import { useRouter } from "next/navigation"

export default function Settings() {
  const { user, profile: authProfile, loading: authLoading, signOut, updateUserPassword, deleteAccount } = useAuth()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { t, i18n } = useTranslation()
  const language = i18n.language
  const router = useRouter()

  // Modal states
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showUpdateProfile, setShowUpdateProfile] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Loading states
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  // User data states - Updated with first_name and last_name
  const [profile, setProfile] = useState({
    id: null,
    email: "",
    first_name: "",
    last_name: "",
    avatar_url: "",
    language_pref: "en",
    theme_pref: "light"
  })

  // Profile form state - Updated with first_name and last_name
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load user data from Supabase
  const loadUserData = async () => {
    try {
      const { data: { user } } = await client.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error)
      }

      const userProfile = {
        id: user.id,
        email: user.email || "",
        first_name: profileData?.first_name || "",
        last_name: profileData?.last_name || "",
        avatar_url: profileData?.avatar_url || "",
        language_pref: profileData?.language_pref || "en",
        theme_pref: profileData?.theme_pref || "light"
      }

      setProfile(userProfile)
      setProfileForm({
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        email: userProfile.email
      })

      if (profileData?.theme_pref && profileData.theme_pref !== theme) {
        setTheme(profileData.theme_pref)
      }

      if (profileData?.language_pref && profileData.language_pref !== language) {
        i18n.changeLanguage(profileData.language_pref)
      }

    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  // Save user preferences to database
  const saveUserPreferences = async () => {
    try {
      const { data: { user } } = await client.auth.getUser()
      if (!user) return
 
      const { error } = await client
        .from('profiles')
        .update({
          theme_pref: theme,
          language_pref: language,
          updated_at: new Date()
        })
        .eq('id', user.id)
 
      if (error) throw error
     
      setMessage({ type: 'success', text: 'Preferences saved!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
     
    } catch (error) {
      console.error('Error saving preferences:', error)
      setMessage({ type: 'error', text: 'Failed to save preferences' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }
 
  // Auto-save preferences when they change
  useEffect(() => {
    if (mounted && profile.id) {
      saveUserPreferences()
    }
  }, [theme, language])

  // Auto-save preferences when they change
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/login')
      return
    }

    const userProfile = {
      id: user.id,
      email: user.email || "",
      first_name: authProfile?.first_name || "",
      last_name: authProfile?.last_name || "",
      avatar_url: authProfile?.avatar_url || "",
      language_pref: authProfile?.language_pref || "en",
      theme_pref: authProfile?.theme_pref || "light"
    }

    setProfile(userProfile)
    setProfileForm({
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      email: userProfile.email
    })
  }, [user, authProfile, authLoading])



  // UPDATE PROFILE - Updated with first_name and last_name
  const handleUpdateProfile = async (e) => {
    console.log('Updating profile...')
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { data: { user } } = await client.auth.getUser()

      const { error } = await client
        .from('profiles')
        .update({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          updated_at: new Date()
        })
        .eq('id', user.id)
        setLoading(false )

        console.log(error)
        console.log('Profile updated successfully!')

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })

      setProfile(prev => ({
        ...prev,
        first_name: profileForm.first_name,
        last_name: profileForm.last_name
      }))

      setTimeout(() => {
        setShowUpdateProfile(false)
        setMessage({ type: '', text: '' })
      }, 1500)
      setLoading(false)
      window.location.href = "/settings"

    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

//..............change password
  const handleChangePassword = async (e) => { 
 e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

 
    if (!passwordForm.current) {
      setMessage({ type: 'error', text: 'Current password is required.' });
      setLoading(false);
      return;
    }

    if (!passwordForm.new) {
      setMessage({ type: 'error', text: 'New password is required.' });
      setLoading(false);
      return;
    }
    
    if (passwordForm.current === passwordForm.new) {
      setMessage({ type: 'error', text: 'New password must be different from the current password.' });
      setLoading(false);
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setLoading(false);
      return;
    }
  if (
    passwordForm.new.length < 6 ||
    !/[A-Z]/.test(passwordForm.new) ||
    !/[a-z]/.test(passwordForm.new) ||
    !/[0-9]/.test(passwordForm.new) ||
    !/[^A-Za-z0-9]/.test(passwordForm.new)
  ) {
    setMessage({
      type: 'error',
      text: 'Password must be at least 6 characters and contain uppercase, lowercase, numbers, and special characters.'
    });
    setLoading(false);
    return;
  }
  if (!passwordForm.current) {
    setMessage({ type: 'error', text: 'Current password is required' });
    setLoading(false);
    return;
  }

  try {
    const { data: { user } } = await client.auth.getUser();

    if (!user?.email) {
      setMessage({ type: 'error', text: 'User not found. Please log in again.' });
      setLoading(false);
      return;
    }

    const { error: signInError } = await client.auth.signInWithPassword({
      email: user.email,
      password: passwordForm.current
    });

    if (signInError) {
      setMessage({ type: 'error', text: 'Current password is incorrect' });
      setLoading(false);
      return;
    }

    //error have 
    setLoading(false);
    window.location.href = "/settings";
    setShowChangePassword(false);
    const test123 = await client.auth.updateUser({
      password: passwordForm.new
    });
       console.log(test123);
  

    if (updateError) {
  
      setMessage({ type: 'error', text: updateError.message });
      setLoading(false);

      return;
    }
    isSuccess = true;

  } catch (error) {
    setMessage({ type: 'error', text: 'An unexpected error occurred' });
    if (errorText.includes("Invalid login credentials") || errorText.includes("incorrect")) {
        errorText = "The current password you entered is incorrect.";
      } else if (errorText.includes("same as the old password")) {
        errorText = "New password must be different from the current password.";
      }
  } finally {
    setLoading(false);

    if (isSuccess) {

      setShowChangePassword(false);
      setPasswordForm({ current: '', new: '', confirm: '' });

      setMessage({ type: 'success', text: 'Password changed successfully!' });

      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
    }

  }
};
  

  // ==========================================
  //  handleDeleteAccount
  // ==========================================
  const handleDeleteAccount = async () => {
    try {
      if (!user) throw new Error("Not logged in");
      
      const { error } = await client
        .from('profiles')
        .delete()
        .eq('id', user.id)

      await deleteAccount(); // this deletes the account and logs out automatically
      //router.push("/"); // redirect to home if needed
      window.location.href = "/login"

      await signOut()
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
      setShowDeleteAccount(false)
    }
    console.log("Delete account process completed.");
  };

  const changeLanguage = async (langId) => {
    i18n.changeLanguage(langId)
    localStorage.setItem("appLanguage", langId)
    try {
      if (user) {
        await client.from('profiles').update({ language_pref: langId, updated_at: new Date() }).eq('id', user.id)
        setMessage({ type: 'success', text: 'Preferences saved!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const handleThemeChange = async (themeId) => {
    setTheme(themeId)
    try {
      if (user) {
        await client.from('profiles').update({ theme_pref: themeId, updated_at: new Date() }).eq('id', user.id)
        setMessage({ type: 'success', text: 'Preferences saved!' })
        setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const languages = [
    { id: "en", label: "English", code: "EN", flag: "/flags/us.svg" },
    { id: "ja", label: "日本語", code: "JA", flag: "/flags/jp.svg" },
  ]

  // Updated to use first_name and last_name
  const getUserInitials = () => {

  if (profile.first_name) {

    return profile.first_name[0].toUpperCase()

  } else if (profile.last_name) {

    return profile.last_name[0].toUpperCase()

  }

  return profile.email?.[0]?.toUpperCase() || 'U'

}
 
  // Get full name for display
  const getFullName = () => {
  if (!profile) return "Loading..."

  if (profile.first_name && profile.last_name) {
    return `${profile.first_name} ${profile.last_name}`
  } else if (profile.first_name) {
    return profile.first_name
  } else if (profile.last_name) {
    return profile.last_name
  }
  return "Update your name"
}

  if (!mounted) return null

  return (
    <div className="min-h-full flex flex-col p-6 mx-auto px-4 sm:px-6 py-4 sm:py-6 bg-background text-foreground space-y-6 sm:space-y-8 pb-24">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          {t("settings.title")}
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 sm:mt-2">
          {t("settings.description")}
        </p>
      </div>

      {/* Message display */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success"
            ? 'bg-green-100 text-green-700 border border-green-400'
            : 'bg-red-100 text-red-700 border border-red-400'
            }`}>
          {message.text}
        </div>
      )}

      {/* Language Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent rounded-lg">
            <Globe className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t("language.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("language.description")}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => changeLanguage(lang.id)}
              className={`w-full flex items-center justify-between p-4 rounded-lg border transition ${language === lang.id
                ? "border-primary bg-accent ring-1 ring-primary"
                : "border-border hover:border-sidebar-accent"
                }`}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={lang.flag}
                  alt={lang.label}
                  width={28}
                  height={28}
                  className="rounded-sm border border-border"
                />
                <div>
                  <p className="font-medium text-foreground">{lang.label}</p>
                  <p className="text-xs text-muted-foreground">{lang.code}</p>
                </div>
              </div>

              {language === lang.id && (
                <CircleCheckBig className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Theme Settings */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent rounded-lg">
            <Palette className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t("theme.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("theme.description")}</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { id: "light", label: t("theme.light"), icon: "☀️" },
            { id: "dark", label: t("theme.dark"), icon: "🌙" },
            { id: "system", label: t("theme.system"), icon: "💻" },
          ].map((item) => (
            <button
              key={item.id} 
              value={item.id}
              onClick={() => {
                setTheme(item.id);
          
              }}
              className={`w-full flex items-center justify-between p-4 rounded-lg border text-left transition-all ${theme === item.id
                ? "border-primary bg-accent ring-1 ring-primary"
                : "border-border hover:border-sidebar-accent"
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium text-foreground">{item.label}</span>
              </div>

              {theme === item.id && (
                <CircleCheckBig className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Account Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-accent rounded-lg">
            <User className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t("account.title")}</h3>
            <p className="text-sm text-muted-foreground">{t("account.description")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-accent p-4 rounded-lg flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
              {getUserInitials()}
            </div>
            <div>
              <p className="font-medium text-foreground">
                {getFullName()}
              </p>
              <p className="text-sm text-muted-foreground">
                {profile.email}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowChangePassword(true)}
            className="cursor-pointer w-full flex items-center justify-center gap-3 px-4 h-13 rounded-lg border border-border hover:bg-accent text-sm font-medium text-foreground transition-colors"
          >
            <Lock className="h-5 w-4 text-muted-foreground" />
            {t("change_password.title")}
          </button>

          <button
            onClick={() => {
              setShowUpdateProfile(true)
              setMessage({ type: '', text: '' })
            }}
            className="cursor-pointer w-full flex items-center justify-center gap-3 px-4 h-13 rounded-lg border border-border hover:bg-accent text-sm font-medium text-foreground transition-colors"
          >
            <Edit className="h-4 w-4 text-muted-foreground" />
            {t("update_profile.title")}
          </button>

          <button
            onClick={() => setShowDeleteAccount(true)}
            className="group cursor-pointer w-full flex items-center justify-center gap-3 px-4 h-13 rounded-lg border border-red-200 hover:bg-red-600 hover:text-white text-sm font-medium text-red-600 transition-colors"
          >
            <Trash2 className="h-4 w-4 text-red-500 group-hover:text-white transition-colors" />
            {t("delete_account.title")}
          </button>
        </div>
      </Card>


      {/* CHANGE PASSWORD MODAL */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowChangePassword(false)}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">
                {t("change_password.title")}
              </h3>
              <button
                onClick={() => setShowChangePassword(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {message.text && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${message.type === "success"
                    ? "bg-green-100 text-green-700 border border-green-400"
                    : "bg-red-100 text-red-700 border border-red-400"
                  }`}
              >
                {message.text}
              </div>
            )}
            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">

                {/* Current Password */}
                <div className="relative">
                  <Input
                    label={t("change_password.current")}
                    type={showPassword.current ? "text" : "password"}
                    value={passwordForm.current}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, current: e.target.value })
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword.current ? (
                   <Eye className="w-4 h-4" />
                    ) : (
                       <EyeOff className="w-4 h-4" />
                    )}  
                  </button>
                </div>

                {/* New Password */}
                <div className="relative">
                  <Input
                    label={t("change_password.new")}
                    type={showPassword.new ? "text" : "password"}
                    value={passwordForm.new}
                    onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        new: !prev.new,
                      }))
                    }
                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword.new ? (
                  <Eye className="w-4 h-4" />
                    ) : (
                       <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Confirm Password */}
                <div className="relative">
                  <Input
                    label={t("change_password.confirm")}
                    type={showPassword.confirm ? "text" : "password"}
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                    required
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword.confirm ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false)
                    setPasswordForm({ current: '', new: '', confirm: '' })
                    setMessage({ type: '', text: '' })
                  }}
                  className="flex-1 h-11 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t("change_password.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? t("change_password.loading") : t("change_password.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE PROFILE MODAL - UPDATED with First Name and Last Name */}
      {showUpdateProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowUpdateProfile(false)}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in-95 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">
                {t("update_profile.title")}
              </h3>
              <button
                onClick={() => setShowUpdateProfile(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {message.text && (
              <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="space-y-4">
                <Input
                  label={t("update_profile.first")}
                  value={profileForm.first_name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  label={t("update_profile.last")}
                  value={profileForm.last_name}
                  onChange={(e) =>
                    setProfileForm((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  label={t("update_profile.email")}
                  type="email"
                  value={profileForm.email}
                  disabled
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUpdateProfile(false)
                    setMessage({ type: '', text: '' })
                    loadUserData()
                  }}
                  className="flex-1 h-11 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
                >
                  {t("update_profile.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-lg bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? t("update_profile.processing"): t("update_profile.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowDeleteAccount(false)}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-4 sm:p-6 animate-in fade-in zoom-in-95 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-red-600 mb-4"> 
              {t("delete_account.title")}
              </h3>
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {message.text && (
              <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
                {message.text}
              </div>
            )}

            <p className="text-foreground mb-2">
              {t("delete_account.confirmation")} {""}
              <span className="font-medium">{t("delete_account.warning")}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {t("delete_account.description")}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccount(false)}
                className="flex-1 h-11 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                {t("delete_account.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 h-11 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? t("delete_account.processing"): t("delete_account.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}