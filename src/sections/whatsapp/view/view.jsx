import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';

import { Box, Tab, Tabs, Stack, Container, Typography } from '@mui/material';

import Iconify from 'src/components/iconify';

import Card from '../components/Card';
import Message from '../sections/Message';
import Setting from '../sections/Setting';

const Card_Items = [
  {
    id: 1,
    label: 'Messages sent',
    icon: 'hugeicons:sent-02',
  },
  {
    id: 2,
    label: 'Messages delivered',
    icon: 'solar:check-read-linear',
  },
  {
    id: 3,
    label: 'Messages read',
    icon: 'solar:check-read-linear',
  },
];

const BoxLayout = m(Box);

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
        <BoxLayout
          sx={{
            mt: 5,
            display: 'flex',
            gap: 1,
            p: 1,
            overflowX: 'scroll',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          }}
        >
          {Card_Items.map((data, i) => (
            <Card key={i} {...data} />
          ))}
        </BoxLayout>

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
    </Container>
  );
};

export default WhatsappDashboard;
