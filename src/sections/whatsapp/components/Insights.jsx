import React from 'react';
import { m } from 'framer-motion';

import { Box } from '@mui/material';

import WhatsappCard from './Card';
import useGetMessageInsights from '../hooks/use-get-message-insight';

const Card_Items = [
  {
    id: 1,
    label: 'Messages sent',
    value: 'sent',
    icon: 'hugeicons:sent-02',
  },
  {
    id: 2,
    label: 'Messages delivered',
    value: 'delivered',
    icon: 'solar:check-read-linear',
  },
  {
    id: 3,
    label: 'Messages read',
    value: 'read',
    icon: 'solar:check-read-linear',
  },
];

const BoxLayout = m(Box);

const Insights = () => {
  const { data, isLoading } = useGetMessageInsights();

  return (
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
      {/* eslint-disable-next-line no-shadow */}
      {Card_Items.map((item, i) => (
        <WhatsappCard
          key={i}
          {...item}
          value={data?.customData[item.value]}
          isLoading={isLoading}
        />
      ))}
    </BoxLayout>
  );
};

export default Insights;
