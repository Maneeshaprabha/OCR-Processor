"use client"
 
import { createContext, useContext, useEffect, useState } from "react"
//import { LanguageProvider} from "react-i18next";
import i18n from  "@/app/i18n/i18n"  
 
const LanguageContext = createContext();
 
export function useLanguage() {
  return useContext(LanguageContext);
}
 
export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");
 
    //const value = { language, setLanguage };
 
 
  useEffect(() => {
    const saved = localStorage.getItem("appLanguage") || i18n.language || "en";
    setLanguage(saved);
    i18n.changeLanguage(saved)
  }, []);
 
  useEffect(() => {
    if (!language) return;
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);
 
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
 