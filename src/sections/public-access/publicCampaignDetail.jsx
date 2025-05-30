import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

import {
  Box,
  Link,
  Chip,
  List,
  Stack,
  Table,
  Avatar,
  TableRow,
  ListItem,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  ListItemIcon,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import Iconify from 'src/components/iconify';

const ChipStyle = {
  bgcolor: '#FFF',
  border: 1,
  borderColor: '#EBEBEB',
  borderRadius: 1,
  color: '#636366',
  py: 2,
  px: 1,
  boxShadow: '0px -3px 0px 0px #E7E7E7 inset',
  '& .MuiChip-label': {
    fontWeight: 700,
    px: 1.5,
    py: 0.5,
  },
  '&:hover': { bgcolor: '#FFF' },
};

const BoxStyle = {
  border: '1px solid #e0e0e0',
  borderRadius: 2,
  p: 3,
  mt: -1,
  mb: 3,
  width: '100%',
  '& .header': {
    borderBottom: '1px solid #e0e0e0',
    mx: -3,
    mt: -1,
    mb: 2,
    pb: 1.5,
    pt: -1,
    px: 1.8,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
  },
};

const CompactHeaderStyle = {
  ...BoxStyle,
  '& .header': {
    ...BoxStyle['& .header'],
    pb: 1.5,
    minHeight: 'auto',
  },
};

const PublicCampaignDetailContent = ({ campaign }) => {
  const navigate = useNavigate();
  // const { user } = useAuthContext();
  const display = useBoolean();
  const [numPages, setNumPages] = useState(null);
  const isSmallScreen = useResponsive('down', 'sm');
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setError] = useState(null);


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
    <Box
      sx={{
        maxWidth: '100%',
        px: 2,
        mx: 'auto',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Left Column */}
        <Stack spacing={-3} sx={{ flex: { xs: 1, md: 2.5 } }}>
          {/* Demographics Box */}
          <Box sx={{ ...BoxStyle, mt: 1 }}>
            <Box className="header">
              <img
                src="/assets/icons/overview/bluesmileyface.svg"
                alt="Campaign Info"
                style={{
                  width: 20,
                  height: 20,
                  color: '#203ff5',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN INFO
              </Typography>
            </Box>

            <Typography variant="body2">
              {campaign?.description || 'No campaign description available.'}
            </Typography>
          </Box>

          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="mdi:emoticon-happy"
                sx={{
                  color: '#203ff5',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN DEMOGRAPHICS
              </Typography>
            </Box>

            <Stack direction="row" spacing={4}>
              {/* Left Column */}
              <Stack spacing={2} sx={{ flex: 1 }}>
                {[
                  { label: 'Gender', data: requirement?.gender },
                  { label: 'Geo Location', data: requirement?.geoLocation },
                  { label: 'Creator Persona', data: requirement?.creator_persona },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                      {item.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.data?.map((value, idx) => (
                        <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>

              {/* Right Column */}
              <Stack spacing={2} sx={{ flex: 1 }}>
                {[
                  { label: 'Age', data: requirement?.age },
                  { label: 'Language', data: requirement?.language },
                ].map((item) => (
                  <Box key={item.label}>
                    <Typography variant="body2" sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650 }}>
                      {item.label}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.data?.map((value, idx) => (
                        <Chip key={idx} label={value} size="small" sx={ChipStyle} />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Box>

          {/* Objectives Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="mdi:target-arrow"
                sx={{
                  color: '#835cf5',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN OBJECTIVES
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5 }}>
              <Iconify
                icon="octicon:dot-fill-16"
                sx={{
                  color: '#000000',
                  width: 12,
                  height: 12,
                  flexShrink: 0,
                }}
              />
              <Typography variant="body2">{campaign?.campaignBrief?.objectives}</Typography>
            </Stack>
          </Box>

          {/* Do's Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="material-symbols:check-box-outline"
                sx={{
                  color: '#2e6c56',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN DO&apos;S
              </Typography>
            </Box>

            <Stack spacing={1} sx={{ pl: 0.5 }}>
              {campaign?.campaignBrief?.campaigns_do?.map((item, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  {item.value && (
                    <Iconify
                      icon="octicon:dot-fill-16"
                      sx={{
                        color: '#000000',
                        width: 12,
                        height: 12,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Typography variant={item?.value ? 'body2' : 'caption'} sx={{ color: '#221f20' }}>
                    {item?.value || 'No campaign do.'}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Don'ts Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="material-symbols:disabled-by-default-outline"
                sx={{
                  color: '#eb4a26',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN DON&apos;TS
              </Typography>
            </Box>

            {campaign?.campaignBrief?.campaigns_dont?.length > 0 ? (
              <Stack spacing={1} sx={{ pl: 0.5 }}>
                {campaign?.campaignBrief?.campaigns_dont?.map((item, index) => (
                  <Stack key={index} direction="row" spacing={1} alignItems="center">
                    {item.value && (
                      <Iconify
                        icon="octicon:dot-fill-16"
                        sx={{
                          color: '#000000',
                          width: 12,
                          height: 12,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography
                      variant={item?.value ? 'body2' : 'caption'}
                      sx={{ color: '#221f20' }}
                    >
                      {item?.value || "No campaign don't"}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No data found.
              </Typography>
            )}
          </Box>

          {/* Timeline Box */}
          <Box sx={BoxStyle}>
            <Box className="header">
              <img
                src="/assets/icons/overview/yellowCalendar.svg"
                alt="Campaign Timeline"
                style={{
                  width: 20,
                  height: 20,
                  color: '#203ff5',
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                CAMPAIGN TIMELINE
              </Typography>
            </Box>

            <TableContainer
              sx={{
                mt: 2,
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  borderRadius: '4px',
                },
              }}
            >
              <Table sx={{ minWidth: { xs: 400, sm: 500 } }}>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: { xs: '40%', sm: '55%' },
                        minWidth: '150px',
                        borderRadius: '10px 0 0 10px',
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Timeline Name
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: { xs: '30%', sm: '20%' },
                        minWidth: '120px',
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Start Date
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        color: '#221f20',
                        fontWeight: 600,
                        width: { xs: '30%', sm: '20%' },
                        minWidth: '120px',
                        borderRadius: '0 10px 10px 0',
                        bgcolor: '#f5f5f5',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      End Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Campaign Start Date</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {dayjs(campaign?.campaignBrief?.startDate).format('ddd, DD MMM YYYY')}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>-</TableCell>
                  </TableRow>
                  {campaign?.campaignTimeline
                    ?.sort((a, b) => a.order - b.order)
                    .map((timeline) => (
                      <TableRow key={timeline?.id}>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{timeline?.name}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {dayjs(timeline.startDate).format('ddd, DD MMM YYYY')}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {dayjs(timeline.endDate).format('ddd, DD MMM YYYY')}
                        </TableCell>
                      </TableRow>
                    ))}
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Campaign End Date</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>-</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {dayjs(campaign?.campaignBrief?.endDate).format('ddd, DD MMM YYYY')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box sx={BoxStyle}>
            <Box className="header">
              <Iconify
                icon="ep:guide"
                sx={{
                  color: '#203ff5',
                  width: 20,
                  height: 20,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                {'References Links'.toUpperCase()}
              </Typography>
            </Box>

            {campaign?.campaignBrief?.referencesLinks?.length > 0 ? (
              <List>
                {campaign?.campaignBrief?.referencesLinks?.map((link, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <Iconify icon="ix:reference" />
                    </ListItemIcon>
                    <Link key={index} href={link} target="_blank">
                      {link}
                    </Link>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                No references found.
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Right Column */}
        <Stack spacing={-3} sx={{ flex: { xs: 1, md: 1 } }}>
          {/* Campaign Admin Box */}
          <Box sx={{ ...CompactHeaderStyle, mt: 1 }}>
            <Box className="header">
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  lineHeight: 1,
                }}
              >
                CAMPAIGN ADMIN
              </Typography>
            </Box>

            <Stack spacing={1}>
              {campaign?.campaignAdmin?.map((elem) => (
                <Stack
                  key={elem.id}
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  sx={{ py: 0.75 }}
                >
                  <Avatar src={elem.admin.user.photoURL} sx={{ width: 34, height: 34 }} />
                  <Typography
                    variant="body2"
                    sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    {elem.admin.user.name}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Client Info Box */}
          <Box sx={CompactHeaderStyle}>
            <Box className="header">
              <Typography
                variant="body2"
                sx={{
                  color: '#221f20',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  lineHeight: 1,
                }}
              >
                CLIENT INFO
              </Typography>
            </Box>

            <Stack spacing={2} sx={{ mt: 1 }}>
              {/* Client Info */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
                >
                  Client
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    src={campaign?.company?.logo ?? campaign?.brand?.logo}
                    alt={campaign?.company?.name ?? campaign?.brand?.name}
                    sx={{
                      width: 36,
                      height: 36,
                      border: '2px solid',
                      borderColor: 'background.paper',
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                    {(campaign?.company?.name ?? campaign?.brand?.name) || 'Company Name'}
                  </Typography>
                </Stack>
              </Box>

              {/* Additional Company Info */}
              {[
                { label: 'About', value: campaign?.company?.about ?? campaign?.brand?.about },
                { label: 'Brand Tone', value: campaign?.brandTone },
                { label: 'Product / Service Name', value: campaign?.productName },
              ].map((item) => (
                <Box key={item.label}>
                  <Typography
                    variant="body2"
                    sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
                  >
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                    {item.value || 'Not specified'}
                  </Typography>
                </Box>
              ))}

              {/* Add Divider */}
              <Box
                sx={{
                  height: '1px',
                  bgcolor: '#e0e0e0',
                  mx: -0.4, // margin left and right
                  my: 1, // margin top and bottom
                }}
              />

              {/* Continue with remaining items */}
              {[
                { label: 'Email', value: campaign?.company?.email ?? campaign?.brand?.email },
                {
                  label: 'Website',
                  value: campaign?.company?.website ?? campaign?.brand?.website,
                  isLink: true,
                  href: (campaign?.company?.website ?? campaign?.brand?.website)?.startsWith('http')
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
                    sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
                  >
                    {item.label}
                  </Typography>
                  {item.isLink ? (
                    <Link
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: '0.9rem',
                        color: '#203ff5',
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {item.value || 'Not specified'}
                    </Link>
                  ) : (
                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                      {item.value || 'Not specified'}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Box>
  );
};

PublicCampaignDetailContent.propTypes = {
  campaign: PropTypes.object,
};

export default PublicCampaignDetailContent;
