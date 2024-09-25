import useSWR from 'swr';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import { useMemo, useEffect, useReducer, useCallback } from 'react';

import axios, { fetcher, endpoints } from 'src/utils/axios';

import { AuthContext } from './auth-context';
import { setSession, isValidToken } from './utils';

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
    };
  }
  return state;
};

// ----------------------------------------------------------------------

// const STORAGE_KEY = 'accessToken';

export function AuthProvider({ children }) {
  const location = useLocation();

  const publicRoutes = ['/public'];

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some((route) => location.pathname.startsWith(route));

  const [state, dispatch] = useReducer(reducer, initialState);

  const { data: userData } = useSWR(isPublicRoute ? null : endpoints.auth.me, fetcher);

  // eslint-disable-next-line react-hooks/exhaustive-deps

  const initialize = useCallback(async () => {
    try {
      if (userData && isValidToken(userData.accessToken)) {
        const { user } = userData;

        dispatch({
          type: 'INITIAL',
          payload: {
            user: {
              ...user,
            },
          },
        });
      } else {
        dispatch({
          type: 'INITIAL',
          payload: {
            user: null,
          },
        });
      }
    } catch (error) {
      dispatch({
        type: 'INITIAL',
        payload: {
          user: null,
        },
      });
    }
  }, [userData]);

  useEffect(() => {
    initialize();
  }, [initialize]);

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
  const register = useCallback(async (email, password, firstName, lastName) => {
    const data = {
      email,
      password,
      firstName,
      lastName,
    };

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

  // const permission = flattenData(state.user?.admin?.adminPermissionModule);
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
    }),
    [login, logout, register, verify, state.user, status, permission, role]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
