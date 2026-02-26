'use client'

import { createContext, useState, useEffect, useContext } from "react"
import supabase from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"

const AuthContext = createContext()

// wrapping entire app with AuthProvider in layout.jsx, so all components can access auth state and functions via useAuth hook
export const AuthProvider = ({ children }) => {
  const router = useRouter()

  //  User state (Supabase Auth user)
  const [user, setUser] = useState(null)

  //  Profile state (theme_pref, language_pref, full_name, etc.)
  const [profile, setProfile] = useState(null)

  const [loading, setLoading] = useState(true)

  // ==============================
  //  the function to db fetch the profile  
  // ==============================
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle() // if profile doesn't exist, it won't throw an error, just return null

    if (!error && data) {
      setProfile(data)
    }
  }

  // ==============================
  //  Initial session check + Auth state listener
  // ==============================
  useEffect(() => {
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession()
      const currentUser = data.session?.user || null
      setUser(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.id)
      }
      setLoading(false)
    }

    initAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)

      if (currentUser) {
        await fetchProfile(currentUser.id)
      } else {
        setProfile(null) //if logged out, clear profile data
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  // ==============================
  // 🟢 Signup
  // - Supabase Auth create + metadata send
  // - profiles table insert handled by Trigger
  // - Auto-login stopped, user login page redirect
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

      // Supabase auto-login  stoping, so we won't setUser here. User will be null until they verify their email and log in.
      await supabase.auth.signOut()

      setLoading(false)
      return data.user
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  // ==============================
  // 🟢 SignIn
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

      setLoading(false)
      return data.user
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  // ==============================
  // 🟢 SignOut
  // ==============================
 const signOut = async () => {
    console.log("Signing out...");
      // setTimeout(() => router.push("/login"), 1000)
    
    try {
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      
      setUser(null);
      setProfile(null);
      
      
      // router.push("/login") 
    
      window.location.href = "/login";

    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  const resetPassword = async (email) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setLoading(false)
      return data
    } catch (err) {
      setLoading(false)
      throw err
    }
  }

  // ==============================
  //  2. Update Password
  // ==============================
  // const updatePassword = async (newPassword) => {
  //   setLoading(true)
  //   try {
  //     const { data, error } = await supabase.auth.updateUser({
  //       password: newPassword
  //     })
  //     if (error) throw error
  //     setLoading(false)
  //     return data
  //   } catch (err) {
  //     setLoading(false)
  //     throw err
  //   }
  // }
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


  const updateUserPassword = async (currentPassword, newPassword) => {

    // 1. current user
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserEmail = session?.user?.email;

    if (!currentUserEmail) {
      throw new Error("User email not found. Please log in again.");
    }

    // 2. 
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: currentUserEmail,
      password: currentPassword
    });

    if (signInError) {
      throw new Error("Current password is incorrect.");
    }
    console.log("newPassword", newPassword);
    // 3. 
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      if (updateError.message.includes("same as the old password")) {
        throw new Error("New password must be different from current password.");
      }
      throw new Error(updateError.message);
    }

    return true;
  };
  // ==============================
  //  Global context return
  // ==============================
  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, resetPassword, updateUserPassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

//  Hook for consuming AuthContext
export const useAuth = () => useContext(AuthContext);
