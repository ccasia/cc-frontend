import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Box,
  Card,
  Table,
  Stack,
  styled,
  Button,
  Avatar,
  Divider,
  TableRow,
  useTheme,
  TableCell,
  TableHead,
  TableBody,
  Typography,
  useMediaQuery,
  TableContainer,
} from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #f0f0f0',
  overflow: 'hidden',
}));

const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: '#fafafa',
  '& .MuiTableCell-head': {
    color: '#666666',
    fontWeight: 600,
    fontSize: '0.75rem',
    textTransform: 'none',
    borderBottom: '1px solid #f0f0f0',
    padding: '8px 12px',
    height: '40px',
    [theme.breakpoints.up('sm')]: {
      fontSize: '0.8rem',
      padding: '10px 16px',
      height: '44px',
    },
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    backgroundColor: '#fafafa',
  },
  '& .MuiTableCell-root': {
    borderBottom: '1px solid #f5f5f5',
    padding: '10px 12px',
    fontSize: '0.8rem',
    [theme.breakpoints.up('sm')]: {
      padding: '12px 16px',
      fontSize: '0.875rem',
    },
  },
  '&:last-child .MuiTableCell-root': {
    borderBottom: 'none',
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#fafafa',
    transform: 'translateY(-1px)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  '&:last-child': {
    marginBottom: 0,
  },
}));

const InvoiceLists = ({ invoices }) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return '#FFC704';
      case 'overdue':
      case 'out of date':
        return '#D4321C';
      case 'paid':
        return '#1DBF66';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status) => 
    status === 'draft' ? 'Waiting for approval' : status;

  const renderStatusBadge = (status) => {
    const statusColor = getStatusColor(status);
    
    return (
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          color: statusColor,
          border: '1px solid',
          borderColor: statusColor,
          borderBottom: 2,
          borderBottomColor: statusColor,
          borderRadius: 0.75,
          py: { xs: 0.25, sm: 0.375 },
          px: { xs: 0.75, sm: 1 },
          fontWeight: 600,
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          textTransform: 'uppercase',
          letterSpacing: '0.4px',
          width: 'fit-content',
          whiteSpace: 'nowrap',
        }}
      >
        {getStatusLabel(status)}
      </Box>
    );
  };

  const renderActionButtons = (invoice) => (
    <Stack 
      direction={{ xs: 'column', sm: 'row' }} 
      spacing={{ xs: 0.75, sm: 1 }} 
      justifyContent="flex-start"
      sx={{ width: '100%' }}
    >
      <Button
        startIcon={<Iconify icon="eva:eye-outline" sx={{ width: { xs: 14, sm: 16 }, height: { xs: 14, sm: 16 } }} />}
        size="small"
        onClick={() => router.push(paths.dashboard.creator.invoiceDetail(invoice.id))}
        sx={{
          px: { xs: 1, sm: 1.5 },
          py: { xs: 0.5, sm: 0.75 },
          minHeight: { xs: '28px', sm: '32px' },
          height: { xs: '28px', sm: '32px' },
          minWidth: 'fit-content',
          color: '#666666',
          bgcolor: '#ffffff',
          fontSize: { xs: '0.75rem', sm: '0.8rem' },
          fontWeight: 600,
          borderRadius: 0.75,
          textTransform: 'none',
          position: 'relative',
          border: '1px solid #e0e0e0',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '1px',
            left: '1px',
            right: '1px',
            bottom: '1px',
            borderRadius: 0.75,
            backgroundColor: 'transparent',
          },
          '&:hover::before': {
            backgroundColor: 'rgba(102, 102, 102, 0.08)',
          },
          '&:hover': {
            bgcolor: '#eeeeee',
            color: '#555555',
            borderColor: '#d0d0d0',
          },
          '&:focus': {
            outline: 'none',
          },
        }}
      >
        View
      </Button>
      <Button
        startIcon={<Iconify icon="eva:external-link-outline" sx={{ width: { xs: 14, sm: 16 }, height: { xs: 14, sm: 16 } }} />}
        size="small"
        onClick={() => router.push(paths.dashboard.campaign.creator.detail(invoice.campaignId))}
        sx={{
          px: { xs: 1, sm: 1.5 },
          py: { xs: 0.5, sm: 0.75 },
          minHeight: { xs: '28px', sm: '32px' },
          height: { xs: '28px', sm: '32px' },
          minWidth: 'fit-content',
          color: '#666666',
          bgcolor: '#f5f5f5',
          fontSize: { xs: '0.75rem', sm: '0.8rem' },
          fontWeight: 600,
          borderRadius: 0.75,
          textTransform: 'none',
          position: 'relative',
          border: '1px solid #e0e0e0',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '1px',
            left: '1px',
            right: '1px',
            bottom: '1px',
            borderRadius: 0.75,
            backgroundColor: 'transparent',
          },
          '&:hover::before': {
            backgroundColor: 'rgba(102, 102, 102, 0.08)',
          },
          '&:hover': {
            bgcolor: '#eeeeee',
            color: '#555555',
            borderColor: '#d0d0d0',
          },
          '&:focus': {
            outline: 'none',
          },
        }}
      >
        Campaign
      </Button>
    </Stack>
  );

  if (!invoices || invoices.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 8,
          color: '#9ca3af',
        }}
      >
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          No invoices found
        </Typography>
      </Box>
    );
  }

  // Mobile Card View
  if (isMobile) {
    return (
      <Box>
        {invoices.map((invoice) => (
          <StyledCard key={invoice.id}>
            <Stack spacing={2}>
              {/* Header with Invoice ID and Status */}
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600,
                    }}
                  >
                    Invoice ID
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: '#374151',
                      mt: 0.25,
                    }}
                  >
                    {invoice.invoiceNumber}
                  </Typography>
                </Box>
                {renderStatusBadge(invoice.status)}
              </Stack>

              <Divider sx={{ borderColor: '#f0f0f0' }} />

              {/* Campaign Info */}
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#6b7280',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: 600,
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Campaign
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={invoice.campaign?.company?.logo ?? invoice.campaign?.brand?.logo}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: '#f3f4f6',
                      color: '#9ca3af',
                    }}
                  />
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: '#111827',
                        mb: 0.25,
                      }}
                    >
                      {invoice.campaign?.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#6b7280',
                      }}
                    >
                      {invoice.campaign?.company?.name ?? invoice.campaign?.brand?.name}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {/* Amount and Date */}
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600,
                    }}
                  >
                    Amount
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: '#111827',
                      mt: 0.25,
                    }}
                  >
                    RM {new Intl.NumberFormat('en-MY', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(invoice.amount)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6b7280',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      fontWeight: 600,
                    }}
                  >
                    Issue Date
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#374151',
                      mt: 0.25,
                    }}
                  >
                    {dayjs(invoice.createdAt).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
              </Stack>

              <Divider sx={{ borderColor: '#f0f0f0' }} />

              {/* Actions */}
              {renderActionButtons(invoice)}
            </Stack>
          </StyledCard>
        ))}
      </Box>
    );
  }

  // Desktop Table View
  return (
    <Box>
      <StyledTableContainer>
        <Table>
          <StyledTableHead>
            <TableRow>
              <TableCell>Invoice ID</TableCell>
              <TableCell>Campaign</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </StyledTableHead>
          <TableBody>
            {invoices.map((invoice) => (
              <StyledTableRow key={invoice.id}>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: '#374151',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    }}
                  >
                    {invoice.invoiceNumber}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center">
                    <Avatar
                      src={invoice.campaign?.company?.logo ?? invoice.campaign?.brand?.logo}
                      sx={{
                        width: { xs: 32, sm: 36 },
                        height: { xs: 32, sm: 36 },
                        bgcolor: '#f3f4f6',
                        color: '#9ca3af',
                      }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: '#111827',
                          mb: 0.25,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {invoice.campaign?.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#6b7280',
                          fontSize: { xs: '0.7rem', sm: '0.75rem' },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'block',
                        }}
                      >
                        {invoice.campaign?.company?.name ?? invoice.campaign?.brand?.name}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#374151',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {dayjs(invoice.createdAt).format('MMM DD, YYYY')}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#111827',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      whiteSpace: 'nowrap',
                    }}
                  >
                    RM {new Intl.NumberFormat('en-MY', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(invoice.amount)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {renderStatusBadge(invoice.status)}
                </TableCell>
                <TableCell>
                  {renderActionButtons(invoice)}
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </StyledTableContainer>
    </Box>
  );
};

InvoiceLists.propTypes = {
  invoices: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      invoiceNumber: PropTypes.string,
      campaignId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      amount: PropTypes.number,
      status: PropTypes.string,
      createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      campaign: PropTypes.shape({
        name: PropTypes.string,
        company: PropTypes.shape({
          name: PropTypes.string,
          logo: PropTypes.string,
        }),
        brand: PropTypes.shape({
          name: PropTypes.string,
          logo: PropTypes.string,
        }),
      }),
    })
  ),
};

InvoiceLists.defaultProps = {
  invoices: [],
};

export default InvoiceLists;
