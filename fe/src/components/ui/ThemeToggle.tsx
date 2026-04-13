import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl transition-all duration-300 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-slate-700 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md group"
      title={t("common.theme")}
      aria-label={t("common.theme")}
    >
      <div className="transition-transform duration-500 group-hover:rotate-12">
        {theme === "light" ? (
          <Moon className="w-5 h-5 text-indigo-600" />
        ) : (
          <Sun className="w-5 h-5 text-amber-400" />
        )}
      </div>
    </button>
  );
}
