import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SpainFlagIcon } from './icons/SpainFlagIcon.tsx';
import { UKFlagIcon } from './icons/UKFlagIcon.tsx';
import { FranceFlagIcon } from './icons/FranceFlagIcon.tsx';
import { ItalyFlagIcon } from './icons/ItalyFlagIcon.tsx';
import { GermanyFlagIcon } from './icons/GermanyFlagIcon.tsx';
import { ChevronDownIcon } from './icons/ChevronDownIcon.tsx';

const languageConfig = {
  es: { label: 'Español', Flag: SpainFlagIcon },
  en: { label: 'English', Flag: UKFlagIcon },
  fr: { label: 'Français', Flag: FranceFlagIcon },
  it: { label: 'Italiano', Flag: ItalyFlagIcon },
  de: { label: 'Deutsch', Flag: GermanyFlagIcon },
};

type LanguageKey = keyof typeof languageConfig;

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentLangKey = (i18n.language.split('-')[0] as LanguageKey) || 'es';
  const CurrentFlag = languageConfig[currentLangKey]?.Flag || SpainFlagIcon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const changeLanguage = (lang: LanguageKey) => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-sky-700 dark:focus:ring-offset-sky-800 focus:ring-sky-300 dark:focus:ring-sky-600"
        aria-label="Change language"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <CurrentFlag className="w-6 h-6 rounded-full object-cover" />
        <ChevronDownIcon className={`w-4 h-4 text-white/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black dark:ring-slate-700 ring-opacity-5 focus:outline-none z-40 py-1"
          role="menu"
          aria-orientation="vertical"
        >
          {(Object.keys(languageConfig) as LanguageKey[]).map((langKey) => {
            const { label, Flag } = languageConfig[langKey];
            return (
              <button
                key={langKey}
                onClick={() => changeLanguage(langKey)}
                className="w-full flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                role="menuitem"
              >
                <Flag className="w-5 h-5 mr-3 rounded-full" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};