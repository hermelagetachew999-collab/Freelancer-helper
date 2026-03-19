import { useEffect, useState } from 'react';
import { Account, authApi } from '../api/client';
import { useSessionId } from './useSession';

export function useAuth() {
  const sessionId = useSessionId();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const { data } = await authApi.me();
    setAccount(data.account);
  };

  useEffect(() => {
    (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signup = async (email: string, password: string) => {
    const { data } = await authApi.signup(email, password, sessionId);
    setAccount(data.account);
  };

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password, sessionId);
    setAccount(data.account);
  };

  const logout = async () => {
    await authApi.logout();
    setAccount(null);
  };

  return { account, loading, signup, login, logout, refresh };
}

