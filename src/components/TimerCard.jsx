import { useMemo } from 'react';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import useTimerNow from '../hooks/useTimerNow.js';

function TimerCard({ timer, onEdit, onDelete }) {
  const now = useTimerNow();
  const targetDate = useMemo(
    () => new Date(timer.targetDate),
    [timer.targetDate]
  );
  const timeRemaining = useMemo(
    () => calculateTimeRemaining(targetDate, now),
    [targetDate, now]
  );

  if (Number.isNaN(targetDate.getTime())) {
    return (
      <article className='relative overflow-hidden rounded-3xl border border-danger/20 bg-danger/10 p-6 shadow-glass backdrop-blur-sm'>
        <header className='space-y-2'>
          <span className='text-xs font-semibold uppercase tracking-[0.3em] text-danger'>
            Event
          </span>
          <h2 className='text-xl font-semibold text-danger'>{timer.name}</h2>
        </header>
        <p className='mt-6 text-sm font-medium text-danger/80'>Invalid date</p>
      </article>
    );
  }

  const isElapsed = timeRemaining.totalMilliseconds <= 0;

  const cardClassName = [
    'group relative w-full overflow-hidden rounded-3xl border border-border/40 bg-surface p-6 text-primary shadow-glass transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_32px_70px_-42px_rgba(15,23,42,0.35)] backdrop-blur-sm',
    isElapsed ? 'opacity-80' : '',
  ].join(' ');

  return (
    <article className={cardClassName}>
      <header className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex flex-col gap-2'>
          <span className='text-xs font-semibold uppercase tracking-[0.3em] text-secondary'>
            Event
          </span>
          <h2 className='text-xl font-semibold text-primary'>{timer.name}</h2>
          {timer.category && (
            <span className='inline-flex w-max items-center gap-2 rounded-full bg-surface-muted/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-secondary'>
              {timer.category}
            </span>
          )}
        </div>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => onEdit?.(timer)}
            className='inline-flex items-center gap-2 rounded-full border border-border/40 bg-surface-muted/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-secondary shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
          >
            <PencilSquareIcon className='h-4 w-4' aria-hidden='true' />
            Edit
          </button>
          <button
            type='button'
            onClick={() => onDelete?.(timer)}
            className='inline-flex items-center gap-2 rounded-full border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-danger shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-danger/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger'
          >
            <TrashIcon className='h-4 w-4' aria-hidden='true' />
            Delete
          </button>
        </div>
      </header>

      <section className='mt-6'>
        <dl
          className='grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5 lg:gap-6'
          aria-live='polite'
        >
          {renderCountdownCell('Days', timeRemaining.days, isElapsed)}
          {renderCountdownCell('Hours', timeRemaining.hours, isElapsed)}
          {renderCountdownCell('Minutes', timeRemaining.minutes, isElapsed)}
          {renderCountdownCell('Seconds', timeRemaining.seconds, isElapsed)}
        </dl>
      </section>

      <footer className='mt-6 flex flex-wrap items-center justify-between gap-4'>
        <div className='space-y-1'>
          <span className='text-xs font-semibold uppercase tracking-[0.3em] text-secondary'>
            Target
          </span>
          <time
            className='block text-sm font-semibold text-primary'
            dateTime={targetDate.toISOString()}
            title={targetDate.toISOString()}
          >
            {formatDateTime(targetDate)}
          </time>
        </div>

        <p
          className={`flex items-center gap-2 text-sm font-semibold ${
            isElapsed ? 'text-danger' : 'text-success'
          }`}
        >
          <span
            className={`inline-flex h-2.5 w-2.5 rounded-full ${
              isElapsed ? 'bg-danger' : 'bg-success'
            }`}
          />
          {isElapsed ? 'Event has passed' : 'Event is upcoming'}
        </p>
      </footer>
    </article>
  );
}

function renderCountdownCell(label, value, isElapsed) {
  const formattedValue = Number.isFinite(value)
    ? String(value).padStart(2, '0')
    : '--';

  return (
    <div
      key={label}
      className={`flex flex-col items-center gap-2 rounded-2xl border border-border/30 bg-surface-muted/60 px-4 py-5 text-center shadow-sm transition duration-200 ${
        isElapsed
          ? 'opacity-60'
          : 'group-hover:border-accent/50 group-hover:shadow-lg'
      }`}
    >
      <dt className='text-[0.62rem] font-semibold uppercase tracking-[0.35em] text-secondary'>
        {label}
      </dt>
      <dd className='text-3xl font-bold text-primary sm:text-4xl'>
        {formattedValue}
      </dd>
    </div>
  );
}

function calculateTimeRemaining(targetDate, now = new Date()) {
  const diff = targetDate.getTime() - now.getTime();

  const safeDiff = Number.isFinite(diff) ? diff : Number.NaN;

  if (!Number.isFinite(safeDiff)) {
    return {
      totalMilliseconds: Number.NaN,
      days: Number.NaN,
      hours: Number.NaN,
      minutes: Number.NaN,
      seconds: Number.NaN,
    };
  }

  const clampedDiff = Math.max(safeDiff, 0);

  const MILLISECONDS_IN_SECOND = 1000;
  const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60;
  const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60;
  const MILLISECONDS_IN_DAY = MILLISECONDS_IN_HOUR * 24;

  const days = Math.floor(clampedDiff / MILLISECONDS_IN_DAY);
  const hours = Math.floor(
    (clampedDiff % MILLISECONDS_IN_DAY) / MILLISECONDS_IN_HOUR
  );
  const minutes = Math.floor(
    (clampedDiff % MILLISECONDS_IN_HOUR) / MILLISECONDS_IN_MINUTE
  );
  const seconds = Math.floor(
    (clampedDiff % MILLISECONDS_IN_MINUTE) / MILLISECONDS_IN_SECOND
  );

  return {
    totalMilliseconds: safeDiff,
    days,
    hours,
    minutes,
    seconds,
  };
}

function formatDateTime(date) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    console.warn('Unable to format date', error);
    return date.toLocaleString();
  }
}

export default TimerCard;
