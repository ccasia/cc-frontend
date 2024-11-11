import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';

import { useResponsive } from 'src/hooks/use-responsive';

// ----------------------------------------------------------------------

export default function AuthModernLayout({ children, image }) {
  const mdUp = useResponsive('up', 'md');

  const renderContent = (
    <Stack
      sx={{
        width: 1,
        mx: 'auto',
        maxWidth: 480,
        px: { xs: 2, md: 6 },
        // px: 6,
        // bgcolor: 'rebeccapurple',
      }}
    >
      {/* <Logo
        sx={{
          mt: { xs: 2, md: 8 },
          mb: { xs: 10, md: 8 },
        }}
      /> */}

      <Card
        sx={{
          py: { xs: 0, md: 0 },
          px: { xs: 0, md: 0 },
          boxShadow: { md: 'none' },
          overflow: { md: 'unset' },
          bgcolor: { md: 'background.default' },
          mt: 10,
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

  // return (
  //   <Stack
  //     component="main"
  //     direction="row"
  //     sx={{
  //       minHeight: '100vh',
  //       position: 'relative',
  //       '&:before': {
  //         width: 1,
  //         height: 1,
  //         zIndex: -1,
  //         content: "''",
  //         position: 'absolute',
  //         backgroundSize: 'cover',
  //         opacity: { xs: 0.24, md: 0 },
  //         backgroundRepeat: 'no-repeat',
  //         backgroundPosition: 'center center',
  //         backgroundImage: 'url(/assets/background/overlay_4.jpg)',
  //       },
  //     }}
  //   >
  //     {renderContent}

  //     {mdUp && renderSection}
  //   </Stack>
  return (
    <Box
      sx={{
        background: 'radial-gradient(circle, rgba(238,224,255,1) 0%, rgba(254,255,255,1) 70%)',
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
