import React from 'react';
import PropTypes from 'prop-types';

import { Card, Grid, CardContent } from '@mui/material';

import InvoiceAnalytic from './invoice-analytic';

// import InvoiceAnalytic from 'src/sections/admin/Finance/invoice-analytic';

const FinanceStatistics = ({ stats }) => {
  const getTotalAmount = () => stats.totalRevenue + stats.pendingAmount + stats.overdueAmount;

  const MAX_AMOUNT = getTotalAmount();

  const calculatePercent = (amount) =>
    MAX_AMOUNT > 0 ? Math.min((amount / MAX_AMOUNT) * 100, 100) : 0;

  // Function to format numbers with commas
  const formatAmount = (amount) => new Intl.NumberFormat('en-US').format(amount);

  const financeStats = [
    {
      title: 'Total Revenue',
      total: stats.totalPaidInvoices,
      icon: 'fluent:money-20-filled',
      color: '#4caf50',
      percent: calculatePercent(stats.totalRevenue),
      price: `RM${formatAmount(stats.totalRevenue?.toFixed(2))}`,
    },
    {
      title: 'Pending',
      total: stats.pendingInvoices,
      icon: 'mdi:alert-circle',
      color: '#ff9800',
      percent: calculatePercent(stats.pendingAmount),
      price: `RM${formatAmount(stats.pendingAmount?.toFixed(2))}`,
    },
    {
      title: 'Overdue',
      total: stats.overdueInvoices,
      icon: 'mdi:alarm',
      color: '#d32f2f',
      percent: calculatePercent(stats.overdueAmount),
      price: `RM${formatAmount(stats.overdueAmount?.toFixed(2))}`,
    },
  ];

  return (
    <Grid container spacing={3}>
      {financeStats.map((stat, index) => (
        <Grid item xs={12} md={4} key={index}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent
              sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <InvoiceAnalytic {...stat} />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

FinanceStatistics.propTypes = {
  stats: PropTypes.shape({
    totalRevenue: PropTypes.number.isRequired,
    totalPaidInvoices: PropTypes.number.isRequired,
    pendingInvoices: PropTypes.number.isRequired,
    pendingAmount: PropTypes.number.isRequired,
    overdueInvoices: PropTypes.number.isRequired,
    overdueAmount: PropTypes.number.isRequired,
  }).isRequired,
};

export default FinanceStatistics;
