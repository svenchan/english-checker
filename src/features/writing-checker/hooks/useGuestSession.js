import { useEffect, useState } from 'react';

const STORAGE_KEY = 'guestSessionId';

const getStoredGuestSessionId = () => {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return null;
  }

  return window.sessionStorage.getItem(STORAGE_KEY);
};

const setStoredGuestSessionId = (value) => {
  if (typeof window === 'undefined' || typeof window.sessionStorage === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, value);
};

const createGuestSessionId = () => {
  if (typeof window === 'undefined' || typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
    return null;
  }

  const newId = crypto.randomUUID();
  setStoredGuestSessionId(newId);
  return newId;
};

export function useGuestSession() {
  const [guestSessionId, setGuestSessionId] = useState('');

  useEffect(() => {
    const existingId = getStoredGuestSessionId();
    if (existingId) {
      setGuestSessionId(existingId);
      return;
    }

    const newId = createGuestSessionId();
    if (newId) {
      setGuestSessionId(newId);
    }
  }, []);

  return guestSessionId;
}
