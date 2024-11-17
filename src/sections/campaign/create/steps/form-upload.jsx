import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Page, Document } from 'react-pdf';
import { useFormContext } from 'react-hook-form';

import {
  Box,
  Alert,
  Stack,
  Radio,
  Dialog,
  Button,
  Typography,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';
import { useGetTemplate } from 'src/hooks/use-get-template';

import Iconify from 'src/components/iconify';

const CampaignFormUpload = ({ pdfModal }) => {
  const [pages, setPages] = useState();
  const templateModal = useBoolean();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const lgUp = useResponsive('up', 'sm');

  // const { user } = useAuthContext();

  const { data: templates, templateLoading } = useGetTemplate();

  const { setValue, watch } = useFormContext();

  const agreementUrl = watch('agreementFrom');

  // useEffect(() => {
  //   if (!templateLoading && data) {
  //     setValue('agreementForm', data?.template?.url);
  //   }
  // }, [data, setValue, templateLoading]);

  // const refreshPdf = () => {
  //   mutate(endpoints.agreementTemplate.byId(user?.id));
  // };

  const onSelectAgreement = (template) => {
    setSelectedTemplate(template?.id);
    setValue('agreementFrom', template);
  };

  return (
    <>
      {templateLoading && (
        <Box display="flex" justifyContent="center">
          <CircularProgress size={30} />
        </Box>
      )}

      {!templateLoading && !templates?.length < 0 ? (
        <Alert severity="warning" variant="outlined">
          Template Not found
        </Alert>
      ) : (
        <>
          <Alert severity="success" variant="outlined">
            {templates?.length} templates found
          </Alert>
          <Box sx={{ my: 2, textAlign: 'end' }}>
            <Stack direction="row" spacing={1} justifyContent="end">
              <Button
                size="medium"
                variant="contained"
                onClick={pdfModal.onTrue}
                startIcon={<Iconify icon="icon-park-outline:agreement" width={20} />}
              >
                Create new template
              </Button>
              <Button variant="outlined" onClick={templateModal.onTrue}>
                Select Templates
              </Button>
            </Stack>
          </Box>
        </>
      )}

      {/* <Box textAlign="center" my={4}>
            <Button
              size="medium"
              variant="contained"
              onClick={pdfModal.onTrue}
              startIcon={<Iconify icon="icon-park-outline:agreement" width={20} />}
            >
              Generate a new Agreement Template
            </Button>
          </Box> */}

      {/* {!templateLoading && data && (
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

        </>
      )} */}

      {agreementUrl && (
        <Box
          my={4}
          maxHeight={500}
          overflow="auto"
          textAlign="center"
          sx={{
            scrollbarWidth: 'none',
          }}
        >
          <Box
            sx={{
              display: 'inline-block',
              overflow: 'hidden',
              borderRadius: 2,
              scrollbarWidth: 'none',
            }}
          >
            <Document file={agreementUrl.url} onLoadSuccess={({ numPages }) => setPages(numPages)}>
              <Stack spacing={2}>
                {Array(pages)
                  .fill()
                  .map((_, index) => (
                    <Page
                      key={index}
                      pageIndex={index}
                      pageNumber={index + 1}
                      scale={1}
                      width={lgUp ? 600 : 300}
                    />
                  ))}
              </Stack>
            </Document>
          </Box>
        </Box>
      )}

      <Dialog open={templateModal.value} fullWidth maxWidth="md" onClose={templateModal.onFalse}>
        <DialogTitle>
          <Typography variant="subtitle2" mt={2}>
            You may select one template to be use:
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              },
              columnGap: 1,
              justifyItems: 'center',
              alignItems: 'center',
            }}
          >
            {templateLoading && (
              <Box
                sx={{
                  // position: 'relative',
                  // top: 200,
                  textAlign: 'center',
                }}
              >
                <CircularProgress
                  thickness={7}
                  size={25}
                  sx={{
                    color: (theme) => theme.palette.common.black,
                    strokeLinecap: 'round',
                  }}
                />
              </Box>
            )}
            {!templateLoading &&
              templates?.map((template) => (
                <Box
                  key={template?.id}
                  my={4}
                  overflow="auto"
                  textAlign="center"
                  height={400}
                  // width={{ md: 360 }}
                  sx={{
                    border: selectedTemplate === template?.id ? 4 : 1,
                    borderRadius: 2,
                    borderColor: selectedTemplate === template?.id && 'green',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease-in-out',
                    position: 'relative',
                    '&:hover': {
                      transform: 'scale(1.03)',
                      zIndex: 10,
                    },
                    '::-webkit-scrollbar': {
                      display: 'none', //
                    },

                    overflow: 'hidden',
                  }}
                  component="div"
                  onClick={() => onSelectAgreement(template)}
                >
                  <Radio
                    checked={selectedTemplate === template?.id}
                    onChange={() => onSelectAgreement(template)}
                    value={template?.id}
                    name="template-selection"
                    inputProps={{ 'aria-label': `Select template ${template?.id}` }}
                    sx={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      zIndex: 100,
                    }}
                  />

                  <Box sx={{ width: 1, height: 1, overflow: 'auto', scrollbarWidth: 'none' }}>
                    <Box sx={{ display: 'inline-block' }}>
                      <Document
                        file={template?.url}
                        onLoadSuccess={({ numPages }) => setPages(numPages)}
                      >
                        <Stack spacing={2}>
                          {Array.from({ length: pages }, (_, index) => (
                            <Page
                              key={index}
                              pageIndex={index}
                              renderTextLayer={false}
                              pageNumber={index + 1}
                              scale={1}
                              width={lgUp ? 400 : 300}
                            />
                          ))}
                        </Stack>
                      </Document>
                    </Box>
                  </Box>
                </Box>
              ))}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CampaignFormUpload;

CampaignFormUpload.propTypes = {
  pdfModal: PropTypes.object,
};
