import { useMemo } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';

import { useResponsive } from 'src/hooks/use-responsive';

// ----------------------------------------------------------------------

export default function AuthModernLayout({ children, image }) {
  const mdUp = useResponsive('up', 'md');
  // const [backgroundImage, setBackgroundImage] = useState('');
  const route = window.location.href;

  // if (route.includes('register')) {
  //   console.log('adasd');
  // } else if (route.includes("login")) {

  // }

  const backgroundImage = useMemo(() => {
    if (route.includes('register')) {
      return '/background/register.jpg';
    }
    if (route.includes('forgot-password')) {
      return '/background/forgotPass.jpg';
    }
    if (route.includes('login')) {
      return '/background/login.jpg';
    }

    return '/background/newPass.jpg';
  }, [route]);

  const renderContent = (
    <Stack
      sx={{
        width: 1,
        mx: 'auto',
        maxWidth: 480,
        px: { xs: 2, md: 6 },
      }}
    >
      <Box
        component="img"
        src="/logo/newlogo.svg"
        sx={{
          width: 50,
          height: 50,
          mt: { xs: 2, md: 8 },
          mb: { xs: 10, md: 8 },
          mx: 'auto',
        }}
      />
      <Card
        sx={{
          boxShadow: { md: 'none' },
          overflow: { md: 'unset' },
          bgcolor: { md: 'background.default' },
          mt: 5,
        }}
      >
        {children}
      </Card>
    </Stack>
  );

  const renderSection = (
    <Stack flexGrow={1} sx={{ position: 'relative' }}>
      <Box
        component="img"
        alt="auth"
        src={image || '/assets/images/login/cultimage.png'}
        sx={{
          top: 16,
          left: 16,
          objectFit: 'cover',
          position: 'absolute',
          width: 'calc(100% - 32px)',
          height: 'calc(100% - 32px)',
          mixBlendMode: 'exclusion',
        }}
      />
    </Stack>
  );

  return (
    <Box
      sx={{
        // background: 'radial-gradient(circle, rgba(238,224,255,1) 0%, rgba(254,255,255,1) 70%)',
        background: `url(${backgroundImage}) no-repeat fixed center`,
        backgroundSize: 'cover',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {renderContent}
    </Box>
  );
}

AuthModernLayout.propTypes = {
  children: PropTypes.node,
  image: PropTypes.string,
};
