import { useMemo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import GlobalStyles from '@mui/material/GlobalStyles';

// ----------------------------------------------------------------------

export default function AuthModernLayout({ children, image }) {
  const route = window.location.href;

  const backgroundImage = useMemo(() => {
    if (route.includes('register')) {
      return '/background/signup.jpeg';
    }
    if (route.includes('setup-password')) {
      return '/background/signup.jpeg';
    }
    if (route.includes('forgot-password')) {
      return '/background/resetpassword.jpeg';
    }
    if (route.includes('login')) {
      return '/background/signin.jpeg';
    }
    return '/background/newPass.jpg';
  }, [route]);

  const renderContent = (
    <Stack
      sx={{
        width: 1,
        mx: 'auto',
        maxWidth: 480,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        pt: { xs: 12, md: 16 },
        position: 'relative',
      }}
    >
      <Box
        component="img"
        src="/logo/newlogo.svg"
        sx={{
          width: 50,
          height: 50,
          position: 'absolute',
          top: { xs: 16, md: 32 },
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      <Card
        sx={{
          boxShadow: { md: 'none' },
          overflow: { md: 'unset' },
          bgcolor: { md: 'background.default' },
          mt: { md: 5 },
        }}
      >
        {children}
      </Card>
    </Stack>
  );

  return (
    <>
      <GlobalStyles
        styles={{
          'html, body': {
            maxHeight: '100dvh',
            overflow: 'hidden',
          },
          body: {
            backgroundImage: `
              url('/background/grain.png'),
              linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
              url(${backgroundImage})
            `,
            backgroundSize: 'cover, cover, cover',
            backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
            backgroundPosition: 'center, center, center',
          },
        }}
      />
      <Box
        sx={{
          maxHeight: '100%',
          width: 1,
          overflow: 'auto',
          overscrollBehavior: 'contain',
          position: 'relative',
        }}
      >
        {renderContent}
      </Box>
    </>
  );
}

AuthModernLayout.propTypes = {
  children: PropTypes.node,
  image: PropTypes.string,
};
