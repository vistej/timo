import { useCallback, useEffect, useMemo, useState } from 'react';
import TimerCard from '../components/TimerCard.jsx';
import {
  readTimersFromStorage,
  TIMERS_UPDATED_EVENT,
} from '../utils/timerStorage.js';

function TimersListPage({
  refreshSignal = 0,
  onEditTimer,
  onDeleteTimer,
  theme = 'light',
}) {
  const [timers, setTimers] = useState([]);
  const isDark = theme === 'dark';

  const fetchTimers = useCallback(async () => {
    try {
      const data = await readTimersFromStorage();
      setTimers(data);
    } catch (error) {
      console.warn('Unable to load timers', error);
    }
  }, []);

  useEffect(() => {
    fetchTimers();
  }, [fetchTimers, refreshSignal]);

  useEffect(() => {
    const handleTimersUpdated = () => {
      fetchTimers();
    };

    window.addEventListener(TIMERS_UPDATED_EVENT, handleTimersUpdated);

    return () => {
      window.removeEventListener(TIMERS_UPDATED_EVENT, handleTimersUpdated);
    };
  }, [fetchTimers]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTimers();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchTimers]);

  const sortedTimers = useMemo(() => {
    return [...timers].sort((a, b) => {
      const timeA = safeGetTime(a.targetDate);
      const timeB = safeGetTime(b.targetDate);

      return timeA - timeB;
    });
  }, [timers]);

  const hasTimers = sortedTimers.length > 0;

  const containerClasses = isDark
    ? 'relative overflow-hidden rounded-3xl border border-border/20 bg-surface/90 p-8 text-primary shadow-glass backdrop-blur-sm sm:p-10'
    : 'relative overflow-hidden rounded-3xl border border-border/30 bg-surface p-8 text-primary shadow-glass backdrop-blur-sm sm:p-10';

  const badgeClasses = isDark
    ? 'inline-flex items-center gap-2 self-start rounded-full bg-surface-muted/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-accent shadow-inner shadow-border/25'
    : 'inline-flex items-center gap-2 self-start rounded-full bg-surface-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-secondary shadow-lg shadow-border/30';

  const emptyStateClasses = isDark
    ? 'mt-12 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/20 bg-surface-muted/60 px-8 py-14 text-center text-secondary sm:px-12'
    : 'mt-12 flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/30 bg-surface-muted/60 px-8 py-14 text-center text-secondary sm:px-12';

  const emptyIconClasses = isDark
    ? 'flex h-14 w-14 items-center justify-center rounded-full bg-surface text-accent text-2xl shadow-inner shadow-border/30'
    : 'flex h-14 w-14 items-center justify-center rounded-full bg-surface text-accent text-2xl shadow-inner shadow-border/30';

  return (
    <section className={containerClasses}>
      <div
        aria-hidden='true'
        className='pointer-events-none absolute inset-0 -z-10 opacity-60'
      >
        <div className='absolute left-0 top-8 h-48 w-48 -translate-x-1/4 rounded-full bg-accent/10 blur-3xl' />
        <div className='absolute bottom-0 right-0 h-60 w-60 translate-x-1/4 translate-y-1/3 rounded-full bg-accent/10 blur-3xl' />
      </div>

      <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div className='space-y-2'>
          <h2 className='text-2xl font-semibold text-primary sm:text-3xl'>
            Your timers
          </h2>
          <p className='max-w-xl text-base text-secondary'>
            Review every countdown you have saved and keep an eye on what is
            coming next.
          </p>
        </div>
        <span className={badgeClasses}>{sortedTimers.length} total</span>
      </header>

      {hasTimers ? (
        <div className='mt-10 grid gap-6 md:grid-cols-2'>
          {sortedTimers.map((timer) => (
            <TimerCard
              key={timer.id}
              timer={timer}
              onEdit={onEditTimer}
              onDelete={onDeleteTimer}
            />
          ))}
        </div>
      ) : (
        <div className={emptyStateClasses}>
          <div className={emptyIconClasses}>⏳</div>
          <div className='space-y-2'>
            <h3 className='text-lg font-semibold text-primary'>
              No timers yet
            </h3>
            <p className='max-w-md text-sm text-secondary sm:text-base'>
              Create your first countdown above to see it appear here with live
              updates.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function safeGetTime(value) {
  const date = new Date(value);
  const time = date.getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

export default TimersListPage;
