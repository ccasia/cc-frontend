/* eslint-disable consistent-return */
import PropTypes from 'prop-types';
import { useParams } from 'react-router';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect, useCallback, createContext } from 'react';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/utils/axios';

export const adminContext = createContext();

const AdminGuardProvider = ({ children }) => {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState();

  useEffect(() => {
    if (!id) {
      router.push(paths.auth.jwt.login);
    }
  }, [id, router]);

  const inviteToken = id.split('=')[1];

  const checkToken = useCallback(async () => {
    try {
      const res = await axiosInstance.get(endpoints.auth.verifyAdmin, {
        params: { inviteToken },
      });
      setUser(res.data.user);
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
      router.push(`${paths.auth.jwt.adminLogin}/?token=${inviteToken}`);
    }
  }, [inviteToken, router]);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  const memoizedValue = useMemo(() => ({ user }), [user]);

  return <adminContext.Provider value={memoizedValue}>{children}</adminContext.Provider>;
};

export default AdminGuardProvider;

AdminGuardProvider.propTypes = {
  children: PropTypes.node,
};
