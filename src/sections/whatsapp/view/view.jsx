import { Toaster } from 'sonner';
import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import { Tab, Tabs, Stack, Container, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import Message from '../sections/Message';
import Setting from '../sections/Setting';
import Insights from '../components/Insights';

const WhatsappDashboard = () => {
  const [activeTab, setActiveTab] = useState('settings');

  return (
    <Container sx={{ p: 2 }} maxWidth="xl">
      <Stack
        direction="row"
        alignItems="center"
        gap={1}
        sx={{ justifyContent: { xs: 'center', md: 'start' } }}
      >
        <Iconify icon="ic:baseline-whatsapp" width={38} color="black" />
        <Typography variant="h5" sx={{ textDecoration: 'underline', textUnderlineOffset: 5 }}>
          Whatsapp Business Setup
        </Typography>
      </Stack>

      <Container
        maxWidth="lg"
        sx={{
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Insights />

        <Tabs value={activeTab} sx={{ mt: 2 }} onChange={(_, val) => setActiveTab(val)}>
          <Tab
            label="Messages"
            value="messages"
            icon={<Iconify icon="material-symbols:list-rounded" width={18} />}
          />

          <Tab label="Setting" value="settings" icon={<Iconify icon="uil:setting" width={18} />} />
        </Tabs>

        <AnimatePresence mode="wait">
          {activeTab === 'messages' && <Message key="message" />}
          {activeTab === 'settings' && <Setting key="setting" />}
        </AnimatePresence>
      </Container>

      <Toaster />
    </Container>
  );
};

export default WhatsappDashboard;
