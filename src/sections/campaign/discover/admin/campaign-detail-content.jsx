import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import {
  Box,
  List,
  Stack,
  Paper,
  Table,
  Button,
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

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

const CampaignDetailContent = ({ campaign }) => {
  const pdf = useBoolean();

  const renderGallery =
    campaign?.campaignBrief?.images.length < 2 ? (
      <Image
        src={campaign?.campaignBrief?.images[0]}
        alt="test"
        ratio="16/9"
        sx={{ borderRadius: 2, cursor: 'pointer' }}
      />
    ) : (
      <Box
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
        gap={1}
        mb={5}
      >
        <Image
          src={campaign?.campaignBrief?.images[0]}
          alt="test"
          ratio="1/1"
          sx={{ borderRadius: 2, cursor: 'pointer' }}
        />
        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={1}>
          {campaign?.campaignBrief?.images.slice(1).map((elem, index) => (
            <Image
              key={index}
              src={elem}
              alt="test"
              ratio="1/1"
              sx={{ borderRadius: 2, cursor: 'pointer' }}
            />
          ))}
        </Box>
      </Box>
    );

  const renderOverview = (
    <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
      <Stack direction="row" spacing={1} alignItems="start">
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
      </Stack>
    </Box>
  );

  // const formatDays = (days) => (days === 1 ? 'day' : 'days');

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
        <Typography variant="subtitle2">{campaign?.campaignBrief.objectives}</Typography>
      </Stack>

      <Divider
        sx={{
          borderStyle: 'dashed',
        }}
      />

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

        <Stack gap={1.5}>
          <Typography variant="h5">Agreement Form</Typography>
          <Button variant="contained" onClick={pdf.onToggle}>
            {pdf.value ? 'Collapse' : 'View'}
          </Button>
          {pdf.value && (
            <iframe
              src="https://storage.googleapis.com/app-test-cult-cretive/agreementForm/github-NxTech4021-receipt-2024-07-20.pdf"
              style={{
                borderRadius: 10,
                width: '100%',
                height: 900,
              }}
              title="PDF Viewer"
            />
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default CampaignDetailContent;

CampaignDetailContent.propTypes = {
  campaign: PropTypes.object,
};
