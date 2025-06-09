import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Page, Document } from 'react-pdf';
import { useNavigate } from 'react-router-dom';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

import {
  Box,
  Link,
  Chip,
  Stack,
  Table,
  Dialog,
  Avatar,
  Button,
  Divider,
  Tooltip,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Container,
  Typography,
  TableContainer,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';
import { MultiFilePreview } from 'src/components/upload';

const ChipStyle = {
  bgcolor: '#e3f2fd',
  color: '#1565c0',
  border: '1px solid #bbdefb',
  borderRadius: 0.75,
  height: '28px',
  fontWeight: 600,
  fontSize: '0.75rem',
  '& .MuiChip-label': {
    px: 1.5,
    py: 0.5,
  },
  '&:hover': {
    bgcolor: '#bbdefb',
    transform: 'translateY(-1px)',
  },
  transition: 'all 0.2s ease',
};

const BoxStyle = {
  border: '1px solid #e7e7e7',
  borderRadius: 1,
  p: 0,
  mb: 2,
  width: '100%',
  bgcolor: 'background.paper',
  overflow: 'hidden',
  '& .header': {
    borderBottom: '1px solid #e7e7e7',
    p: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    bgcolor: '#fafbfc',
    minHeight: '56px',
  },
  '& .content': {
    p: 2,
  },
};

const CompactHeaderStyle = {
  border: '1px solid #e7e7e7',
  borderRadius: 1,
  p: 0,
  mb: 2,
  width: '100%',
  bgcolor: 'background.paper',
  overflow: 'hidden',
  '& .header': {
    borderBottom: '1px solid #e7e7e7',
    p: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 1.5,
    bgcolor: '#fafbfc',
    minHeight: '48px',
  },
  '& .content': {
    p: 2,
  },
};

const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  if (string.toLowerCase() === 'f&b') return 'F&B';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
};

const CampaignDetailContent = ({ campaign }) => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const display = useBoolean();
  const [numPages, setNumPages] = useState(null);
  const isSmallScreen = useResponsive('down', 'sm');
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setError] = useState(null);

  const handleChatClick = async (admin) => {
    try {
      const response = await axiosInstance.get(endpoints.threads.getAll);
      const existingThread = response.data.find((thread) => {
        const userIdsInThread = thread.UserThread.map((userThread) => userThread.userId);
        return (
          userIdsInThread.includes(user.id) &&
          userIdsInThread.includes(admin.user.id) &&
          !thread.isGroup
        );
      });

      if (existingThread) {
        navigate(`/dashboard/chat/thread/${existingThread.id}`);
      } else {
        const newThreadResponse = await axiosInstance.post(endpoints.threads.create, {
          title: `Chat between ${user.name} & ${admin.user.name}`,
          description: '',
          userIds: [user.id, admin.user.id],
          isGroup: false,
        });
        navigate(`/dashboard/chat/thread/${newThreadResponse.data.id}`);
      }
    } catch (error) {
      console.error('Error creating or finding chat thread:', error);
    }
  };

  const requirement = campaign?.campaignRequirement;

  const onDocumentLoadSuccess = ({ numPages: num }) => {
    setNumPages(num);
    setPdfLoading(false);
  };

  const onDocumentLoadError = (error) => {
    setError(error);
    setPdfLoading(false);
  };

  return (
    <Container maxWidth={false} disableGutters>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Left Column */}
        <Stack spacing={2} sx={{ flex: { xs: 1, md: 2.5 } }}>
          {/* KWSP Partnership Banner */}
          {campaign?.isKWSPCampaign && (
            <Box
              sx={{
                border: '1.5px solid #0062CD',
                borderBottom: '4px solid #0062CD',
                borderRadius: 1,
                p: 2,
                mb: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Stack spacing={1}>
                <Typography
                  variant="caption"
                  sx={{
                    color: '#0062CD',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.25px',
                  }}
                >
                  Partnered with KWSP i-Saraan
                </Typography>
                <Divider />
                <Typography variant="body2" sx={{ color: '#1a1a1a', fontWeight: 500 }}>
                  Score an extra RM100! T&C&apos;s apply.
                </Typography>
              </Stack>
            </Box>
          )}

          {/* Campaign Info */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:info-circle-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                CAMPAIGN INFO
              </Typography>
            </Box>

            <Box className="content">
              <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#495057' }}>
                {campaign?.description || 'No campaign description available.'}
              </Typography>
            </Box>
          </Box>

          {/* Campaign Demographics */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:users-group-rounded-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                CAMPAIGN DEMOGRAPHICS
              </Typography>
            </Box>

            <Box className="content">
              <Stack direction="row" spacing={4}>
                {/* Left Column */}
                <Stack spacing={2.5} sx={{ flex: 1 }}>
                  {[
                    { label: 'Gender', data: requirement?.gender?.map(capitalizeFirstLetter) },
                    { label: 'Geo Location', data: requirement?.geoLocation },
                    {
                      label: 'Creator Persona',
                      data: requirement?.creator_persona?.map((value) =>
                        value.toLowerCase() === 'f&b' ? 'F&B' : capitalizeFirstLetter(value)
                      ),
                    },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#6c757d',
                          mb: 1,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {item.data?.map((value, idx) => (
                          <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>

                {/* Right Column */}
                <Stack spacing={2.5} sx={{ flex: 1 }}>
                  {[
                    { label: 'Age', data: requirement?.age },
                    { label: 'Language', data: requirement?.language },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#6c757d',
                          mb: 1,
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        {item.label}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {item.data?.map((value, idx) => (
                          <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Campaign Objectives */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:target-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                CAMPAIGN OBJECTIVES
              </Typography>
            </Box>

            <Box className="content">
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Iconify
                  icon="solar:record-circle-bold"
                  sx={{
                    color: '#1340ff',
                    width: 8,
                    height: 8,
                    mt: 1,
                    flexShrink: 0,
                  }}
                />
                <Typography variant="body2" sx={{ lineHeight: 1.6, color: '#495057' }}>
                  {campaign?.campaignBrief?.objectives}
                </Typography>
              </Stack>
            </Box>
          </Box>

          {/* Campaign Do's */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:check-circle-bold"
                sx={{
                  color: '#10b981',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                CAMPAIGN DO&apos;S
              </Typography>
            </Box>

            <Box className="content">
              <Stack spacing={1.5}>
                {campaign?.campaignBrief?.campaigns_do?.map((item, index) => (
                  <Stack key={index} direction="row" spacing={1.5} alignItems="flex-start">
                    {item.value && (
                      <Iconify
                        icon="solar:record-circle-bold"
                        sx={{
                          color: '#10b981',
                          width: 8,
                          height: 8,
                          mt: 1,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography
                      variant={item?.value ? 'body2' : 'caption'}
                      sx={{
                        color: item?.value ? '#495057' : '#6c757d',
                        lineHeight: 1.6,
                      }}
                    >
                      {item?.value || 'No campaign do.'}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Campaign Don'ts */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:close-circle-bold"
                sx={{
                  color: '#dc3545',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                CAMPAIGN DON&apos;TS
              </Typography>
            </Box>

            <Box className="content">
              {campaign?.campaignBrief?.campaigns_dont?.length > 0 ? (
                <Stack spacing={1.5}>
                  {campaign?.campaignBrief?.campaigns_dont?.map((item, index) => (
                    <Stack key={index} direction="row" spacing={1.5} alignItems="flex-start">
                      {item.value && (
                        <Iconify
                          icon="solar:record-circle-bold"
                          sx={{
                            color: '#dc3545',
                            width: 8,
                            height: 8,
                            mt: 1,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <Typography
                        variant={item?.value ? 'body2' : 'caption'}
                        sx={{
                          color: item?.value ? '#495057' : '#6c757d',
                          lineHeight: 1.6,
                        }}
                      >
                        {item?.value || "No campaign don't"}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    py: 2,
                    textAlign: 'center',
                    bgcolor: '#f8f9fa',
                    borderRadius: 0.75,
                    border: '1px dashed #dee2e6',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                    No data found.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Campaign Timeline */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:calendar-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                CAMPAIGN TIMELINE
              </Typography>
            </Box>

            <Box className="content">
              <TableContainer
                sx={{
                  overflow: 'auto',
                  border: '1px solid #e9ecef',
                  borderRadius: 0.75,
                  '&::-webkit-scrollbar': {
                    height: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: '3px',
                  },
                }}
              >
                <Table sx={{ minWidth: { xs: 400, sm: 500 } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          py: 1.5,
                          color: '#495057',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          width: { xs: '40%', sm: '55%' },
                          minWidth: '150px',
                          bgcolor: '#f8f9fa',
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid #e9ecef',
                        }}
                      >
                        Timeline Name
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1.5,
                          color: '#495057',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          width: { xs: '30%', sm: '20%' },
                          minWidth: '120px',
                          bgcolor: '#f8f9fa',
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid #e9ecef',
                        }}
                      >
                        Start Date
                      </TableCell>
                      <TableCell
                        sx={{
                          py: 1.5,
                          color: '#495057',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          width: { xs: '30%', sm: '20%' },
                          minWidth: '120px',
                          bgcolor: '#f8f9fa',
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid #e9ecef',
                        }}
                      >
                        End Date
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#495057' }}
                      >
                        Campaign Start Date
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#495057' }}
                      >
                        {dayjs(campaign?.campaignBrief?.startDate).format('ddd, DD MMM YYYY')}
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6c757d' }}
                      >
                        -
                      </TableCell>
                    </TableRow>
                    {campaign?.campaignTimeline
                      ?.sort((a, b) => a.order - b.order)
                      .map((timeline) => (
                        <TableRow key={timeline?.id}>
                          <TableCell
                            sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#495057' }}
                          >
                            {timeline?.name}
                          </TableCell>
                          <TableCell
                            sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#495057' }}
                          >
                            {dayjs(timeline.startDate).format('ddd, DD MMM YYYY')}
                          </TableCell>
                          <TableCell
                            sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#495057' }}
                          >
                            {dayjs(timeline.endDate).format('ddd, DD MMM YYYY')}
                          </TableCell>
                        </TableRow>
                      ))}
                    <TableRow>
                      <TableCell
                        sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#495057' }}
                      >
                        Campaign End Date
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#6c757d' }}
                      >
                        -
                      </TableCell>
                      <TableCell
                        sx={{ whiteSpace: 'nowrap', fontSize: '0.875rem', color: '#495057' }}
                      >
                        {dayjs(campaign?.campaignBrief?.endDate).format('ddd, DD MMM YYYY')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Stack>

        {/* Right Column */}
        <Stack spacing={2} sx={{ flex: { xs: 1, md: 1 } }}>
          {/* Deliverables */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:box-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                DELIVERABLES
              </Typography>
            </Box>

            <Box className="content">
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { label: 'UGC Videos', value: true },
                  { label: 'Raw Footage', value: campaign?.rawFootage },
                  { label: 'Photos', value: campaign?.photos },
                  { label: 'Ads', value: campaign?.ads },
                  { label: 'Cross Posting', value: campaign?.crossPosting },
                ].map(
                  (deliverable) =>
                    deliverable.value && (
                      <Chip key={deliverable.label} label={deliverable.label} sx={ChipStyle} />
                    )
                )}
              </Box>
            </Box>
          </Box>

          {/* Campaign Admin */}
          <Box sx={CompactHeaderStyle}>
            <Box className="header">
              <Iconify
                icon="solar:user-bold"
                sx={{
                  color: '#1340ff',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                CAMPAIGN ADMIN
              </Typography>
            </Box>

            <Box className="content">
              <Stack spacing={1.5}>
                {campaign?.campaignAdmin?.map((elem) => (
                  <Stack
                    key={elem.id}
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{
                      py: 1,
                      '&:hover': {
                        bgcolor: '#f8f9fa',
                        borderRadius: 0.75,
                        mx: -1,
                        px: 1,
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Avatar
                      src={elem.admin.user.photoURL}
                      sx={{
                        width: 36,
                        height: 36,
                        border: '2px solid #e9ecef',
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#495057',
                      }}
                    >
                      {elem.admin.user.name}
                    </Typography>
                    {elem.admin.user.id === user.id ? (
                      <Chip
                        label="You"
                        sx={{
                          height: 28,
                          minWidth: 60,
                          bgcolor: '#f8f9fa',
                          color: '#6c757d',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          border: '1px solid #e9ecef',
                          borderRadius: 0.75,
                          '&:hover': {
                            bgcolor: '#f8f9fa',
                          },
                        }}
                      />
                    ) : (
                      <Button
                        onClick={() => handleChatClick(elem.admin)}
                        size="small"
                        sx={{
                          bgcolor: '#ffffff',
                          color: '#1340ff',
                          border: '1px solid #1340ff',
                          borderBottom: '3px solid #1340ff',
                          borderRadius: 0.75,
                          px: 2,
                          py: 0.5,
                          height: '28px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          minWidth: '70px',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#f8f9ff',
                            borderColor: '#0f2db8',
                            borderBottomColor: '#0f2db8',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(19, 64, 255, 0.15)',
                          },
                        }}
                      >
                        Message
                      </Button>
                    )}
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Client Info */}
          <Box sx={CompactHeaderStyle}>
            <Box className="header">
              <Iconify
                icon="solar:buildings-bold"
                sx={{
                  color: '#1340ff',
                  width: 18,
                  height: 18,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                CLIENT INFO
              </Typography>
            </Box>

            <Box className="content">
              <Stack spacing={2.5}>
                {/* Client Info */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: '#6c757d',
                      mb: 1,
                      fontWeight: 600,
                      fontSize: '0.875rem',
                    }}
                  >
                    Client
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={campaign?.company?.logo ?? campaign?.brand?.logo}
                      alt={campaign?.company?.name ?? campaign?.brand?.name}
                      sx={{
                        width: 40,
                        height: 40,
                        border: '2px solid #e9ecef',
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#495057' }}
                    >
                      {(campaign?.company?.name ?? campaign?.brand?.name) || 'Company Name'}
                    </Typography>
                  </Stack>
                </Box>

                {/* Additional Company Info */}
                {[
                  {
                    label: 'About',
                    value: campaign?.company?.about || campaign?.brand?.about || 'None',
                  },
                  { label: 'Brand Tone', value: campaign?.brandTone },
                  { label: 'Product / Service Name', value: campaign?.productName },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#6c757d',
                        mb: 1,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontSize: '0.875rem', color: '#495057', lineHeight: 1.5 }}
                    >
                      {item.value || 'Not specified'}
                    </Typography>
                  </Box>
                ))}

                {/* Divider */}
                <Divider sx={{ my: 1 }} />

                {/* Contact & Social Info */}
                {[
                  {
                    label: 'Email',
                    value: campaign?.company?.email || campaign?.brand?.email || 'None',
                  },
                  {
                    label: 'Website',
                    value: campaign?.company?.website ?? campaign?.brand?.website,
                    isLink: true,
                    href: (campaign?.company?.website ?? campaign?.brand?.website)?.startsWith(
                      'http'
                    )
                      ? (campaign?.company?.website ?? campaign?.brand?.website)
                      : `https://${campaign?.company?.website ?? campaign?.brand?.website}`,
                  },
                  {
                    label: 'Instagram',
                    value: campaign?.company?.instagram ?? campaign?.brand?.instagram,
                  },
                  { label: 'TikTok', value: campaign?.company?.tiktok ?? campaign?.brand?.tiktok },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#6c757d',
                        mb: 1,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                      }}
                    >
                      {item.label}
                    </Typography>
                    {item.isLink ? (
                      <Link
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          fontSize: '0.875rem',
                          color: '#1340ff',
                          textDecoration: 'none',
                          fontWeight: 500,
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {item.value || 'Not specified'}
                      </Link>
                    ) : (
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#495057' }}>
                        {item.value || 'Not specified'}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Agreement Form */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:document-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                DELIVERABLES
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {[
                { label: 'UGC Videos', value: true },
                { label: 'Raw Footage', value: campaign?.rawFootage },
                { label: 'Photos', value: campaign?.photos },
                { label: 'Ads', value: campaign?.ads },
                { label: 'Cross Posting', value: campaign?.crossPosting },
              ].map(
                (deliverable) =>
                  deliverable.value && (
                    <Chip
                      key={deliverable.label}
                      label={deliverable.label}
                      size="small"
                      sx={ChipStyle}
                    />
                  )
              )}
            </Box>
          </Box>

          {/* Agreement Form */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:document-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                DELIVERABLES
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {[
                { label: 'UGC Videos', value: true },
                { label: 'Raw Footage', value: campaign?.rawFootage },
                { label: 'Photos', value: campaign?.photos },
                { label: 'Ads', value: campaign?.ads },
                { label: 'Cross Posting', value: campaign?.crossPosting },
              ].map(
                (deliverable) =>
                  deliverable.value && (
                    <Chip
                      key={deliverable.label}
                      label={deliverable.label}
                      size="small"
                      sx={ChipStyle}
                    />
                  )
              )}
            </Box>
          </Box>

          {/* Agreement Form */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:document-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                DELIVERABLES
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {[
                { label: 'UGC Videos', value: true },
                { label: 'Raw Footage', value: campaign?.rawFootage },
                { label: 'Photos', value: campaign?.photos },
                { label: 'Ads', value: campaign?.ads },
                { label: 'Cross Posting', value: campaign?.crossPosting },
              ].map(
                (deliverable) =>
                  deliverable.value && (
                    <Chip
                      key={deliverable.label}
                      label={deliverable.label}
                      size="small"
                      sx={ChipStyle}
                    />
                  )
              )}
            </Box>
          </Box>

          {/* Agreement Form */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:document-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                AGREEMENT FORM
              </Typography>
            </Box>

            <Box className="content">
              <Button
                onClick={display.onTrue}
                variant="contained"
                fullWidth
                sx={{
                  bgcolor: '#1340ff',
                  color: 'white',
                  border: '1px solid #1340ff',
                  borderBottom: '3px solid #0f2db8',
                  borderRadius: 0.75,
                  py: 1.5,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: '#0f2db8',
                    borderBottomColor: '#0a1d7a',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(19, 64, 255, 0.25)',
                  },
                }}
              >
                View Form
              </Button>
            </Box>
          </Box>

          {/* Other Attachments */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:folder-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                OTHER ATTACHMENTS
              </Typography>
            </Box>

            <Box className="content">
              {campaign?.campaignBrief?.otherAttachments?.length > 0 ? (
                <MultiFilePreview files={campaign?.campaignBrief?.otherAttachments} thumbnail />
              ) : (
                <Box
                  sx={{
                    py: 2,
                    textAlign: 'center',
                    bgcolor: '#f8f9fa',
                    borderRadius: 0.75,
                    border: '1px dashed #dee2e6',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                    No attachments
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Reference Links */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="solar:link-bold"
                sx={{
                  color: '#1340ff',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  letterSpacing: '0.25px',
                  textTransform: 'uppercase',
                }}
              >
                REFERENCE LINKS
              </Typography>
            </Box>

            <Box className="content">
              {campaign?.campaignBrief?.referencesLinks?.length > 0 ? (
                <Stack spacing={1.5}>
                  {campaign?.campaignBrief?.referencesLinks?.map((link, index) => (
                    <Stack key={index} direction="row" spacing={1.5} alignItems="center">
                      <Iconify
                        icon="solar:link-circle-bold"
                        sx={{
                          color: '#1340ff',
                          width: 16,
                          height: 16,
                          flexShrink: 0,
                        }}
                      />
                      <Link
                        href={link}
                        target="_blank"
                        sx={{
                          fontSize: '0.875rem',
                          color: '#1340ff',
                          textDecoration: 'none',
                          fontWeight: 500,
                          wordBreak: 'break-all',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        {link}
                      </Link>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Box
                  sx={{
                    py: 2,
                    textAlign: 'center',
                    bgcolor: '#f8f9fa',
                    borderRadius: 0.75,
                    border: '1px dashed #dee2e6',
                  }}
                >
                  <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                    No references found.
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Stack>
      </Stack>

      <Dialog
        open={display.value}
        onClose={display.onFalse}
        fullScreen
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            overflow: 'hidden',
            position: 'relative',
          },
        }}
        sx={{
          zIndex: 9999,
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .MuiDialog-paper': {
            m: 0,
            width: '100%',
            height: '100%',
          },
        }}
      >
        {/* Header Info - Top Left */}
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            left: { xs: 10, md: 20 },
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 1, md: 1.5 },
            borderRadius: '8px',
            p: { xs: 1.5, md: 2 },
            height: { xs: '56px', md: '64px' },
            minWidth: { xs: '200px', md: '240px' },
          }}
        >
          <Box
            sx={{
              width: { xs: 36, md: 40 },
              height: { xs: 36, md: 40 },
              borderRadius: 1,
              bgcolor: '#1340ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify
              icon="solar:document-bold"
              sx={{
                color: 'white',
                width: { xs: 18, md: 20 },
                height: { xs: 18, md: 20 },
              }}
            />
          </Box>
          <Stack spacing={0.5}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#e7e7e7',
                fontSize: { xs: '13px', md: '14px' },
                lineHeight: 1.3,
              }}
            >
              Agreement Form
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#85868E',
                fontSize: { xs: '11px', md: '12px' },
                lineHeight: 1.3,
              }}
            >
              {campaign?.name}
            </Typography>
          </Stack>
        </Box>

        {/* Action Buttons - Top Right */}
        <Stack
          direction="row"
          spacing={{ xs: 0.5, md: 1 }}
          sx={{
            position: 'fixed',
            top: { xs: 10, md: 20 },
            right: { xs: 10, md: 20 },
            zIndex: 10000,
          }}
        >
          {/* Download Button */}
          {campaign?.agreementTemplate?.url && (
            <Tooltip
              title="Download PDF"
              arrow
              placement="bottom"
              PopperProps={{
                sx: {
                  zIndex: 10001,
                },
              }}
              slotProps={{
                tooltip: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.9)',
                    color: 'white',
                    fontSize: { xs: '11px', md: '12px' },
                    fontWeight: 500,
                  },
                },
                arrow: {
                  sx: {
                    color: 'rgba(0, 0, 0, 0.9)',
                  },
                },
              }}
            >
              <Button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = campaign.agreementTemplate.url;
                  link.download = 'agreement-form.pdf';
                  link.click();
                }}
                sx={{
                  minWidth: { xs: '40px', md: '44px' },
                  width: { xs: '40px', md: '44px' },
                  height: { xs: '40px', md: '44px' },
                  p: 0,
                  bgcolor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid #28292C',
                  borderRadius: '8px',
                  fontWeight: 650,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: { xs: '3px', md: '4px' },
                    left: { xs: '3px', md: '4px' },
                    right: { xs: '3px', md: '4px' },
                    bottom: { xs: '3px', md: '4px' },
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    transition: 'background-color 0.2s ease',
                    zIndex: -1,
                  },
                  '&:hover::before': {
                    backgroundColor: '#5A5A5C',
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                  },
                }}
              >
                <Iconify icon="eva:download-fill" width={{ xs: 16, md: 18 }} />
              </Button>
            </Tooltip>
          )}

          {/* Close Button */}
          <Tooltip
            title="Close"
            arrow
            placement="bottom"
            PopperProps={{
              sx: {
                zIndex: 10001,
              },
            }}
            slotProps={{
              tooltip: {
                sx: {
                  bgcolor: 'rgba(0, 0, 0, 0.9)',
                  color: 'white',
                  fontSize: { xs: '11px', md: '12px' },
                  fontWeight: 500,
                },
              },
              arrow: {
                sx: {
                  color: 'rgba(0, 0, 0, 0.9)',
                },
              },
            }}
          >
            <Button
              onClick={display.onFalse}
              sx={{
                minWidth: { xs: '40px', md: '44px' },
                width: { xs: '40px', md: '44px' },
                height: { xs: '40px', md: '44px' },
                p: 0,
                color: '#ffffff',
                border: '1px solid #28292C',
                borderRadius: '8px',
                fontWeight: 650,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: { xs: '3px', md: '4px' },
                  left: { xs: '3px', md: '4px' },
                  right: { xs: '3px', md: '4px' },
                  bottom: { xs: '3px', md: '4px' },
                  borderRadius: '4px',
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  zIndex: -1,
                },
                '&:hover::before': {
                  backgroundColor: '#5A5A5C',
                },
                '&:hover': {
                  bgcolor: 'transparent',
                },
              }}
            >
              <Iconify icon="eva:close-fill" width={{ xs: 20, md: 22 }} />
            </Button>
          </Tooltip>
        </Stack>

        {/* PDF Content */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            pt: { xs: '80px', md: '100px' },
            pb: { xs: 2, md: 3 },
            px: { xs: 2, md: 4 },
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: '90%',
              height: 'calc(100vh - 120px)',
              maxWidth: '1000px',
              bgcolor: 'transparent',
              borderRadius: 2,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              '&::-webkit-scrollbar': {
                width: { xs: '4px', md: '6px' },
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#5A5A5C',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#6A6A6C',
              },
            }}
          >
            {!campaign?.agreementTemplate?.url ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#e7e7e7',
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: 2,
                    border: '2px dashed #5A5A5C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <Iconify
                    icon="solar:document-text-bold"
                    sx={{
                      color: '#85868E',
                      width: 32,
                      height: 32,
                    }}
                  />
                </Box>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#e7e7e7',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  No Agreement Form Available
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#85868E',
                    textAlign: 'center',
                    maxWidth: 300,
                  }}
                >
                  The agreement template for this campaign has not been set up yet.
                </Typography>
              </Box>
            ) : (
              <Document
                file={campaign?.agreementTemplate?.url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      gap: 2,
                    }}
                  >
                    <CircularProgress
                      size={32}
                      sx={{
                        color: '#ffffff',
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#e7e7e7',
                        fontWeight: 500,
                      }}
                    >
                      Loading agreement form...
                    </Typography>
                  </Box>
                }
              >
                {pdfError ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: '#e7e7e7',
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: 2,
                        border: '2px dashed #dc3545',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 3,
                      }}
                    >
                      <Iconify
                        icon="solar:danger-triangle-bold"
                        sx={{
                          color: '#dc3545',
                          width: 32,
                          height: 32,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#dc3545',
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Error Loading PDF
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#85868E',
                        textAlign: 'center',
                        maxWidth: 400,
                      }}
                    >
                      {pdfError.message ||
                        'There was an error loading the agreement form. Please try again later.'}
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={3} sx={{ py: 2, alignItems: 'center' }}>
                    {Array.from(new Array(numPages), (el, index) => (
                      <Box
                        key={`page_${index + 1}`}
                        sx={{
                          bgcolor: '#ffffff',
                          borderRadius: 1,
                          overflow: 'hidden',
                          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                          border: '1px solid #28292C',
                        }}
                      >
                        <Page
                          pageNumber={index + 1}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                          width={isSmallScreen ? window.innerWidth - 64 : 800}
                          scale={1}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Document>
            )}
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
};

CampaignDetailContent.propTypes = {
  campaign: PropTypes.object,
};

export default CampaignDetailContent;
