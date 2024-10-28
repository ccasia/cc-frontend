import React from 'react';
import PropTypes from 'prop-types';

import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import useGetDraftInfo from 'src/hooks/use-get-first-draft-for-admin';

import Label from 'src/components/label';

const CampaignDraftSubmissions = ({ campaign }) => {
  const { data, isLoading } = useGetDraftInfo(campaign?.id);

  const rows =
    (campaign &&
      data?.map((creator) => ({
        id: creator.id,
        name: creator.name,
        email: creator.email,
        firstDraft: creator.FirstDraft[0],
        finalDraft: creator.FinalDraft[0],
      }))) ||
    [];

  const columns = [
    { field: 'name', headerName: 'Name', width: 150, flex: 1 },
    { field: 'email', headerName: 'Email', width: 150, flex: 1 },
    {
      field: 'firstDraft',
      headerName: 'First Draft',
      width: 150,
      flex: 1,
      renderCell: (params) =>
        params.value ? (
          <Label color="success">{params.value.status}</Label>
        ) : (
          <Label>NOT_STARTED</Label>
        ),
    },
    {
      field: 'finalDraft',
      headerName: 'Final Draft',
      width: 150,
      flex: 1,
      renderCell: (params) =>
        params.value ? (
          <Label color="success">{params.value.status}</Label>
        ) : (
          <Label>NOT_STARTED</Label>
        ),
    },
  ];
  return (
    <Box sx={{ height: 400, width: '100%' }}>
      {!isLoading && <DataGrid rows={rows} columns={columns} />}
    </Box>
  );
};

export default CampaignDraftSubmissions;

CampaignDraftSubmissions.propTypes = {
  campaign: PropTypes.any,
};
