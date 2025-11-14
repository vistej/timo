import { useContext } from 'react';
import TimerTickContext from '../context/TimerTickContext.jsx';

const useTimerNow = () => useContext(TimerTickContext);

export default useTimerNow;
