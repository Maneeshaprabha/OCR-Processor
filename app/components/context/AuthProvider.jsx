'use client'

import { createContext, useState, useEffect, useContext } from "react"
import supabase from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const router = useRouter()

  // 🟢 States
  const[user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const[loading, setLoading] = useState(true)

  // ==============================
  // 🟢 1. Fetch Profile (Fixed .maybeSingle() typo)
  // ==============================
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle() // Single() වෙනුවට මේක පාවිච්චි කළා

      if (error) {
        console.error("Profile fetch error:", error.message)
        return null;
      }

      if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err)
    }
  }

  // ==============================
  // 🟢 2. Init Auth & State Listener (Fixed Refresh & Loading bugs)
  // ==============================
  useEffect(() => {
    let mounted = true; // Component unmount issue එක වලක්වන්න

    const initAuth = async () => {
      try {
        // getSession වෙනුවට getUser පාවිච්චි කිරීම (Refresh වලදී හරියටම වැඩ කරයි)
        const { data: { user: currentUser }, error } = await supabase.auth.getUser()
        
        if (error) {
          console.log("No active user session.");
          if (mounted) {
            setUser(null);
            setProfile(null);
          }
          return;
        }

        if (mounted) {
          setUser(currentUser)
        }

        if (currentUser) {
          await fetchProfile(currentUser.id)
        }
      } catch (error) {
        console.error("Auth init error:", error.message)
      } finally {
        if (mounted) {
          setLoading(false) // මොනවා වුනත් Loading අනිවාර්යයෙන්ම නතර වෙනවා
        }
      }
    }

    initAuth()

    // Auth State එක වෙනස් වෙද්දී (Login / Logout වෙද්දී)
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null
      
      if (mounted) {
        setUser(currentUser)
        
        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setProfile(null) 
        }
        setLoading(false)
      }
    })

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe()
    }
  },[])

  // ==============================
  // 🟢 3. Auto Cache Clear (පැයකට සැරයක් Next.js Cache එක අලුත් කරන්න)
  // ==============================
  useEffect(() => {
    const ONE_HOUR = 3600000; // පැය 1යි
    const autoClearCache = setInterval(() => {
      router.refresh(); 
    }, ONE_HOUR);

    return () => clearInterval(autoClearCache);
  },[router]);

  // ==============================
  // 🟢 4. Sign Up Function
  // ==============================
  const signUp = async (first_name, last_name, email, password, theme_pref, language_pref) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            theme_pref,
            language_pref
          }
        }
      })
      if (error) throw error

      // Auto-login වීම නවත්වනවා
      await supabase.auth.signOut()

      return data.user
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // 🟢 5. Sign In Function
  // ==============================
  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error

      setUser(data.user)
      await fetchProfile(data.user.id)

      return data.user
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // 🟢 6. Sign Out Function (Hard Refresh එකත් එක්ක)
  // ==============================
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setProfile(null);
      
      // Local Storage වල තියෙන පරණ Auth දේවල් මකනවා
      for (let key in localStorage) {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
      
      // Force reload to Login page (Next.js Cache මකා දැමීම)
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // ==============================
  // 🟢 7. Reset Password (Forgot Password Page)
  // ==============================
  const resetPassword = async (email) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      return data
    } catch (err) {
      throw err
    } finally {
      setLoading(false)
    }
  }

  // ==============================
  // 🟢 8. Update Password (Settings Page)
  // ==============================
  const updateUserPassword = async (currentPassword, newPassword) => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    const currentUserEmail = currentUser?.email;

    if (!currentUserEmail) {
      throw new Error("User email not found. Please log in again.");
    }

    // පරණ Password එක හරිද කියලා check කිරීම
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUserEmail,
      password: currentPassword
    });

    if (signInError) {
      throw new Error("Current password is incorrect.");
    }

    // අලුත් එක Update කිරීම
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      if (updateError.message.includes("same as the old password")) {
        throw new Error("New password must be different from current password.");
      }
      throw updateError;
    }

    return true;
  };

  // ==============================
  // 🟢 9. Delete Account
  // ==============================
  const deleteAccount = async () => {
    if (!user) throw new Error("Not logged in");

    const res = await fetch("/api/delete-account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to delete account");

    await supabase.auth.signOut();
    return data;
  };

  // ==============================
  // 🟢 Return Context Provider
  // ==============================
  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, 
      signUp, signIn, signOut, 
      resetPassword, updateUserPassword, deleteAccount 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// 🟢 Hook for consuming AuthContext
export const useAuth = () => useContext(AuthContext);
