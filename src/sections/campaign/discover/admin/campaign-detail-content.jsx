import dayjs from 'dayjs';
import { pdfjs } from 'react-pdf';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

import {
  Box,
  List,
  Chip,
  Stack,
  Paper,
  Table,
  Avatar,
  Divider,
  ListItem,
  TableRow,
  TableHead,
  TableCell,
  TableBody,
  Typography,
  ListItemIcon,
  ListItemText,
  TableContainer,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import Carousel from 'src/components/carousel/carousel';
import { MultiFilePreview } from 'src/components/upload';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const ChipStyle = {
  bgcolor: '#e4e4e4',
  color: '#636366',
  borderRadius: 16,
  '& .MuiChip-label': {
    fontWeight: 700,
    px: 1.5,
    py: 0.5,
  },
  '&:hover': { bgcolor: '#e4e4e4' },
};

const CampaignDetailContent = ({ campaign }) => {
  const pdf = useBoolean();
  const [pages, setPages] = useState();

  const renderGallery = (
    <Box>
      <Carousel images={campaign?.campaignBrief?.images} />
    </Box>
  );

  const renderOverview = (
    <Box display="grid" gridTemplateColumns="repeat(1, 1fr)" gap={2}>
      {/* <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary={`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} alignItems="start">
        <Iconify icon="mdi:clock" width={18} />
        <Stack>
          <ListItemText
            primary="Durations"
            secondary="4 days 3 nights"
            primaryTypographyProps={{
              typography: 'body2',
              color: 'text.secondary',
              mb: 0.5,
            }}
            secondaryTypographyProps={{
              typography: 'subtitle2',
              color: 'text.primary',
              component: 'span',
            }}
          />
        </Stack>
      </Stack> */}

      <Stack spacing={2} sx={{ mt: 1 }} direction="row" justifyContent="space-between">
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
              src={campaign?.company?.logo}
              alt={campaign?.company?.name}
              sx={{
                width: 36,
                height: 36,
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            />
            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
              {campaign?.company?.name || 'Company Name'}
            </Typography>
          </Stack>
        </Box>

        {/* Duration & Industry */}
        <Box>
          <Typography
            variant="body2"
            sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
          >
            Duration
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
            {`${dayjs(campaign?.campaignBrief?.startDate).format('LL')} - ${dayjs(campaign?.campaignBrief?.endDate).format('LL')}`}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="body2"
            sx={{ color: '#8e8e93', mb: 0.5, fontWeight: 650, fontSize: '0.8rem' }}
          >
            Industry
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={campaign?.campaignBrief?.industries || 'Not specified'}
              size="small"
              sx={{ ...ChipStyle, height: 24, '& .MuiChip-label': { fontSize: '0.8rem' } }}
            />
          </Box>
        </Box>
      </Stack>
    </Box>
  );

  const renderInformation = (
    <Stack spacing={5}>
      <ListItemText
        primary={campaign?.name}
        secondary={campaign?.description}
        primaryTypographyProps={{ variant: 'h4' }}
        secondaryTypographyProps={{ variant: 'subtitle2' }}
      />

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      {renderOverview}

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      <Stack gap={1.5}>
        <Typography variant="h5">Objectives</Typography>
        <Typography variant="subtitle2">{campaign?.campaignBrief?.objectives}</Typography>
      </Stack>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

      {campaign?.campaignBrief?.campaigns_do?.length < 1 && (
        <Stack direction="column">
          <Typography variant="h5">Campaign Do&apos;s</Typography>
          <List>
            {campaign?.campaignBrief?.campaigns_do.map((item, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Iconify icon="octicon:dot-16" sx={{ color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary={item.value} />
              </ListItem>
            ))}
          </List>
        </Stack>
      )}

      {campaign?.campaignBrief?.campaigns_dont.length < 1 && (
        <>
          <Stack direction="column">
            <Typography variant="h5">Campaign Dont&apos;s</Typography>
            <List>
              {campaign?.campaignBrief?.campaigns_dont.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Iconify icon="octicon:dot-16" sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText primary={item.value} />
                </ListItem>
              ))}
            </List>
          </Stack>

          <Divider
            sx={{
              borderStyle: 'dashed',
            }}
          />
        </>
      )}

      <Stack>
        <Typography variant="h5">Campaign timeline</Typography>
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timeline Name</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Campaign Start Date</TableCell>
                <TableCell>{dayjs(campaign?.campaignBrief?.startDate).format('ddd LL')}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
              {campaign &&
                campaign?.campaignTimeline
                  .sort((a, b) => a.order - b.order)
                  .map((timeline) => (
                    <TableRow key={timeline?.id}>
                      <TableCell>{timeline?.name}</TableCell>
                      <TableCell>{dayjs(timeline.startDate).format('ddd LL')}</TableCell>
                      <TableCell>{dayjs(timeline.endDate).format('ddd LL')}</TableCell>
                    </TableRow>
                  ))}
              <TableRow>
                <TableCell>Campaign End Date</TableCell>
                <TableCell>-</TableCell>
                <TableCell>{dayjs(campaign?.campaignBrief?.endDate).format('ddd LL')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Stack>
  );

  const renderAttachmentFiles = (
    <Box>
      <Typography variant="h5">Attachments</Typography>
      <MultiFilePreview
        files={
          campaign?.campaignBrief?.otherAttachments.length > 0
            ? // eslint-disable-next-line no-unsafe-optional-chaining
              [...campaign?.campaignBrief?.otherAttachments, campaign?.campaignBrief?.agreementFrom]
            : [campaign?.campaignBrief?.agreementFrom]
        }
        thumbnail
      />
    </Box>
  );

  return (
    <>
      {renderGallery}

      <Stack maxWidth={720} mx="auto" spacing={2} mt={2}>
        {renderInformation}

        <Divider
          sx={{
            borderStyle: 'dashed',
            my: 2,
          }}
        />

        {renderAttachmentFiles}

        {/* <Stack gap={1.5}>
          <Typography variant="h5">Agreement Form</Typography>
          <Button variant="contained" onClick={pdf.onToggle}>
            {pdf.value ? 'Collapse' : 'View'}
          </Button>
          <Collapse in={pdf.value}>
            <Box my={4} maxHeight={500} overflow="auto" textAlign="center">
              <Box
                sx={{
                  display: 'inline-block',
                }}
              >
                {campaign?.campaignBrief?.agreementFrom && (
                  <Document
                    file={campaign?.campaignBrief?.agreementFrom}
                    onLoadSuccess={({ numPages }) => setPages(numPages)}
                    renderMode="canvas"
                  >
                    <Stack spacing={2}>
                      {pages &&
                        Array.from({ length: pages }, (_, index) => (
                          <Page
                            key={index}
                            pageIndex={index}
                            pageNumber={index + 1}
                            scale={1}
                            renderTextLayer={false}
                          />
                        ))}
                    </Stack>
                  </Document>
                )}
              </Box>
            </Box>
          </Collapse>
        </Stack> */}
      </Stack>
    </>
  );
};

export default CampaignDetailContent;

CampaignDetailContent.propTypes = {
  campaign: PropTypes.any,
};
