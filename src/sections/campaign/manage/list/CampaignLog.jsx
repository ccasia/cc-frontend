/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
import { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Tab,
  Tabs,
  Table,
  Paper,
  Stack,
  Dialog,
  Avatar,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  IconButton,
  DialogTitle,
  DialogContent,
} from '@mui/material';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';

export const CampaignLog = ({ open, campaign, onClose }) => {
  const [currentTab, setCurrentTab] = useState('all');

  const allRows =
    campaign &&
    campaign.campaignLogs
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort by date descending (latest first)
      .map((log) => ({
        id: log.id,
        datePerformed: dayjs(log.createdAt).format('MMM D, YYYY • h:mm A'),
        action: log.message,
        performedBy: log.admin.name,
      }));

  // Filter invoice-related logs
  const invoiceRows =
    allRows?.filter(
      (row) =>
        row.action.toLowerCase().includes('invoice') &&
        !row.action.toLowerCase().includes('during withdrawal') && // Exclude withdrawal-related invoice logs
        (row.action.toLowerCase().includes('deleted invoice') ||
          row.action.toLowerCase().includes('approved invoice') ||
          row.action.toLowerCase().includes('was generated'))
    ) || [];

  // Filter creator activity logs
  const creatorRows =
    allRows
      ?.filter(
        (row) =>
          row.action.includes('pitched for') ||
          row.action.includes('submitted the Agreement') ||
          row.action.includes('submitted First Draft') ||
          row.action.includes('submitted Final Draft') ||
          row.action.includes('submitted Posting Link')
      )
      .map((row) => {
        // Extract submission type from the action text
        let submissionType = 'Unknown';
        if (row.action.includes('pitched for')) {
          submissionType = 'Pitch';
        } else if (row.action.includes('submitted the Agreement')) {
          submissionType = 'Agreement';
        } else if (row.action.includes('submitted First Draft')) {
          submissionType = 'First Draft';
        } else if (row.action.includes('submitted Final Draft')) {
          submissionType = 'Final Draft';
        } else if (row.action.includes('submitted Posting Link')) {
          submissionType = 'Posting Link';
        }

        return {
          ...row,
          submissionType,
        };
      }) || [];

  // Filter admin activity logs
  const adminRows =
    (
      allRows?.filter(
        (row) =>
          (row.action.includes('approved') &&
            (row.action.includes('pitch') ||
              row.action.includes('Agreement') ||
              row.action.includes('First Draft') ||
              row.action.includes('Final Draft') ||
              row.action.includes('Posting Link'))) ||
          (row.action.includes('rejected') && row.action.includes('pitch')) ||
          row.action.includes('sent the Agreement to') ||
          (row.action.includes('withdrew') && row.action.includes('from the campaign')) ||
          row.action.includes('requested changes on') ||
          row.action.includes('requested changes to') ||
          row.action.includes('changed the amount from') ||
          row.action.includes('resent the Agreement to') ||
          (row.action.includes('created') && !row.action.includes('Created the Campaign')) ||
          row.action.includes('edited the Campaign Details')
      ) || []
    ).map((row) => {
      // Extract submission type from the action text
      let submissionType = 'Unknown';

      if (row.action.includes('pitch')) {
        submissionType = 'Pitch';
      } else if (row.action.includes('Agreement')) {
        submissionType = 'Agreement';
      } else if (row.action.includes('First Draft')) {
        submissionType = 'First Draft';
      } else if (row.action.includes('Final Draft')) {
        submissionType = 'Final Draft';
      } else if (row.action.includes('Posting Link')) {
        submissionType = 'Posting Link';
      } else if (row.action.includes('withdrew')) {
        submissionType = 'Withdrawal';
      } else if (row.action.includes('created') || row.action.includes('edited')) {
        submissionType = 'Campaign';
      } else if (row.action.includes('changed the amount')) {
        submissionType = 'Agreement';
      } else if (row.action.includes('requested changes')) {
        if (row.action.includes('First Draft')) {
          submissionType = 'First Draft';
        } else if (row.action.includes('Final Draft')) {
          submissionType = 'Final Draft';
        } else if (row.action.includes('Posting Link')) {
          submissionType = 'Posting Link';
        } else if (row.action.includes('Agreement')) {
          submissionType = 'Agreement';
        }
      }

      return {
        ...row,
        submissionType,
      };
    }) || [];

  const getRows = () => {
    switch (currentTab) {
      case 'invoice':
        return invoiceRows;
      case 'creator':
        return creatorRows;
      case 'admin':
        return adminRows;
      default:
        return allRows;
    }
  };

  const rows = getRows();

  const campaignImage = campaign?.campaignBrief?.images?.[0] || '';

  // fallback
  const getFirstLetter = (name) => (name ? name.charAt(0).toUpperCase() : 'C');

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: { xs: 1, sm: 2 },
          boxShadow: (theme) => theme.customShadows.dialog,
          overflow: 'hidden',
        },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          backgroundColor: 'white',
          borderBottom: '2px solid #e9ecef',
          color: 'black',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            color: '#495057',
            '&:hover': {
              color: '#212529',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <Iconify icon="eva:close-fill" width={20} />
        </IconButton>

        <DialogTitle sx={{ pt: 4, pb: 3, pr: 6 }}>
          <Stack direction="row" spacing={3} alignItems="center">
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {campaignImage ? (
                <Box
                  sx={{
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: -4,
                      left: -4,
                      right: -4,
                      bottom: -4,
                      backgroundColor: '#f8f9fa',
                      borderRadius: 2,
                      zIndex: 0,
                      border: '1px solid #e9ecef',
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={campaignImage}
                    alt={campaign?.name || 'Campaign'}
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 1.5,
                      objectFit: 'cover',
                      border: '2px solid #e9ecef',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      zIndex: 1,
                    }}
                  />
                </Box>
              ) : (
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    backgroundColor: '#f8f9fa',
                    color: '#212529',
                    fontWeight: 'bold',
                    fontSize: 28,
                    border: '2px solid #e9ecef',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {getFirstLetter(campaign?.name)}
                </Avatar>
              )}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: 'InterDisplay, sans-serif',
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    color: '#212529',
                  }}
                >
                  Campaign Activity Log
                </Typography>
                <Box
                  sx={{
                    backgroundColor: '#f8f9fa',
                    borderRadius: 2,
                    px: 2,
                    py: 0.5,
                    border: '1px solid #e9ecef',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#495057',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {allRows?.length || 0} Total Actions
                  </Typography>
                </Box>
              </Stack>

              {campaign?.name && (
                <Typography
                  variant="body1"
                  sx={{
                    color: '#6c757d',
                    fontWeight: 500,
                    fontSize: '1rem',
                  }}
                >
                  {campaign.name}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogTitle>

        {/* Clean Tabs Section */}
        <Box sx={{ px: 3, pb: 3 }}>
          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              borderRadius: 2,
              p: 1,
              border: '1px solid #e9ecef',
            }}
          >
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  minHeight: 48,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: '#6c757d',
                  borderRadius: 1.5,
                  margin: '4px',
                  transition: 'all 0.2s ease-in-out',
                  flex: 1,
                  '&.Mui-selected': {
                    color: '#212529',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    fontWeight: 700,
                    border: '1px solid #e9ecef',
                  },
                  '&:hover:not(.Mui-selected)': {
                    backgroundColor: '#e9ecef',
                    color: '#495057',
                  },
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
                '& .MuiTabs-flexContainer': {
                  gap: 1,
                },
              }}
            >
              <Tab
                label={`All (${allRows?.length || 0})`}
                value="all"
                icon={<Iconify icon="solar:list-bold" width={18} />}
                iconPosition="start"
              />
              <Tab
                label={`Invoice (${invoiceRows?.length || 0})`}
                value="invoice"
                icon={<Iconify icon="solar:bill-list-bold" width={18} />}
                iconPosition="start"
              />
              <Tab
                label={`Creator (${creatorRows?.length || 0})`}
                value="creator"
                icon={<Iconify icon="solar:user-bold" width={18} />}
                iconPosition="start"
              />
              <Tab
                label={`Admin (${adminRows?.length || 0})`}
                value="admin"
                icon={<Iconify icon="solar:shield-user-bold" width={18} />}
                iconPosition="start"
              />
            </Tabs>
          </Box>
        </Box>
      </Paper>

      <DialogContent sx={{ p: 0, backgroundColor: '#ffffff' }}>
        <Scrollbar sx={{ maxHeight: '60vh', minHeight: '60vh' }}>
          {rows?.length > 0 ? (
            <Box>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      width={currentTab === 'creator' || currentTab === 'admin' ? '25%' : '30%'}
                      sx={{
                        pl: 2,
                        py: 2,
                        fontWeight: 700,
                        color: '#000000',
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #e9ecef',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      🕐 Date & Time
                    </TableCell>
                    {(currentTab === 'creator' || currentTab === 'admin') && (
                      <TableCell
                        width="15%"
                        sx={{
                          py: 2,
                          fontWeight: 700,
                          color: '#000000',
                          backgroundColor: '#f8f9fa',
                          borderBottom: '2px solid #e9ecef',
                          fontSize: '0.8rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        🏷️ Type
                      </TableCell>
                    )}
                    <TableCell
                      width={currentTab === 'creator' || currentTab === 'admin' ? '38%' : '50%'}
                      sx={{
                        py: 2,
                        fontWeight: 700,
                        color: '#000000',
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #e9ecef',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      ⚡ Action
                    </TableCell>
                    <TableCell
                      width={currentTab === 'creator' || currentTab === 'admin' ? '22%' : '20%'}
                      sx={{
                        pr: 2,
                        py: 2,
                        fontWeight: 700,
                        color: '#000000',
                        backgroundColor: '#f8f9fa',
                        borderBottom: '2px solid #e9ecef',
                        fontSize: '0.8rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      👤 Performed By
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row, index) => {
                    // Select icon based on action type with varied colors
                    let actionIcon = 'solar:info-circle-bold';
                    let actionColor = '#6b7280';

                    if (
                      row.action.toLowerCase().includes('created') ||
                      row.action.toLowerCase().includes('generated')
                    ) {
                      actionIcon = 'solar:add-circle-bold';
                      actionColor = '#10b981';
                    } else if (row.action.toLowerCase().includes('updated')) {
                      actionIcon = 'solar:pen-bold';
                      actionColor = '#f59e0b';
                    } else if (
                      row.action.toLowerCase().includes('deleted') ||
                      row.action.toLowerCase().includes('removed')
                    ) {
                      actionIcon = 'solar:trash-bin-minimalistic-bold';
                      actionColor = '#ef4444';
                    } else if (row.action.toLowerCase().includes('approved')) {
                      actionIcon = 'solar:check-circle-bold';
                      actionColor = '#10b981';
                    } else if (row.action.toLowerCase().includes('rejected')) {
                      actionIcon = 'solar:close-circle-bold';
                      actionColor = '#ef4444';
                    } else if (row.action.toLowerCase().includes('requested changes')) {
                      actionIcon = 'solar:refresh-circle-bold';
                      actionColor = '#f59e0b';
                    } else if (row.action.toLowerCase().includes('shortlisted')) {
                      actionIcon = 'solar:star-bold';
                      actionColor = '#fbbf24';
                    } else if (row.action.toLowerCase().includes('invoice')) {
                      actionIcon = 'solar:bill-list-bold';
                      actionColor = '#8b5cf6';
                    } else if (row.action.toLowerCase().includes('submitted')) {
                      actionIcon = 'solar:upload-bold';
                      actionColor = '#3b82f6';
                    }

                    return (
                      <TableRow
                        key={row.id}
                        sx={{
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: '#f8f9fa',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          },
                          '&:last-of-type td': {
                            borderBottom: 0,
                          },
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                        }}
                      >
                        <TableCell
                          sx={{
                            pl: 2,
                            py: 1.5,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <Box
                            sx={{
                              backgroundColor: '#f8f9fa',
                              borderRadius: 1.5,
                              px: 1.5,
                              py: 0.75,
                              border: '1px solid #e9ecef',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#212529',
                                fontWeight: 400,
                                fontSize: '0.8rem',
                              }}
                            >
                              {row.datePerformed}
                            </Typography>
                          </Box>
                        </TableCell>

                        {(currentTab === 'creator' || currentTab === 'admin') && (
                          <TableCell
                            sx={{
                              py: 1.5,
                              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                display: 'inline-block',
                                px: 1.5,
                                py: 0.5,
                                fontSize: '0.75rem',
                                borderRadius: 0.8,
                                bgcolor: 'white',
                                border: '1px solid',
                                borderBottom: '3px solid',
                                // Creator activity colors
                                ...(currentTab === 'creator' &&
                                  row.submissionType === 'Agreement' && {
                                    color: '#1976d2',
                                    borderColor: '#1976d2',
                                  }),
                                ...(currentTab === 'creator' &&
                                  row.submissionType === 'First Draft' && {
                                    color: '#ed6c02',
                                    borderColor: '#ed6c02',
                                  }),
                                ...(currentTab === 'creator' &&
                                  row.submissionType === 'Final Draft' && {
                                    color: '#9c27b0',
                                    borderColor: '#9c27b0',
                                  }),
                                ...(currentTab === 'creator' &&
                                  row.submissionType === 'Posting Link' && {
                                    color: '#2e7d32',
                                    borderColor: '#2e7d32',
                                  }),
                                ...(currentTab === 'creator' &&
                                  row.submissionType === 'Pitch' && {
                                    color: '#f57c00',
                                    borderColor: '#f57c00',
                                  }),
                                // Admin activity colors
                                ...(currentTab === 'admin' &&
                                  row.submissionType === 'Agreement' && {
                                    color: '#1976d2',
                                    borderColor: '#1976d2',
                                  }),
                                ...(currentTab === 'admin' &&
                                  row.submissionType === 'First Draft' && {
                                    color: '#ed6c02',
                                    borderColor: '#ed6c02',
                                  }),
                                ...(currentTab === 'admin' &&
                                  row.submissionType === 'Final Draft' && {
                                    color: '#9c27b0',
                                    borderColor: '#9c27b0',
                                  }),
                                ...(currentTab === 'admin' &&
                                  row.submissionType === 'Posting Link' && {
                                    color: '#2e7d32',
                                    borderColor: '#2e7d32',
                                  }),
                                ...(currentTab === 'admin' &&
                                  row.submissionType === 'Pitch' && {
                                    color: '#f57c00',
                                    borderColor: '#f57c00',
                                  }),
                                ...(currentTab === 'admin' &&
                                  row.submissionType === 'Withdrawal' && {
                                    color: '#f44336',
                                    borderColor: '#f44336',
                                  }),
                                ...(currentTab === 'admin' &&
                                  row.submissionType === 'Campaign' && {
                                    color: '#673ab7',
                                    borderColor: '#673ab7',
                                  }),
                              }}
                            >
                              {row.submissionType}
                            </Typography>
                          </TableCell>
                        )}

                        <TableCell
                          sx={{
                            py: 1.5,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: `linear-gradient(45deg, ${actionColor}15, ${actionColor}08)`,
                                border: `2px solid ${actionColor}30`,
                                color: actionColor,
                              }}
                            >
                              <Iconify icon={actionIcon} width={16} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              {(() => {
                                const actionText = row.action;

                                // Check if this is a creator activity
                                if (actionText.toLowerCase().includes('creator')) {
                                  // Extract creator name from quotes
                                  const creatorMatch = actionText.match(/Creator "([^"]+)"/);
                                  if (creatorMatch) {
                                    const creatorName = creatorMatch[1];
                                    const beforeCreator = actionText.substring(
                                      0,
                                      creatorMatch.index
                                    );
                                    const afterCreator = actionText.substring(
                                      creatorMatch.index + creatorMatch[0].length
                                    );

                                    return (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          lineHeight: 1.4,
                                          fontSize: '0.875rem',
                                          color: '#212529',
                                        }}
                                      >
                                        {beforeCreator}Creator{' '}
                                        <Typography
                                          component="span"
                                          sx={{
                                            fontWeight: 700,
                                            color: '#000000',
                                            backgroundColor: '#f8f9fa',
                                            px: 0.75,
                                            py: 0.25,
                                            borderRadius: 0.75,
                                            fontSize: '0.875rem',
                                            border: '1px solid #e9ecef',
                                          }}
                                        >
                                          {creatorName}
                                        </Typography>
                                        {afterCreator}
                                      </Typography>
                                    );
                                  }
                                }

                                // For admin activities, make admin names bold
                                if (actionText.toLowerCase().includes('admin')) {
                                  const adminMatch = actionText.match(/Admin "([^"]+)"/);
                                  if (adminMatch) {
                                    const adminName = adminMatch[1];
                                    const beforeAdmin = actionText.substring(0, adminMatch.index);
                                    const afterAdmin = actionText.substring(
                                      adminMatch.index + adminMatch[0].length
                                    );

                                    return (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          lineHeight: 1.4,
                                          fontSize: '0.875rem',
                                          color: '#212529',
                                        }}
                                      >
                                        {beforeAdmin}Admin{' '}
                                        <Typography
                                          component="span"
                                          sx={{
                                            fontWeight: 700,
                                            color: '#000000',
                                            backgroundColor: '#f8f9fa',
                                            px: 0.75,
                                            py: 0.25,
                                            borderRadius: 0.75,
                                            fontSize: '0.875rem',
                                            border: '1px solid #e9ecef',
                                          }}
                                        >
                                          {adminName}
                                        </Typography>
                                        {afterAdmin}
                                      </Typography>
                                    );
                                  }
                                }

                                // Default: return original text
                                return (
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      lineHeight: 1.4,
                                      fontSize: '0.875rem',
                                      color: '#212529',
                                    }}
                                  >
                                    {actionText}
                                  </Typography>
                                );
                              })()}
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell
                          sx={{
                            pr: 2,
                            py: 1.5,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <Box
                            sx={{
                              backgroundColor: '#f8f9fa',
                              borderRadius: 1.5,
                              px: 1.5,
                              py: 0.75,
                              border: '1px solid #e9ecef',
                              textAlign: 'center',
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: '#212529',
                                fontWeight: 400,
                                fontSize: '0.8rem',
                              }}
                            >
                              {row.performedBy}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Box
              sx={{
                p: 4,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                height: '100%',
              }}
            >
              <Box
                sx={{
                  backgroundColor: 'white',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  maxWidth: 380,
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    border: '2px solid #e9ecef',
                  }}
                >
                  <Iconify
                    icon={
                      currentTab === 'invoice'
                        ? 'solar:bill-list-broken'
                        : currentTab === 'creator'
                          ? 'solar:user-broken'
                          : currentTab === 'admin'
                            ? 'solar:shield-user-broken'
                            : 'solar:list-broken'
                    }
                    width={32}
                    height={32}
                    sx={{
                      color: '#495057',
                      opacity: 0.7,
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ color: '#212529', fontWeight: 700, fontSize: '1.1rem' }}
                >
                  {currentTab === 'invoice'
                    ? 'No Invoice Activities 📄'
                    : currentTab === 'creator'
                      ? 'No Creator Activities 👨‍🎨'
                      : currentTab === 'admin'
                        ? 'No Admin Activities 👨‍💼'
                        : 'No Activities Yet 📝'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: '#6c757d', lineHeight: 1.5, fontSize: '0.875rem' }}
                >
                  {currentTab === 'invoice'
                    ? "No invoice-related actions have been recorded for this campaign yet. Once invoices are created or managed, they'll appear here! 💰"
                    : currentTab === 'creator'
                      ? 'No creator-related actions have been recorded for this campaign yet. Creator activities like submissions will show up here! 🎨'
                      : currentTab === 'admin'
                        ? 'No admin-related actions have been recorded for this campaign yet. Admin approvals and changes will be tracked here! ⚡'
                        : 'No activities have been recorded for this campaign yet. All actions will be logged here as they happen! 🚀'}
                </Typography>
              </Box>
            </Box>
          )}
        </Scrollbar>
      </DialogContent>
    </Dialog>
  );
};

CampaignLog.propTypes = {
  open: PropTypes.bool,
  campaign: PropTypes.object,
  onClose: PropTypes.func,
};
