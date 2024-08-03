import PropTypes from 'prop-types';
import { useMemo, useEffect, useReducer, useCallback } from 'react';

import axios, { endpoints } from 'src/utils/axios';
import { flattenData } from 'src/utils/flatten-array';

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
  const [state, dispatch] = useReducer(reducer, initialState);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const initialize = useCallback(async () => {
    try {
      // const accessToken = sessionStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/rules-of-hooks

      const response = await axios.get(endpoints.auth.me);

      if (
        response.status === 200 ||
        (response.status === 202 && isValidToken(response?.data?.accessToken))
      ) {
        // setSession(accessToken);

        const { user } = response.data;

        dispatch({
          type: 'INITIAL',
          payload: {
            user: {
              ...user,
              // accessToken,
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
  }, []);

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

    // setSession(accessToken);

    dispatch({
      type: 'LOGIN',
      payload: {
        user: {
          ...user,
          accessToken,
        },
      },
    });
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

    // dispatch({
    //   type: 'REGISTER',
    //   payload: {
    //     user: {
    //       ...user,
    //     },
    //   },
    // });
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

  const permission = flattenData(state.user?.admin?.adminPermissionModule);

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: 'jwt',
      permission,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      //
      login,
      register,
      verify,
      logout,
    }),
    [login, logout, register, verify, state.user, status, permission]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
