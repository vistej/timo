import { useEffect, useMemo, useState } from 'react';
import CreateTimerForm from './components/CreateTimerForm.jsx';
import Modal from './components/Modal.jsx';
import SiteHeader from './components/SiteHeader.jsx';
import TimersListPage from './pages/TimersListPage.jsx';
import {
  readTimersFromStorage,
  writeTimersToStorage,
} from './utils/timerStorage.js';
import { TimerTickProvider } from './context/TimerTickContext.jsx';

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

function App() {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [formResetSignal, setFormResetSignal] = useState(0);
  const [selectedTimer, setSelectedTimer] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const backgroundShapes = useMemo(() => {
    if (theme === 'dark') {
      return [
        'absolute -top-32 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-amber-400/16 blur-[160px]',
        'absolute bottom-0 right-0 h-[480px] w-[480px] translate-x-1/3 translate-y-1/4 rounded-full bg-amber-500/14 blur-[150px]',
        'absolute -left-12 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-[120px]',
      ];
    }

    return [
      'absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-300/40 blur-[140px]',
      'absolute bottom-0 right-0 h-[460px] w-[460px] translate-x-1/3 translate-y-1/4 rounded-full bg-rose-200/35 blur-[140px]',
      'absolute -left-10 top-0 h-72 w-72 rounded-full bg-sky-200/30 blur-[120px]',
    ];
  }, [theme]);

  const handleTimerCreated = () => {
    setRefreshSignal((value) => value + 1);
    handleModalClose();
  };

  const handleModalClose = () => {
    setCreateModalOpen(false);
    setSelectedTimer(null);
    setFormResetSignal((value) => value + 1);
  };

  const handleEditTimer = (timer) => {
    setSelectedTimer(timer);
    setCreateModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setSelectedTimer(null);
    setFormResetSignal((value) => value + 1);
    setCreateModalOpen(true);
  };

  const handleDeleteTimer = async (timer) => {
    if (!timer?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${timer.name}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const timers = await readTimersFromStorage();
      const filteredTimers = timers.filter((item) => item.id !== timer.id);

      if (filteredTimers.length === timers.length) {
        return;
      }

      await writeTimersToStorage(filteredTimers);

      if (selectedTimer?.id === timer.id) {
        setSelectedTimer(null);
        setFormResetSignal((value) => value + 1);
      }

      setRefreshSignal((value) => value + 1);
    } catch (error) {
      console.error('Unable to delete timer', error);
      window.alert?.('Unable to delete timer. Please try again.');
    }
  };

  return (
    <TimerTickProvider>
      <div className='relative overflow-hidden pb-12'>
        <div
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 -z-10'
        >
          {backgroundShapes.map((className, index) => (
            <div key={index} className={className} />
          ))}
        </div>

        <SiteHeader
          onCreateTimer={handleOpenCreateModal}
          onToggleTheme={toggleTheme}
          theme={theme}
        />

        <div className='relative z-10 mt-16 flex flex-col gap-14 px-4 sm:px-6 lg:px-10'>
          <TimersListPage
            refreshSignal={refreshSignal}
            onEditTimer={handleEditTimer}
            onDeleteTimer={handleDeleteTimer}
            theme={theme}
          />
        </div>

        <Modal
          isOpen={isCreateModalOpen}
          onClose={handleModalClose}
          title='Countdown'
          theme={theme}
        >
          <CreateTimerForm
            onSuccess={handleTimerCreated}
            resetSignal={formResetSignal}
            timer={selectedTimer}
          />
        </Modal>
      </div>
    </TimerTickProvider>
  );
}

export default App;
