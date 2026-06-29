import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// English
import enCommon from "./locales/en/common.json";
import enLanding from "./locales/en/landing.json";
import enDashboard from "./locales/en/dashboard.json";
import enWarranties from "./locales/en/warranties.json";
import enAddProduct from "./locales/en/addProduct.json";
import enClaims from "./locales/en/claims.json";
import enServiceCenters from "./locales/en/serviceCenters.json";
import enLocker from "./locales/en/locker.json";
import enGmail from "./locales/en/gmail.json";
import enProfile from "./locales/en/profile.json";
import enAuth from "./locales/en/auth.json";
import enChatbot from "./locales/en/chatbot.json";

// Hindi
import hiCommon from "./locales/hi/common.json";
import hiLanding from "./locales/hi/landing.json";
import hiDashboard from "./locales/hi/dashboard.json";
import hiWarranties from "./locales/hi/warranties.json";
import hiAddProduct from "./locales/hi/addProduct.json";
import hiClaims from "./locales/hi/claims.json";
import hiServiceCenters from "./locales/hi/serviceCenters.json";
import hiLocker from "./locales/hi/locker.json";
import hiGmail from "./locales/hi/gmail.json";
import hiProfile from "./locales/hi/profile.json";
import hiAuth from "./locales/hi/auth.json";
import hiChatbot from "./locales/hi/chatbot.json";

// Marathi
import mrCommon from "./locales/mr/common.json";
import mrLanding from "./locales/mr/landing.json";
import mrDashboard from "./locales/mr/dashboard.json";
import mrWarranties from "./locales/mr/warranties.json";
import mrAddProduct from "./locales/mr/addProduct.json";
import mrClaims from "./locales/mr/claims.json";
import mrServiceCenters from "./locales/mr/serviceCenters.json";
import mrLocker from "./locales/mr/locker.json";
import mrGmail from "./locales/mr/gmail.json";
import mrProfile from "./locales/mr/profile.json";
import mrAuth from "./locales/mr/auth.json";
import mrChatbot from "./locales/mr/chatbot.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        landing: enLanding,
        dashboard: enDashboard,
        warranties: enWarranties,
        addProduct: enAddProduct,
        claims: enClaims,
        serviceCenters: enServiceCenters,
        locker: enLocker,
        gmail: enGmail,
        profile: enProfile,
        auth: enAuth,
        chatbot: enChatbot,
      },
      hi: {
        common: hiCommon,
        landing: hiLanding,
        dashboard: hiDashboard,
        warranties: hiWarranties,
        addProduct: hiAddProduct,
        claims: hiClaims,
        serviceCenters: hiServiceCenters,
        locker: hiLocker,
        gmail: hiGmail,
        profile: hiProfile,
        auth: hiAuth,
        chatbot: hiChatbot,
      },
      mr: {
        common: mrCommon,
        landing: mrLanding,
        dashboard: mrDashboard,
        warranties: mrWarranties,
        addProduct: mrAddProduct,
        claims: mrClaims,
        serviceCenters: mrServiceCenters,
        locker: mrLocker,
        gmail: mrGmail,
        profile: mrProfile,
        auth: mrAuth,
        chatbot: mrChatbot,
      },
    },
    defaultNS: "common",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
