import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import {
  readTimersFromStorage,
  writeTimersToStorage,
  readCategoriesFromStorage,
  writeCategoriesToStorage,
  CATEGORIES_UPDATED_EVENT,
} from '../utils/timerStorage.js';

const HOURS_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index + 1)
);
const MINUTES_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0')
);
const MERIDIEM_OPTIONS = ['AM', 'PM'];
const ADD_NEW_CATEGORY_OPTION = { value: '__add_new__', label: 'Add New' };

function mergeCategoryLabels(...sources) {
  const seen = new Set();
  const merged = [];

  sources.forEach((source) => {
    if (!Array.isArray(source)) {
      return;
    }

    source.forEach((label) => {
      if (typeof label !== 'string') {
        return;
      }

      const trimmed = label.trim();
      if (!trimmed) {
        return;
      }

      const key = trimmed.toLowerCase();
      if (seen.has(key)) {
        return;
      }

      seen.add(key);
      merged.push(trimmed);
    });
  });

  return merged;
}

function createCategoryOption(label) {
  const normalized = label.trim();
  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const fallback =
    normalized.toLowerCase().replace(/\s+/g, '-') || 'custom-category';

  return {
    value: slug || fallback,
    label: normalized,
  };
}

function CreateTimerForm({ onSuccess, resetSignal = 0, timer = null }) {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [meridiem, setMeridiem] = useState('AM');
  const [categoryOptions, setCategoryOptions] = useState([
    ADD_NEW_CATEGORY_OPTION,
  ]);
  const [categoryOption, setCategoryOption] = useState(null);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryError, setNewCategoryError] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetStatus = () => {
    if (status.type) {
      setStatus({ type: '', message: '' });
    }
  };

  const refreshCategoryOptions = async (extraLabels = []) => {
    try {
      const storedLabels = await readCategoriesFromStorage();
      const labels = mergeCategoryLabels(storedLabels, extraLabels);
      const options = labels.map(createCategoryOption);
      const fullOptions = [ADD_NEW_CATEGORY_OPTION, ...options];

      setCategoryOptions(fullOptions);

      return { labels, options };
    } catch (error) {
      console.warn('Unable to load categories from IndexedDB', error);
      const labels = mergeCategoryLabels(extraLabels);
      const options = labels.map(createCategoryOption);
      const fullOptions = [ADD_NEW_CATEGORY_OPTION, ...options];

      setCategoryOptions(fullOptions);

      return { labels, options };
    }
  };

  const handleCategorySelect = (option) => {
    resetStatus();
    setNewCategoryError('');

    if (option?.value === ADD_NEW_CATEGORY_OPTION.value) {
      setIsAddingNewCategory(true);
      setNewCategoryName('');
      setCategoryOption(null);
      return;
    }

    setIsAddingNewCategory(false);
    setNewCategoryName('');
    setCategoryOption(option ?? null);
  };

  const handleCancelAddCategory = () => {
    setIsAddingNewCategory(false);
    setNewCategoryName('');
    setNewCategoryError('');
    resetStatus();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    resetStatus();
    setNewCategoryError('');

    const trimmedName = eventName.trim();

    if (!trimmedName) {
      setStatus({ type: 'error', message: 'Event name is required.' });
      return;
    }

    let trimmedCategory = '';
    let shouldPersistNewCategory = false;
    let newCategoryLabel = '';

    if (isAddingNewCategory) {
      const candidate = newCategoryName.trim();
      if (!candidate) {
        setNewCategoryError('Category name is required.');
        return;
      }

      const normalizedLower = candidate.toLowerCase();
      const existingOption = categoryOptions.find(
        (option) => option.label.toLowerCase() === normalizedLower
      );

      if (existingOption) {
        trimmedCategory = existingOption.label;
        setCategoryOption(existingOption);
      } else {
        trimmedCategory = candidate;
        shouldPersistNewCategory = true;
        newCategoryLabel = candidate;
      }
    } else {
      trimmedCategory = categoryOption?.label?.trim() ?? '';
    }

    if (!eventDate) {
      setStatus({ type: 'error', message: 'Choose a future date.' });
      return;
    }

    const targetDate = new Date(
      `${eventDate}T${formatted24HourTime(hour, minute, meridiem)}`
    );

    if (Number.isNaN(targetDate.getTime())) {
      setStatus({
        type: 'error',
        message: 'Selected date and time is invalid.',
      });
      return;
    }

    if (targetDate.getTime() <= Date.now()) {
      setStatus({
        type: 'error',
        message: 'Choose a date and time in the future.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const timers = await readTimersFromStorage();
      const isEditing = Boolean(timer);

      const newTimer = {
        id:
          timer?.id ??
          (typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`),
        name: trimmedName,
        category: trimmedCategory,
        targetDate: targetDate.toISOString(),
        createdAt: timer?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedTimers = isEditing
        ? timers.map((item) => (item.id === newTimer.id ? newTimer : item))
        : [...timers, newTimer];

      await writeTimersToStorage(updatedTimers);

      if (shouldPersistNewCategory && newCategoryLabel) {
        const { labels } = await refreshCategoryOptions([newCategoryLabel]);
        await writeCategoriesToStorage(labels);
      }

      setEventName('');
      setCategoryOption(null);
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      setNewCategoryError('');
      setEventDate('');
      setHour('12');
      setMinute('00');
      setMeridiem('AM');
      setStatus({
        type: 'success',
        message: isEditing
          ? 'Timer updated successfully.'
          : 'Timer saved successfully.',
      });

      onSuccess?.(newTimer, { isEditing });
    } catch (error) {
      console.error('Unable to save timer', error);
      setStatus({
        type: 'error',
        message: 'Unable to save timer. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setEventName('');
    setCategoryOption(null);
    setEventDate('');
    setHour('12');
    setMinute('00');
    setMeridiem('AM');
    setStatus({ type: '', message: '' });
    setIsAddingNewCategory(false);
    setNewCategoryName('');
    setNewCategoryError('');

    refreshCategoryOptions();
  }, [resetSignal]);

  useEffect(() => {
    if (!timer) {
      return;
    }

    let cancelled = false;

    const hydrateFromTimer = async () => {
      setEventName(timer.name ?? '');

      const timerCategory =
        typeof timer.category === 'string' ? timer.category.trim() : '';

      const { options } = await refreshCategoryOptions(
        timerCategory ? [timerCategory] : []
      );

      if (cancelled) {
        return;
      }

      const selectedOption = timerCategory
        ? options.find(
            (option) =>
              option.label.toLowerCase() === timerCategory.toLowerCase()
          ) ?? null
        : null;

      setCategoryOption(selectedOption);
      setIsAddingNewCategory(false);
      setNewCategoryName('');
      setNewCategoryError('');

      try {
        const sourceDate = new Date(timer.targetDate ?? '');
        if (!Number.isNaN(sourceDate.getTime())) {
          const isoDate = sourceDate.toISOString();
          setEventDate(isoDate.slice(0, 10));

          const currentHour = sourceDate.getHours();
          const currentMinute = sourceDate.getMinutes();
          const { hour: displayHour, meridiem: displayMeridiem } =
            convert24HourTo12Hour(currentHour);

          setHour(displayHour);
          setMinute(String(currentMinute).padStart(2, '0'));
          setMeridiem(displayMeridiem);
        }
      } catch (error) {
        console.warn('Unable to parse timer target date', error);
      }
    };

    hydrateFromTimer();

    return () => {
      cancelled = true;
    };
  }, [timer]);

  const livePreview = useMemo(() => {
    if (!eventDate) {
      return 'Select date and time';
    }

    const displayDate = new Date(
      `${eventDate}T${formatted24HourTime(hour, minute, meridiem)}`
    );
    if (Number.isNaN(displayDate.getTime())) {
      return 'Select date and time';
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(displayDate);
  }, [eventDate, hour, minute, meridiem]);

  const minDate = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString().slice(0, 10);
  }, []);

  const categorySelectValue = isAddingNewCategory
    ? ADD_NEW_CATEGORY_OPTION
    : categoryOption;

  const selectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        borderRadius: '1.5rem',
        backgroundColor: 'rgb(var(--color-surface) / 1)',
        borderColor: state.isFocused
          ? 'rgb(var(--color-accent) / 0.65)'
          : 'rgb(var(--color-border) / 0.45)',
        boxShadow: state.isFocused
          ? '0 0 0 4px rgb(var(--color-accent) / 0.2)'
          : 'none',
        padding: '0.25rem 0.75rem',
        minHeight: '3.25rem',
        fontSize: '1rem',
        fontWeight: 500,
        color: 'rgb(var(--color-text-primary) / 1)',
        transition: 'all 0.2s ease',
      }),
      valueContainer: (base) => ({
        ...base,
        padding: 0,
      }),
      singleValue: (base) => ({
        ...base,
        color: 'rgb(var(--color-text-primary) / 1)',
        fontWeight: 500,
      }),
      placeholder: (base) => ({
        ...base,
        color: 'rgb(var(--color-text-secondary) / 0.9)',
        fontWeight: 500,
      }),
      input: (base) => ({
        ...base,
        color: 'rgb(var(--color-text-primary) / 1)',
        fontWeight: 500,
      }),
      menu: (base) => ({
        ...base,
        borderRadius: '1.25rem',
        backgroundColor: 'rgb(var(--color-surface) / 1)',
        border: '1px solid rgb(var(--color-border) / 0.5)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-elevated)',
        marginTop: '0.5rem',
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 60,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? 'rgb(var(--color-accent) / 1)'
          : state.isFocused
          ? 'rgb(var(--color-surface-muted) / 1)'
          : 'transparent',
        color: state.isSelected
          ? 'rgb(var(--color-accent-foreground) / 1)'
          : 'rgb(var(--color-text-primary) / 1)',
        cursor: 'pointer',
        padding: '0.65rem 1.1rem',
        fontWeight: state.isSelected ? 600 : 500,
      }),
      dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused
          ? 'rgb(var(--color-accent) / 1)'
          : 'rgb(var(--color-text-secondary) / 1)',
        paddingRight: '0.35rem',
      }),
      clearIndicator: (base) => ({
        ...base,
        color: 'rgb(var(--color-text-secondary) / 1)',
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
    }),
    []
  );

  const selectTheme = useCallback(
    (baseTheme) => ({
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: 'rgb(var(--color-accent) / 1)',
        primary75: 'rgb(var(--color-accent) / 0.85)',
        primary50: 'rgb(var(--color-accent) / 0.55)',
        primary25: 'rgb(var(--color-accent) / 0.18)',
        neutral0: 'rgb(var(--color-surface) / 1)',
        neutral5: 'rgb(var(--color-surface-muted) / 1)',
        neutral10: 'rgb(var(--color-surface-muted) / 1)',
        neutral20: 'rgb(var(--color-border) / 0.45)',
        neutral30: 'rgb(var(--color-border) / 0.55)',
        neutral40: 'rgb(var(--color-border) / 0.65)',
        neutral80: 'rgb(var(--color-text-primary) / 1)',
      },
    }),
    []
  );

  return (
    <div className='grid gap-8 sm:gap-10 text-primary'>
      <header className='space-y-3'>
        <h2 className='text-3xl font-semibold text-primary sm:text-4xl'>
          Create Timer
        </h2>
        <p className='max-w-xl text-base text-secondary sm:text-lg'>
          Track upcoming events by setting a timer.
        </p>
      </header>

      <form
        className='grid gap-8 bg-surface px-4 py-6 rounded-[2rem] border border-border/30 shadow-glass'
        onSubmit={handleSubmit}
        noValidate
      >
        <label className='grid gap-3'>
          <span className='text-xs font-semibold uppercase tracking-[0.32em] text-secondary'>
            Event name
          </span>
          <input
            type='text'
            value={eventName}
            onChange={(event) => {
              setEventName(event.target.value);
              resetStatus();
            }}
            placeholder='e.g. Project launch'
            autoComplete='off'
            required
            className='w-full rounded-2xl border border-border/40 bg-surface px-5 py-4 text-lg font-medium text-primary shadow-inner transition duration-200 placeholder:text-secondary/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20'
          />
        </label>

        <div className='grid gap-3'>
          <label
            className='text-xs font-semibold uppercase tracking-[0.32em] text-secondary'
            htmlFor='category-select-input'
          >
            Category
          </label>
          {categoryOptions.length > 0 && (
            <Select
              classNamePrefix='category-select'
              styles={selectStyles}
              theme={selectTheme}
              options={[...categoryOptions]}
              value={categorySelectValue}
              onChange={handleCategorySelect}
              placeholder='Search categories'
              isClearable
              isSearchable
              menuPortalTarget={
                typeof document !== 'undefined' ? document.body : null
              }
              menuPlacement='auto'
              instanceId='category-select'
              inputId='category-select-input'
            />
          )}

          {isAddingNewCategory && (
            <div className='grid gap-3 rounded-2xl border border-border/40 bg-surface-muted/60 px-5 py-5 shadow-inner shadow-border/10'>
              <label
                className='text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-secondary/80'
                htmlFor='new-category-name'
              >
                New category name
              </label>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
                <input
                  id='new-category-name'
                  type='text'
                  value={newCategoryName}
                  onChange={(event) => {
                    setNewCategoryName(event.target.value);
                    setNewCategoryError('');
                    resetStatus();
                  }}
                  placeholder='e.g. Anniversary'
                  autoComplete='off'
                  className='w-full rounded-2xl border border-border/40 bg-surface px-4 py-3 text-base font-medium text-primary shadow-inner transition duration-200 placeholder:text-secondary/70 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20'
                />

                <button
                  type='button'
                  onClick={handleCancelAddCategory}
                  className='inline-flex w-full items-center justify-center gap-2 rounded-full border border-border/40 bg-surface px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-secondary transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto'
                >
                  Cancel
                </button>
              </div>

              {newCategoryError && (
                <p className='text-sm font-medium text-danger'>
                  {newCategoryError}
                </p>
              )}
            </div>
          )}
        </div>

        <label className='grid gap-3'>
          <span className='text-xs font-semibold uppercase tracking-[0.32em] text-secondary'>
            Event date &amp; time
          </span>
          <div className='grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end sm:gap-6'>
            <div className='grid gap-2'>
              <label className='text-xs font-semibold uppercase tracking-[0.28em] text-secondary/80'>
                Date
              </label>
              <input
                type='date'
                min={minDate}
                value={eventDate}
                onChange={(event) => {
                  setEventDate(event.target.value);
                  resetStatus();
                }}
                required
                className='w-full rounded-2xl border border-border/40 bg-surface px-4 py-3 text-base font-medium text-primary shadow-inner transition duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20'
              />
            </div>

            <div className='grid gap-2'>
              <label className='text-xs font-semibold uppercase tracking-[0.28em] text-secondary/80'>
                Hour
              </label>
              <select
                value={hour}
                onChange={(event) => {
                  setHour(event.target.value);
                  resetStatus();
                }}
                className='rounded-2xl border border-border/40 bg-surface px-4 py-3 text-base font-medium text-primary shadow-inner transition duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20'
              >
                {HOURS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-2'>
              <label className='text-xs font-semibold uppercase tracking-[0.28em] text-secondary/80'>
                Minute
              </label>
              <select
                value={minute}
                onChange={(event) => {
                  setMinute(event.target.value);
                  resetStatus();
                }}
                className='rounded-2xl border border-border/40 bg-surface px-4 py-3 text-base font-medium text-primary shadow-inner transition duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20'
              >
                {MINUTES_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className='grid gap-2'>
              <label className='text-xs font-semibold uppercase tracking-[0.28em] text-secondary/80'>
                AM / PM
              </label>
              <select
                value={meridiem}
                onChange={(event) => {
                  setMeridiem(event.target.value);
                  resetStatus();
                }}
                className='rounded-2xl border border-border/40 bg-surface px-4 py-3 text-base font-medium text-primary shadow-inner transition duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/20'
              >
                {MERIDIEM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <span className='text-sm text-secondary sm:text-base'>
            Pick a date and time in the future. Defaults to 12:00 AM if you only
            select a date.
          </span>
          <p className='text-sm font-medium text-accent'>{livePreview}</p>
        </label>

        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <button
            type='submit'
            disabled={isSubmitting}
            className='inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-accent-foreground shadow-glass transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_55px_-32px_rgba(99,102,241,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none'
          >
            {timer ? 'Update timer' : 'Save timer'}
          </button>

          {status.type === 'error' && (
            <p className='flex items-center gap-2 text-sm font-medium text-danger'>
              <span className='inline-flex h-2.5 w-2.5 rounded-full bg-danger' />
              {status.message}
            </p>
          )}

          {status.type === 'success' && (
            <p className='flex items-center gap-2 text-sm font-medium text-success'>
              <span className='inline-flex h-2.5 w-2.5 rounded-full bg-success' />
              {status.message}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default CreateTimerForm;

function formatted24HourTime(hour, minute, meridiem) {
  let normalizedHour = Number.parseInt(hour, 10);
  if (
    Number.isNaN(normalizedHour) ||
    normalizedHour < 1 ||
    normalizedHour > 12
  ) {
    normalizedHour = 12;
  }

  const sanitizedMinute = minute.padStart(2, '0');
  const upperMeridiem = meridiem.toUpperCase() === 'PM' ? 'PM' : 'AM';

  if (upperMeridiem === 'AM') {
    normalizedHour = normalizedHour === 12 ? 0 : normalizedHour;
  } else {
    normalizedHour = normalizedHour === 12 ? 12 : normalizedHour + 12;
  }

  return `${String(normalizedHour).padStart(2, '0')}:${sanitizedMinute}`;
}

function convert24HourTo12Hour(hour) {
  if (Number.isNaN(hour) || hour < 0 || hour > 23) {
    return { hour: '12', meridiem: 'AM' };
  }

  if (hour === 0) {
    return { hour: '12', meridiem: 'AM' };
  }

  if (hour === 12) {
    return { hour: '12', meridiem: 'PM' };
  }

  if (hour > 12) {
    return { hour: String(hour - 12), meridiem: 'PM' };
  }

  return { hour: String(hour), meridiem: 'AM' };
}
