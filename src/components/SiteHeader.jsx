import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

function SiteHeader({ onCreateTimer, onToggleTheme, theme = 'light' }) {
  const isDark = theme === 'dark';

  return (
    <header className='sticky top-0 z-40 w-full border-b border-border/40 bg-surface/80 backdrop-blur-xl transition-colors duration-300'>
      <div className='flex w-full flex-col gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-8'>
        <div className='flex items-center justify-between gap-4 sm:justify-start sm:gap-5'>
          <div className='space-y-0.5 sm:space-y-1'>
            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-secondary sm:text-sm sm:tracking-[0.28em]'>
              Timo
            </p>
            <p className='text-sm font-medium text-primary/80 sm:text-base'>
              Countdown dashboard
            </p>
          </div>
        </div>

        <div className='flex w-full items-center justify-end gap-3 sm:w-auto sm:gap-4'>
          <button
            type='button'
            onClick={onToggleTheme}
            aria-label={
              isDark ? 'Switch to light theme' : 'Switch to dark theme'
            }
            className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-surface px-2 text-secondary shadow-inner transition duration-200 hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:h-10 sm:w-10'
          >
            {isDark ? (
              <SunIcon className='h-5 w-5' aria-hidden='true' />
            ) : (
              <MoonIcon className='h-5 w-5' aria-hidden='true' />
            )}
          </button>

          <button
            type='button'
            onClick={onCreateTimer}
            className='inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-accent-foreground shadow-glass transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-30px_rgba(15,23,42,0.85)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-6 sm:py-3 sm:text-xs sm:tracking-[0.28em]'
          >
            New timer
          </button>
        </div>
      </div>
    </header>
  );
}

export default SiteHeader;
