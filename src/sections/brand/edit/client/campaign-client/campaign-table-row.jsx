import React from 'react';
import dayjs from 'dayjs';
import PropTypes from 'prop-types';

import { Stack, Button, TableRow, TableCell } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import Label from 'src/components/label';
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
          part
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
    campaignBrief: { industries, startDate },
  } = row;

  const confirm = useBoolean();
  const router = useRouter();

  return (
    <>
      <TableRow
        key={id}
        hover
        selected={selected}
        sx={{ cursor: 'pointer' }}
        onClick={() => router.push(paths.dashboard.campaign.adminCampaignDetail(id))}
      >
        <TableCell>
          <Label>
            <HighlightText text={name} search={filter} />
          </Label>
        </TableCell>
        <TableCell>
          <Label>{campaignId || 'None'}</Label>
        </TableCell>
        <TableCell>
          <Label>{campaignCredits || 0}</Label>
        </TableCell>

        <TableCell>
          <Label>{industries || 'None'}</Label>
        </TableCell>

        <TableCell>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {[
              { label: 'UGC Videos', value: true },
              { label: 'Raw Footage', value: rawFootage },
              { label: 'Photos', value: photos },
              { label: 'Ads', value: ads },
            ].map((deliverable) => deliverable.value && <Label>{deliverable.label}</Label>)}
          </Stack>
        </TableCell>

        <TableCell>
          <Label>{dayjs(startDate).format('LL') || 'None'}</Label>
        </TableCell>

        <TableCell>
          <Label>{status || 'None'}</Label>
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
