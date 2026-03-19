import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useSessionId(): string {
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('fc_session_id');
    if (stored) return stored;
    const newId = uuidv4();
    localStorage.setItem('fc_session_id', newId);
    return newId;
  });
  return sessionId;
}

export function useOnboarded(): [boolean, () => void] {
  const [onboarded, setOnboarded] = useState(() =>
    localStorage.getItem('fc_onboarded') === 'true'
  );
  const markOnboarded = () => {
    localStorage.setItem('fc_onboarded', 'true');
    setOnboarded(true);
  };
  return [onboarded, markOnboarded];
}
