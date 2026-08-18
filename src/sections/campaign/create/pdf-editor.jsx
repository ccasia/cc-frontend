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
import { RestartAlt } from '@mui/icons-material';
import {
  Box,
  Step,
  Stack,
  Radio,
  Dialog,
  Button,
  Stepper,
  Tooltip,
  StepLabel,
  FormLabel,
  RadioGroup,
  IconButton,
  DialogTitle,
  FormControl,
  DialogContent,
  DialogActions,
  FormControlLabel,
} from '@mui/material';

import { useBoolean } from 'src/hooks/use-boolean';
import { useResponsive } from 'src/hooks/use-responsive';

import axiosInstance, { endpoints } from 'src/utils/axios';

import AgreementTemplate from 'src/template/agreement';

import PDFEditor from 'src/components/pdf/pdf-editor';
import FormProvider, { RHFCheckbox, RHFTextField } from 'src/components/hook-form';

const stepsPDF = ['Fill in missing information', 'Digital Signature'];

const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  icNumber: Yup.string().required('IC Number is required.'),
  campaignType: Yup.string().nullable(),
  isNdaRequired: Yup.boolean().optional(),
});

const PDFEditorModal = ({ open, onClose, user, campaignId, setAgreementForm }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [url, setURL] = useState('');
  const loadingProcess = useBoolean();
  const [signURL, setSignURL] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const loading = useBoolean();

  const smDown = useResponsive('down', 'sm');

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: user?.name || '',
      icNumber: '',
      campaignType: '',
      isNdaRequired: false,
    },
    reValidateMode: 'onChange',
    mode: 'onChange',
  });

  const {
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = methods;

  console.log(errors);

  const { name, icNumber, campaignType, isNdaRequired } = watch();

  const processPdf = async () => {
    const blob = await pdf(
      <AgreementTemplate
        ADMIN_IC_NUMBER={icNumber}
        ADMIN_NAME={name}
        isForSurfShark={campaignType === 'surfSharkCampaign'}
        isSeedingCampaign={campaignType === 'seedingCampaign'}
        isNdaRequired={isNdaRequired}
      />
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
      formData.append(
        'data',
        JSON.stringify({ name: user?.name, ...data, campaignId, isNdaRequired })
      );
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
                <Stack gap={1.5}>
                  <RHFTextField name="name" label="Name" />
                  <RHFTextField name="icNumber" label="IC Number" />
                  <FormControl>
                    <FormLabel
                      sx={{
                        color: 'black',
                        letterSpacing: 0.3,
                        '&.Mui-focused': {
                          color: 'black',
                        },
                      }}
                    >
                      Generate for:
                    </FormLabel>
                    <RadioGroup
                      row
                      value={campaignType}
                      onChange={(e) => {
                        setValue('campaignType', e.target.value);
                      }}
                      sx={{
                        '&.MuiRadioGroup-root .Mui-checked': {
                          color: 'black',
                        },
                      }}
                    >
                      <FormControlLabel
                        control={<Radio />}
                        value="surfSharkCampaign"
                        label="Surf Shark campaign"
                      />
                      <FormControlLabel
                        control={<Radio />}
                        value="seedingCampaign"
                        label="Seeding campaign"
                      />
                      {campaignType && (
                        <Tooltip title="This will reset to default agreement" arrow>
                          <IconButton
                            onClick={() => setValue('campaignType', '')}

                            size="small"
                          >
                            <RestartAlt />
                          </IconButton>
                        </Tooltip>
                      )}
                    </RadioGroup>
                  </FormControl>
                  <RHFCheckbox name="isNdaRequired" label="NDA Agreement" />
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
            <Button onClick={handlePrev} size="small">
              Back
            </Button>
          )}

          {activeStep === stepsPDF.length - 1 ? (
            <LoadingButton
              size="small"
              variant="contained"
              onClick={onSubmit}

              loading={loading.value}
            >
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
