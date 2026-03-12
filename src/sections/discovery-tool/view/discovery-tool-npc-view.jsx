import { Container, Typography } from '@mui/material';

const DiscoveryToolNpcView = () => {
  return (
    <Container maxWidth="xl">
      <Typography
        sx={{
          fontFamily: 'Aileron',
          fontSize: { xs: 24, md: 48 },
          fontWeight: 400,
        }}
      >
        Creator Discovery Tool
      </Typography>
    </Container>
  );
};

export default DiscoveryToolNpcView;
