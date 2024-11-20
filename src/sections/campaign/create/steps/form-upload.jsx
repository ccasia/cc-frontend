import dayjs from 'dayjs';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { Page, Document } from 'react-pdf';
import { useFormContext } from 'react-hook-form';
import React, { useState, useCallback } from 'react';

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

import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';

const CampaignFormUpload = ({ pdfModal }) => {
  const [pages, setPages] = useState();
  const templateModal = useBoolean();
  const [selectedTemplate, setSelectedTemplate] = useState({});
  const lgUp = useResponsive('up', 'sm');
  const [displayPdf, setDisplayPdf] = useState('');

  const { data: templates, templateLoading } = useGetTemplate();

  const {
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const agreementUrl = watch('agreementFrom');

  const error = errors?.agreementFrom;

  const generateNewAgreement = useCallback(async (template) => {
    try {
      if (template) {
        const blob = await pdf(
          <AgreementTemplate
            DATE={dayjs().format('LL')}
            ccEmail="hello@cultcreative.com"
            ccPhoneNumber="+60162678757"
            NOW_DATE={dayjs().format('LL')}
            VERSION_NUMBER="V1"
            ADMIN_IC_NUMBER={template?.adminICNumber ?? 'Default'}
            ADMIN_NAME={template?.adminName ?? 'Default'}
            SIGNATURE={template?.signURL ?? 'Default'}
          />
        ).toBlob();
        return blob;
      }
      return null;
    } catch (err) {
      console.log(err);
      return err;
    }
  }, []);

  const onSelectAgreement = async (template) => {
    const newAgreement = await generateNewAgreement(template);
    setDisplayPdf(newAgreement);
    setSelectedTemplate(template);
    setValue('agreementFrom', { ...template, url: newAgreement });
    templateModal.onFalse();
  };

  return (
    <>
      {templateLoading && (
        <Box display="flex" justifyContent="center">
          <CircularProgress size={30} />
        </Box>
      )}

      {error && (
        <Alert severity="error" variant="outlined">
          Please select one template before proceed.
        </Alert>
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
            <Document file={agreementUrl?.url} onLoadSuccess={({ numPages }) => setPages(numPages)}>
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
                    border: selectedTemplate?.id === template?.id ? 4 : 1,
                    borderRadius: 2,
                    borderColor: selectedTemplate?.id === template?.id && 'green',
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
                    checked={selectedTemplate?.id === template?.id}
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
