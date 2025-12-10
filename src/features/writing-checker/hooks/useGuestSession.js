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
  if (typeof window === 'undefined') {
    return null;
  }

  let newId = null;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    newId = crypto.randomUUID();
  } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const array = new Uint32Array(4);
    crypto.getRandomValues(array);
    newId = Array.from(array, (value) => value.toString(16).padStart(8, '0')).join('-');
  } else {
    newId = `guest-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  }

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
