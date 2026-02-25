"use client";
 
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
 
// Import JS modules
import enNav from "@/app/i18n/locales/en/sidebar_en";
import jaNav from "@/app/i18n/locales/ja/sidebar_ja";
 
import enSetting from "@/app/i18n/locales/en/common_setting";
import jaSetting from "@/app/i18n/locales/ja/common_setting";
 
// Import JSON translations
// import enJson from "@/app/translations/en.json";
// import enJson from "@/app/i18n/locales/en/en.json";
// import jaJson from "@/app/i18n/locales/ja/ja.json";
import enJson from "@/app/i18n/locales/en/en";
import jaJson from "@/app/i18n/locales/ja/ja";
 
import enDashboard from "@/app/i18n/locales/en/dashboard_en";
import jaDashboard from "@/app/i18n/locales/ja/dashboard_ja";
 
 
const resources = {
  en: {
    translation: {
      ...enNav,
      ...enSetting.translation,
      ...enJson,
      ...enDashboard,
    }
  },
  ja: {
    translation: {
      ...jaNav,
      ...jaSetting.translation,
      ...jaJson,
      ...jaDashboard,
   
   
    }
  }
};
 
i18n.use(initReactI18next).init({
    resources,
    lng: "en",          
    fallbackLng: "en",  
    interpolation: {
      escapeValue: false
    }
  });
 
export default i18n;
 