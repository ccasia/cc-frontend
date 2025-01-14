import * as Yup from 'yup';
import { mutate } from 'swr';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { PDFDocument } from 'pdf-lib';
import { useForm } from 'react-hook-form';
import { pdf } from '@react-pdf/renderer';
import { enqueueSnackbar } from 'notistack';
import { yupResolver } from '@hookform/resolvers/yup';

import { LoadingButton } from '@mui/lab';
import {
  Box,
  Step,
  Stack,
  Dialog,
  Button,
  Stepper,
  StepLabel,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import AgreementTemplate from 'src/template/agreement';

import PDFEditor from 'src/components/pdf/pdf-editor';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

const stepsPDF = ['Fill in missing information', 'Digital Signature'];

const PDFEditorModal = ({ open, onClose, user, campaignId, setAgreementForm }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [url, setURL] = useState('');
  const loadingProcess = useBoolean();
  const [signURL, setSignURL] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const loading = useBoolean();

  const smDown = useResponsive('down', 'sm');

  const schema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    icNumber: Yup.string().required('IC Number is required.'),
  });

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name || '',
      icNumber: '',
    },
    reValidateMode: 'onChange',
    mode: 'onChange',
  });

  const { handleSubmit, watch, reset } = methods;

  const { name, icNumber } = watch();

  const processPdf = async () => {
    const blob = await pdf(
      <AgreementTemplate ADMIN_IC_NUMBER={icNumber} ADMIN_NAME={name} />
    ).toBlob();

    const pdfUrl = URL.createObjectURL(blob);

    return pdfUrl;
  };

  const handleNext = async () => {
    if (activeStep !== stepsPDF.length - 1) {
      if (name && icNumber) {
        try {
          loadingProcess.onTrue();
          const data = await processPdf();
          setURL(data);
          setActiveStep(activeStep + 1);
        } catch (error) {
          console.log(error);
        } finally {
          loadingProcess.onFalse();
        }
      }
    }
  };

  const handlePrev = () => {
    if (activeStep !== 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const downloadPdf = async () => {
    try {
      const existingPdfBytes = await fetch(url).then((res) => res.arrayBuffer());

      const image = await fetch(signURL).then((res) => res.arrayBuffer());

      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      const jpgImage = await pdfDoc.embedPng(image);

      // Add annotations to the PDF
      annotations.forEach((annotation) => {
        const page = pdfDoc.getPages()[annotation.page - 1];

        page.drawImage(jpgImage, {
          x: annotation.x,
          y: page.getHeight() - annotation.y - annotation.height,
          width: annotation.width,
          height: annotation.height,
        });
      });

      const pdfBytes = await pdfDoc.save();

      // Create a blob and trigger the download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const signImage = new Blob([image], { type: 'image/png' });
      return { blob, signImage };
    } catch (error) {
      throw new Error(error);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      loading.onTrue();
      const { blob: agreementBlob } = await downloadPdf();

      const response = await fetch(signURL);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('data', JSON.stringify({ ...user, ...data, campaignId }));
      formData.append('signedAgreement', agreementBlob);
      formData.append('signatureImage', blob);

      const res = await axiosInstance.post(
        endpoints.campaign.agreementTemplate(user.id),
        formData,
        {
          headers: {
            'Content-Type': 'multiple/form-data',
          },
        }
      );

      if (setAgreementForm) {
        setAgreementForm('agreementFrom', res?.data?.agreementTemplate);
      }

      if (campaignId) {
        mutate(endpoints.campaign.getCampaignById(campaignId));
      }

      setSignURL('');
      setAnnotations([]);
      reset();
      enqueueSnackbar(res?.data?.message);
      onClose();
    } catch (error) {
      enqueueSnackbar(error?.message, {
        variant: 'error',
      });
    } finally {
      loading.onFalse();
    }
  });

  return (
    <Dialog open={open} maxWidth="md" fullWidth fullScreen={smDown}>
      <FormProvider methods={methods}>
        <DialogTitle>Agreement Generator</DialogTitle>
        <DialogContent>
          <>
            <Stepper activeStep={activeStep}>
              {stepsPDF.map((label, index) => {
                const stepProps = {};
                const labelProps = {};
                return (
                  <Step key={label} {...stepProps}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                  </Step>
                );
              })}
            </Stepper>
            <Box mt={4}>
              {activeStep === 0 && (
                <Stack gap={1.5} py={2}>
                  <RHFTextField name="name" label="Name" />
                  <RHFTextField name="icNumber" label="IC Number" />
                </Stack>
              )}
              {activeStep === 1 && (
                <PDFEditor
                  file={url}
                  annotations={annotations}
                  setAnnotations={setAnnotations}
                  setSignURL={setSignURL}
                  signURL={signURL}
                />
              )}
            </Box>
          </>
        </DialogContent>
        <DialogActions>
          {activeStep === 0 ? (
            <Button onClick={onClose} variant="outlined" size="small" color="error">
              Cancel
            </Button>
          ) : (
            <Button onClick={handlePrev} variant="outlined" size="small">
              Back
            </Button>
          )}

          {activeStep === stepsPDF.length - 1 ? (
            <LoadingButton color="success" size="small" onClick={onSubmit} loading={loading.value}>
              Save
            </LoadingButton>
          ) : (
            <LoadingButton onClick={handleNext} loading={loadingProcess.value}>
              Next
            </LoadingButton>
          )}
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
};

export default PDFEditorModal;

PDFEditorModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  user: PropTypes.object,
  campaignId: PropTypes.string,
  setAgreementForm: PropTypes.func,
};
