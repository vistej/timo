import { useEffect } from 'react';
import { createPortal } from 'react-dom';

function Modal({ isOpen, onClose, title, children, theme = 'light' }) {
  const isBrowser = typeof document !== 'undefined';
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!isBrowser || !isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isBrowser, isOpen, onClose]);

  if (!isBrowser || !isOpen) {
    return null;
  }

  const shellClasses = isDark
    ? 'relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-surface shadow-glass'
    : 'relative overflow-hidden rounded-[2.5rem] border border-border/30 bg-surface shadow-glass';

  const gradientClasses = isDark
    ? 'absolute -inset-10 -z-10 bg-gradient-to-br from-accent/10 via-accent/5 to-transparent blur-3xl'
    : 'absolute -inset-10 -z-10 bg-gradient-to-br from-accent/15 via-accent/10 to-transparent blur-3xl';

  const closeButtonClasses = isDark
    ? 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-surface-muted/80 text-secondary shadow-inner transition duration-150 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:h-10 sm:w-10'
    : 'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/40 bg-surface-muted/80 text-secondary shadow-inner transition duration-150 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:h-10 sm:w-10';

  return createPortal(
    <div className='fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:px-6'>
      <div
        className='absolute inset-0 bg-black/60 backdrop-blur-sm'
        aria-hidden='true'
        onClick={onClose}
      />
      <div className='relative z-10 w-full max-w-3xl'>
        <div className={gradientClasses} />

        <div className={shellClasses}>
          <div className='absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(253,224,71,0.08),transparent_60%)]' />

          <div className='relative flex flex-col gap-8 p-6 sm:p-10 text-primary'>
            <header className='flex items-start justify-between gap-6'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.32em] text-secondary'>
                  {title}
                </p>
              </div>
              <button
                type='button'
                aria-label='Close dialog'
                onClick={onClose}
                className={closeButtonClasses}
              >
                <span aria-hidden='true'>×</span>
              </button>
            </header>

            <div>{children}</div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
