import { createContext, useEffect, useRef, useState } from 'react';

const TimerTickContext = createContext(new Date());

export function TimerTickProvider({ interval = 1000, children }) {
  const frameRef = useRef(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    function update() {
      setNow(new Date());
      frameRef.current = window.setTimeout(update, interval);
    }

    frameRef.current = window.setTimeout(update, interval);

    return () => {
      if (frameRef.current !== null) {
        window.clearTimeout(frameRef.current);
      }
    };
  }, [interval]);

  return (
    <TimerTickContext.Provider value={now}>
      {children}
    </TimerTickContext.Provider>
  );
}

export default TimerTickContext;
