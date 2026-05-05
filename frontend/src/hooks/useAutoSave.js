import { useEffect, useRef, useCallback } from 'react';

export function useAutoSave(value, onSave, delay = 1500) {
  const timerRef = useRef(null);
  const prevValueRef = useRef(value);

  const save = useCallback(async () => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      await onSave(value);
    }
  }, [value, onSave]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(save, delay);
    return () => clearTimeout(timerRef.current);
  }, [save, delay]);

  // Save on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      save();
    };
  }, []);
}
