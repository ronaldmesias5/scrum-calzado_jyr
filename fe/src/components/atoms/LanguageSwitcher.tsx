import { useTranslation } from "react-i18next";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("es") ? "en" : "es";
    i18n.changeLanguage(newLang);
    document.documentElement.lang = newLang;
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 flex items-center gap-2.5 shadow-sm hover:shadow-md border border-transparent hover:border-gray-300 dark:hover:border-slate-600"
      title={t("common.language")}
    >
      <span className="uppercase tracking-wider">{i18n.language.split("-")[0]}</span>
      <span className="text-gray-300 dark:text-slate-600 font-normal">/</span>
      <span className="text-blue-600 dark:text-blue-400">{i18n.language.startsWith("es") ? "EN" : "ES"}</span>
    </button>
  );
}
