import { useState, useEffect } from 'react';

/**
 * Follows `value`, but only once it has stopped changing for `delay` ms; the first value
 * is used immediately. Pass a primitive — a new object every render would never settle.
 */
export default function useSettledValue(value, delay) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    if (value === settled) return undefined;
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, settled, delay]);

  return settled;
}
