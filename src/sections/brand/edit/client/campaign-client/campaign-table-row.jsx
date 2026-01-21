import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Box, Stack, Button, Avatar, TableRow, TableCell, Typography } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';

const dictionary = {
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
};

const findLatestPackage = (packages) => {
  if (packages.length === 0) {
    return null; // Return null if the array is empty
  }

  const latestPackage = packages.reduce((latest, current) => {
    const latestDate = new Date(latest.createdAt);
    const currentDate = new Date(current.createdAt);

    return currentDate > latestDate ? current : latest;
  });

  return latestPackage;
};

function getRemainingTime(createdDate, months) {
  const created = new Date(createdDate);
  const expiryDate = new Date(created);
  expiryDate.setMonth(expiryDate.getMonth() + months);

  const today = new Date();
  const diffTime = expiryDate - today;

  const remainingDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return remainingDays;
}

// eslint-disable-next-line react/prop-types
const HighlightText = ({ text, search }) => {
  if (!search) return <span>{text}</span>;

  const regex = new RegExp(`(${search})`, 'gi'); // Case-insensitive match
  // eslint-disable-next-line react/prop-types
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} style={{ color: 'brown' }}>
            {part}
          </span>
        ) : (
          part.toLowerCase()
        )
      )}
    </span>
  );
};

const CampaignTableRow = ({ row, selected, onEditRow, onSelectRow, onDeleteRow, filter }) => {
  const {
    id,
    campaignId,
    name,
    campaignCredits,
    status,
    rawFootage,
    photos,
    ads,
    campaignBrief,
  } = row;

  // Safely access campaignBrief properties
  const industries = campaignBrief?.industries || null;
  const startDate = campaignBrief?.startDate || null;
  const campaignImage = campaignBrief?.images?.[0] || null;

  const confirm = useBoolean();
  const router = useRouter();

  return (
    <>
      <TableRow
        key={id}
        hover
        selected={selected}
        sx={{
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
          '& td': { borderBottom: '1px solid #EBEBEB' },
        }}
        onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(id))}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar
              src={campaignImage}
              variant="rounded"
              sx={{
                width: 48,
                height: 48,
                mr: 2,
                borderRadius: 1,
                bgcolor: '#f5f5f5',
                flexShrink: 0,
              }}
            >
              <Iconify icon="solar:gallery-bold" width={24} sx={{ color: '#C4CDD5' }} />
            </Avatar>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>
              <HighlightText text={name} search={filter} />
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {campaignId || '-'}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={600} color="primary.main">
            {campaignCredits || 0}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary" noWrap>
            {industries || '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
            {[
              { label: 'UGC', value: true },
              { label: 'Raw', value: rawFootage },
              { label: 'Photos', value: photos },
              { label: 'Ads', value: ads },
            ].map(
              (deliverable) =>
                deliverable.value && (
                  <Label key={deliverable.label} variant="soft" color="default" sx={{ fontSize: 11 }}>
                    {deliverable.label}
                  </Label>
                )
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {dayjs(startDate).format('MMM D, YYYY') || '-'}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography
            variant="caption"
            sx={{
              textTransform: 'uppercase',
              fontWeight: 700,
              display: 'inline-block',
              px: 1.5,
              py: 0.5,
              fontSize: '0.7rem',
              border: '1px solid',
              borderBottom: '3px solid',
              borderRadius: 0.8,
              bgcolor: 'white',
              ...(status === 'ACTIVE' && { color: '#1ABF66', borderColor: '#1ABF66' }),
              ...(status === 'COMPLETED' && { color: '#1340FF', borderColor: '#1340FF' }),
              ...(status === 'DRAFT' && { color: '#8E8E93', borderColor: '#C4CDD5' }),
              ...(!['ACTIVE', 'COMPLETED', 'DRAFT'].includes(status) && {
                color: '#FFA902',
                borderColor: '#FFA902',
              }),
            }}
          >
            {status || '-'}
          </Typography>
        </TableCell>
      </TableRow>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`Are you sure want to delete ${name}?`}
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              onDeleteRow();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
};

export default CampaignTableRow;

CampaignTableRow.propTypes = {
  onDeleteRow: PropTypes.func,
  onEditRow: PropTypes.func,
  onSelectRow: PropTypes.func,
  row: PropTypes.object,
  selected: PropTypes.bool,
  filter: PropTypes.string,
};
