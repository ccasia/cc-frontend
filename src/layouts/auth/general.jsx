import PropTypes from 'prop-types';
import { useTheme } from '@emotion/react';
import { useLocation } from 'react-router';
import { useState, useEffect, createContext } from 'react';

import { Stack, Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import AuthModernLayout from './creator';
import AuthClassicLayout from './classic';

export const AuthLayoutContext = createContext();

const AuthLayoutProvider = ({ children, role = 'admin', title }) => {
  const [option, setOption] = useState(role);
  const theme = useTheme();
  const router = useRouter();
  const location = useLocation();

  useEffect(() => {
    if (option === 'admin' && location.pathname === paths.auth.jwt.register) {
      router.push(paths.auth.jwt.login);
    }
  }, [location, option, router]);

  const renderOptions = (
    <Stack
      direction="row"
      sx={{
        zIndex: 9,
        position: 'absolute',
        left: '50%',
        top: 30,
        transform: 'translate(-50%,0)',
        border: theme.palette.mode === 'dark' ? '1px solid white' : '1px solid black',
        borderRadius: 1,
      }}
    >
      <Button
        variant={option === 'creator' && 'contained'}
        onClick={() => {
          setOption('creator');
          router.push(paths.auth.jwt.login);
        }}
        sx={{
          borderRadius: 0.5,
        }}
      >
        Creator
      </Button>
      <Button
        variant={option === 'admin' && 'contained'}
        onClick={() => {
          setOption('admin');
          router.push(paths.auth.jwt.login);
        }}
        sx={{
          borderRadius: 0.5,
        }}
      >
        Admin
      </Button>
    </Stack>
  );

  return (
    <AuthLayoutContext.Provider value={option}>
      {renderOptions}

      {option === 'admin' ? (
        <AuthClassicLayout title={title}>{children}</AuthClassicLayout>
      ) : (
        <AuthModernLayout>{children}</AuthModernLayout>
      )}
    </AuthLayoutContext.Provider>
  );
};

export default AuthLayoutProvider;

AuthLayoutProvider.propTypes = {
  children: PropTypes.node,
  role: PropTypes.string,
  title: PropTypes.string,
};
