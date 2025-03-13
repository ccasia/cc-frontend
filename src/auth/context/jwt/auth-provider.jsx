import PropTypes from 'prop-types';
import { useLocation } from 'react-router';
import { useMemo, useState, useEffect, useReducer, useCallback } from 'react';

import axios, { endpoints } from 'src/utils/axios';

import CreatorForm from 'src/sections/creator/form/creatorForm';

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
};

const reducer = (state, action) => {
  if (action.type === 'INITIAL') {
    return {
      loading: false,
      user: action.payload.user,
    };
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

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [dialogOpen, setDialogOpen] = useState(false);
  const location = useLocation();

  const initialize = useCallback(async () => {
    try {
      const res = await axios.get(endpoints.auth.me);

      dispatch({
        type: 'INITIAL',
        payload: {
          user: res.data.user,
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
    const response = await axios.post(endpoints.auth.registerCreator, data);

    const { user } = response.data;

    return user;
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

  // LOGOUT
  const logout = useCallback(async () => {
    await axios.post(endpoints.auth.logout);
    setSession(null);
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
      method: 'jwt',
      permission,
      role,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      //
      login,
      register,
      verify,
      logout,
      initialize,
      dispatch,
    }),
    [login, logout, register, verify, state.user, status, permission, role, initialize]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
