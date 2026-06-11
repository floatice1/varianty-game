import { useT } from '../i18n';

export default function SettingsModal({ settings, onChange, onClose }) {
  const t = useT();
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-g-bg border-t-2 border-g-border px-5 pt-5 pb-8 rounded-t-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <p className="font-display text-xl text-g-text tracking-widest uppercase">{t('settings_title')}</p>
          <button className="text-g-muted hover:text-g-text text-xl transition-colors" onClick={onClose}>✕</button>
        </div>

        {/* Language */}
        <div className="flex flex-col gap-2 mb-5">
          <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('lang_label')}</p>
          <div className="flex gap-2">
            {[['uk','🇺🇦 Укр'],['en','🇬🇧 Eng'],['pl','🇵🇱 Pol']].map(([code, label]) => (
              <button key={code}
                className={`flex-1 h-11 rounded-lg border-2 text-sm font-bold transition-all active:scale-95
                  ${settings.lang === code
                    ? 'border-g-accent bg-g-accent/10 text-g-text shadow-hard-accent'
                    : 'border-g-border text-g-muted hover:border-g-accent/40'}`}
                onClick={() => onChange({ ...settings, lang: code })}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="flex flex-col gap-2">
          <p className="text-g-muted text-xs font-display tracking-widest uppercase">{t('theme_label')}</p>
          <div className="flex gap-2">
            {[['dark','🌙'],['light','☀️']].map(([mode, icon]) => (
              <button key={mode}
                className={`flex-1 h-11 rounded-lg border-2 text-sm font-bold transition-all active:scale-95
                  ${settings.theme === mode
                    ? 'border-g-accent bg-g-accent/10 text-g-text shadow-hard-accent'
                    : 'border-g-border text-g-muted hover:border-g-accent/40'}`}
                onClick={() => onChange({ ...settings, theme: mode })}
              >{icon} {t(mode)}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
