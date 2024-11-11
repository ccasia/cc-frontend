import { mutate } from 'swr';
import PropTypes from 'prop-types';
import { Page, Document } from 'react-pdf';
import { useFormContext } from 'react-hook-form';
import React, { useState, useEffect } from 'react';

import { Box, Alert, Stack, Button, CircularProgress } from '@mui/material';

import { useGetTemplate } from 'src/hooks/use-get-template';

import { endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

import Iconify from 'src/components/iconify';

const CampaignFormUpload = ({ pdfModal }) => {
  const [pages, setPages] = useState();

  const { user } = useAuthContext();
  const { data, isLoading: templateLoading } = useGetTemplate(user?.id);

  const { setValue } = useFormContext();

  useEffect(() => {
    if (!templateLoading && data) {
      setValue('agreementForm', data?.template?.url);
    }
  }, [data, setValue, templateLoading]);

  const refreshPdf = () => {
    mutate(endpoints.agreementTemplate.byId(user?.id));
  };

  return (
    <>
      {templateLoading && (
        <Box display="flex" justifyContent="center">
          <CircularProgress size={30} />
        </Box>
      )}

      {!templateLoading && !data && (
        <>
          <Alert severity="warning" variant="outlined">
            Template Not found
          </Alert>

          <Box textAlign="center" my={4}>
            <Button
              size="medium"
              variant="contained"
              onClick={pdfModal.onTrue}
              startIcon={<Iconify icon="icon-park-outline:agreement" width={20} />}
            >
              Generate a new Agreement Template
            </Button>
          </Box>
        </>
      )}

      {!templateLoading && data && (
        <>
          <Alert severity="success" variant="outlined">
            Template found
          </Alert>

          <Box
            my={2}
            sx={{
              display: 'flex',
              gap: 1,
              justifyContent: 'end',
            }}
          >
            <Button size="small" variant="contained" onClick={refreshPdf}>
              Refresh
            </Button>
            <Button size="small" variant="contained" onClick={pdfModal.onTrue}>
              Regenerate agreement template
            </Button>
          </Box>

          <Box my={4} maxHeight={500} overflow="auto" textAlign="center">
            <Box
              sx={{
                display: 'inline-block',
              }}
            >
              <Document
                file={data?.template?.url}
                onLoadSuccess={({ numPages }) => setPages(numPages)}
              >
                <Stack spacing={2}>
                  {Array(pages)
                    .fill()
                    .map((_, index) => (
                      <Page key={index} pageIndex={index} pageNumber={index + 1} scale={1} />
                    ))}
                </Stack>
              </Document>
            </Box>
          </Box>
        </>
      )}
    </>
  );
};

export default CampaignFormUpload;

CampaignFormUpload.propTypes = {
  pdfModal: PropTypes.object,
};
