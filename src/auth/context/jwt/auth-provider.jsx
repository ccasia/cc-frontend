import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { useLocation } from 'react-router';
import { useMemo, useEffect, useReducer, useCallback } from 'react';

import axios, { endpoints } from 'src/utils/axios';

import { forgetDashboardSession } from 'src/components/loading-screen';

import { setSession } from './utils';
import { AuthContext } from './auth-context';

// ----------------------------------------------------------------------
/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */
// ----------------------------------------------------------------------

const initialState = {
  user: null,
  loading: true,
  reauth_required: false,
};

const reducer = (state, action) => {
  if (action.type === 'INITIAL') {
    const { user, reauth_required } = action.payload;
    // /me runs on every page change; an unchanged user keeps the same state, so the app does not re-render.
    if (!state.loading && state.reauth_required === reauth_required && isEqual(state.user, user)) {
      return state;
    }
    return { loading: false, user, reauth_required };
  }
  if (action.type === 'LOGIN') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'REGISTER') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'VERIFY') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGOUT') {
    return {
      ...state,
      user: null,
      loading: false,
    };
  }
  return state;
};

// ----------------------------------------------------------------------

// const STORAGE_KEY = 'accessToken';

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const location = useLocation();

  const initialize = useCallback(async () => {
    try {
      const res = await axios.get(endpoints.auth.me);

      dispatch({
        type: 'INITIAL',
        payload: {
          user: res.data.user,
          reauth_required: res.data?.reauth_required,
        },
      });
    } catch (error) {
      if (error?.sessionExpired) {
        dispatch({
          type: 'LOGOUT',
        });
      }
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize, location]);

  // LOGIN
  const login = useCallback(async (email, password) => {
    const data = {
      email,
      password,
    };

    const response = await axios.post(endpoints.auth.login, data);

    const { accessToken, user } = response.data;

    sessionStorage.removeItem('mediaKitPopupShown');

    dispatch({
      type: 'LOGIN',
      payload: {
        user: {
          ...user,
          accessToken,
        },
      },
    });

    return response?.data;
  }, []);

  // REGISTER
  const register = useCallback(async (data) => {
    try {
      const response = await axios.post(endpoints.auth.registerCreator, data);
      return response.data.user;
    } catch (error) {
      // console.error('Backend registration error:', error);
      // console.error('Error response:', error.response?.data);
      const message = error?.message || 'Something went wrong';
      throw new Error(message);
    }
  }, []);

  // REGISTER CLIENT
  const registerClient = useCallback(async (data) => {
    try {
      const response = await axios.post(endpoints.auth.registerClient, data);

      // Client registration now requires email verification
      // Return email for verification flow instead of auto-login
      return { email: response.data.email };
    } catch (error) {
      console.error('Client registration error:', error);
      console.error('Error response:', error.response?.data);
      const message = error?.response?.data?.message || error?.message || 'Something went wrong';
      throw new Error(message);
    }
  }, []);

  const verify = useCallback(async (token) => {
    const response = await axios.post(endpoints.auth.verifyCreator, { token });

    const { user, accessToken } = response.data;

    setSession(accessToken);

    dispatch({
      type: 'VERIFY',
      payload: {
        user: {
          ...user,
          accessToken,
        },
      },
    });
  }, []);

  const verifyClient = useCallback(async (token) => {
    const response = await axios.post(endpoints.auth.verifyClient, { token });

    const { user, accessToken } = response.data;

    setSession(accessToken);

    dispatch({
      type: 'VERIFY',
      payload: {
        user: {
          ...user,
          accessToken,
        },
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await axios.post(endpoints.auth.logout);
    setSession(null);
    forgetDashboardSession();
    // Clear profile completion flags on logout
    localStorage.removeItem('profileCompleted');
    sessionStorage.removeItem('profileModalShown');
    // Clear media kit popup flags so it shows again on next login
    sessionStorage.removeItem('mediaKitPopupShown');
    sessionStorage.removeItem('mediaKitPopupPageVisit');
    // Clear the login session flag to trigger popup on next login
    sessionStorage.removeItem('currentLoginSession');
    dispatch({
      type: 'LOGOUT',
    });
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const role = state?.user?.admin?.role;

  const permission = state?.user?.admin?.role?.permissions;

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      xero_reauth_required: state?.reauth_required,
      method: 'jwt',
      permission,
      role,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      //
      login,
      register,
      registerClient,
      verify,
      verifyClient,
      logout,
      initialize,
      dispatch,
    }),
    [
      login,
      logout,
      register,
      registerClient,
      verify,
      verifyClient,
      state.user,
      state?.reauth_required,
      status,
      permission,
      role,
      initialize,
    ]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
