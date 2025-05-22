import { useState } from 'react';

import { Box, Stack, Container, TextField, Typography } from '@mui/material';

import { useSettingsContext } from 'src/components/settings';

const ReportingView = () => {
  const settings = useSettingsContext();
  const [url, setUrl] = useState('');

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      {/* Back button can be added here */}

      {/* Header Section */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        sx={{
          alignItems: { xs: 'center', md: 'flex-end' },
        }}
      >
        {/* Content Title & URL Section */}
        <Stack>
          <Typography
            variant="h1"
            sx={{
              fontFamily: 'Aileron, sans-serif',
              fontWeight: 400,
              fontSize: { xs: 35, md: 48 },
              color: '#231F20',
            }}
          >
            Creator Name
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontFamily: 'Aileron, sans-serif',
              fontWeight: 400,
              fontSize: { xs: 35, md: 48 },
              color: '#231F20',
            }}
            mb={1}
          >
            Content Performance Report
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Aileron, sans-serif',
              fontWeight: 400,
              fontSize: 16,
              color: '#231F20',
              mb: 1,
            }}
          >
            Post Link
          </Typography>
          <TextField
            fullWidth
            placeholder="https://www.instagram.com/p/contentperformancereport/"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: '#fff',
                '& fieldset': {
                  borderColor: '#E0E0E0',
                },
                '&:hover fieldset': {
                  borderColor: '#1340FF',
                },
              },
            }}
          />
        </Stack>

        {/* Logo Section */}
        <Stack>
          <Box
            component="img"
            src="/logo/cultcreativelogo.svg"
            alt="Cult Creative Logo"
            draggable="false"
            sx={{
              height: { xs: 60, sm: 100, md: 135 },
              mt: { xs: 3 },
            }}
          />
        </Stack>
      </Stack>

      {/* Rest of the content will go here */}
    </Container>
  );
};

export default ReportingView;
