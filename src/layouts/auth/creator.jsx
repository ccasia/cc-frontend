import { useMemo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';

// ----------------------------------------------------------------------

export default function AuthModernLayout({ children, image }) {
  // const mdUp = useResponsive('up', 'md');
  // const [backgroundImage, setBackgroundImage] = useState('');
  const route = window.location.href;

  // if (route.includes('register')) {
  //   console.log('adasd');
  // } else if (route.includes("login")) {

  // }

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

      {/* artwork credit for login page */}
      {/* {route.includes('login') && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#FFFFFF',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          Artwork by @_zoe.art
        </Box>
      )} */}

      {/* artwork credit for register page */}
      {/* {route.includes('register') && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#FFFFFF',
            fontSize: '14px',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          Artwork by @benlewisgiles
        </Box>
      )} */}
    </Stack>
  );

  // const renderSection = (
  //   <Stack flexGrow={1} sx={{ position: 'relative' }}>
  //     <Box
  //       component="img"
  //       alt="auth"
  //       src={image || '/assets/images/login/cultimage.png'}
  //       sx={{
  //         top: 16,
  //         left: 16,
  //         objectFit: 'cover',
  //         position: 'absolute',
  //         width: 'calc(100% - 32px)',
  //         height: 'calc(100% - 32px)',
  //         mixBlendMode: 'exclusion',
  //       }}
  //     />
  //   </Stack>
  // );

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100vh',
        width: 1,
        overflow: 'auto',
        // position: 'relative',
        '&::before': {
          content: '""',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
            url(${backgroundImage}) no-repeat fixed center
          `,
          backgroundSize: 'cover',
          zIndex: -1,
        },
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `url('/background/grain.png') repeat`,
          backgroundSize: 'cover',
          zIndex: 0,
        }}
      />
      {renderContent}
    </Box>
  );
}

AuthModernLayout.propTypes = {
  children: PropTypes.node,
  image: PropTypes.string,
};
