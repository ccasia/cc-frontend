import React, { useState } from 'react';

import { Grid, Container, Typography } from '@mui/material';

import { useGetAllInvoices } from 'src/api/invoices';

import FinanceStatistics from './FinanceStatistics';
import InvoiceHistoryCampaignList from './InvoiceHistoryCampaignList';

// Dummy data
const initialData = [
  {
    id: 1,
    campaign: 'Design For The Better',
    creator: 'Cult Creative Sdn Bhd',
    invoice: 'INV-1',
    date: '2024-09-01',
    amount: '100.00',
    status: 'Paid',
  },
  {
    id: 2,
    campaign: 'Campaign 2',
    creator: 'Creator 2',
    invoice: 'INV-2',
    date: '2024-09-02',
    amount: '1001.00',
    status: 'Paid',
  },
  {
    id: 3,
    campaign: 'Campaign 3',
    creator: 'Creator 3',
    invoice: 'INV-3',
    date: '2024-09-03',
    amount: '2000.00',
    status: 'Paid',
  },
  {
    id: 4,
    campaign: 'Campaign 4',
    creator: 'Creator 4',
    invoice: 'INV-4',
    date: '2024-09-04',
    amount: '5001.00',
    status: 'Paid',
  },
  {
    id: 5,
    campaign: 'Campaign 5',
    creator: 'Creator 5',
    invoice: 'INV-5',
    date: '2024-09-05',
    amount: '10001.00',
    status: 'Paid',
  },
  {
    id: 6,
    campaign: 'Campaign 6',
    creator: 'Creator 6',
    invoice: 'INV-6',
    date: '2024-09-06',
    amount: '24999.00',
    status: 'Paid',
  },
  {
    id: 7,
    campaign: 'Campaign 7',
    creator: 'Creator 7',
    invoice: 'INV-7',
    date: '2024-09-07',
    amount: '30000.00',
    status: 'Paid',
  },
];

const Dashboard = () => {
  const [data, setData] = useState(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: invoices, isLoading } = useGetAllInvoices();

  // Function to handle data updates
  const handleDataUpdate = (updatedData) => {
    setData(updatedData);
  };

  // Function to handle search input changes
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Function to calculate statistics from the data
  const calculateStats = (invoiceData) => {
    const totalPaidInvoices = invoiceData.filter((item) => item.status === 'paid').length;
    const totalRevenue = invoiceData
      .filter((item) => item.status === 'paid')
      .reduce(
        (acc, item) => acc + parseFloat(item?.amount.toString().replace('RM', '').replace(',', '')),
        0
      );

    const pendingInvoices = invoiceData.filter((item) => item.status === 'pending').length;

    const pendingAmount = invoiceData
      .filter((item) => item.status === 'pending')
      .reduce(
        (acc, item) =>
          acc + parseFloat(item?.amount?.toString().replace('RM', '').replace(',', '')),
        0
      );

    const overdueInvoices = invoiceData.filter((item) => item.status === 'overdue').length;
    const overdueAmount = invoiceData
      .filter((item) => item.status === 'overdue')
      .reduce(
        (acc, item) =>
          acc + parseFloat(item?.amount?.toString().replace('RM', '').replace(',', '')),
        0
      );

    return {
      totalRevenue,
      totalPaidInvoices,
      pendingInvoices,
      pendingAmount,
      overdueInvoices,
      overdueAmount,
    };
  };

  const stats = !isLoading && calculateStats(invoices);

  // Filter data based on search query
  const filteredData =
    !isLoading &&
    invoices.filter(
      (item) =>
        item.campaign.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.createdAt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <Container maxWidth="lg" sx={{ maxHeight: '0vh' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Finance Dashboard
      </Typography>
      <Grid container spacing={4}>
        {/* Finance Statistics */}
        <Grid item xs={12} md={12}>
          <FinanceStatistics stats={stats} />
        </Grid>

        {/* Invoice History and Campaign List */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Invoice History.
          </Typography>

          {!isLoading && (
            <InvoiceHistoryCampaignList
              data={filteredData}
              onDataUpdate={handleDataUpdate}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
