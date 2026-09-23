import dayjs from 'dayjs';
import * as yup from 'yup';
import PropTypes from 'prop-types';
import { pdf } from '@react-pdf/renderer';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm, useFieldArray } from 'react-hook-form';

import { Box } from '@mui/material';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { useResponsive } from 'src/hooks/use-responsive';
import useGetCreditTiers from 'src/hooks/use-get-credit-tiers';

import axiosInstance from 'src/utils/axios';
import { getCurrencyPrefix } from 'src/utils/currency';

import AgreementTemplate from 'src/template/agreement';

import Iconify from 'src/components/iconify';
import FormProvider from 'src/components/hook-form';

// import CAgreement from './c-agreement';
// import TransferPackageCreditsDialog from './transfer-package-credits-dialog';

import TransferPackageCreditsDialog from './transfer-package-credits-dialog';
import AttachAdditionalPackageDialog from './attach-additional-package-dialog';
import CAgreement, { getFollowerCountByPlatform, resolveTierForFollowerCount } from './c-agreement';

const rowSchema = yup.object().shape({
  isGuest: yup.boolean(),
  isSeedingAgreement: yup.boolean(),
  product: yup.object().when('isSeedingAgreement', {
    is: true,
    then: (schem) =>
      schem.shape({
        name: yup.string().required('Product name is required.'),
        value: yup.string().required('Product value is required.'),
      }),
    otherwise: (schem) =>
      schem.shape({
        name: yup.string().notRequired(),
        value: yup.string().notRequired(),
      }),
  }),
  paymentAmount: yup.string().when('isSeedingAgreement', {
    is: false,
    then: (schem) => schem.required('Payment Amount is required.'),
    otherwise: (schem) => schem.notRequired(),
  }),
  currency: yup.string().required('Currency is required'),
  ugcCredits: yup.number().when('isGuest', {
    is: true,
    then: (schem) =>
      schem.transform((value, original) => (original === '' ? null : value)).nullable(),
    otherwise: (schem) =>
      schem
        .typeError('UGC credits are required.')
        .integer('UGC credits must be a whole number.')
        .min(1, 'At least 1 credit is required.')
        .required('UGC credits are required.'),
  }),
  platformFollowerCount: yup.string().nullable(),
});

const schema = yup.object().shape({
  agreements: yup.array().of(rowSchema),
});

// Sends a *first* agreement to several not-yet-sent creators at once. Unlike additional rounds
// (which reuse an already-signed contract and skip PDF generation entirely), a first agreement
// is a brand new signed document — so this loops the exact same two-call flow the single-creator
// dialog (campaign-agreement-edit.jsx) uses per creator: generate the PDF, PATCH
// updateAmountAgreement (multipart, carries the PDF), then PATCH sendAgreement. Sequential, not
// parallel, so one creator's failure doesn't race the next and results stay easy to report.
export default function SendBulkAgreementModal({
  open,
  onClose,
  campaign,
  creators: agreements,
  onSent,
  campaignMutate,
  table,
}) {
  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: { agreements: [] },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const {
    control,
    trigger,
    watch,
    formState: { isValid },
    handleSubmit,
  } = methods;

  const rows = watch('agreements');

  const { fields, replace, remove } = useFieldArray({
    control,

    name: 'agreements',
  });

  const { data: creditTierList } = useGetCreditTiers();
  // const [rows, setRows] = useState([]);

  const smUp = useResponsive('up', 'sm');

  const attachDialog = useState(false);
  const [showAttach, setShowAttach] = attachDialog;
  const transferDialog = useState(false);
  const [showTransfer, setShowTransfer] = transferDialog;

  const creatorsById = useMemo(() => {
    const map = new Map();
    agreements.forEach((c) => map.set(c.userId, c));
    return map;
  }, [agreements]);

  const extractAgreementsInfo = useMemo(() => {
    if (campaign?.agreementTemplate) return campaign.agreementTemplate;
    return campaign?.campaignAdmin?.reduce(
      (foundTemplate, item) => foundTemplate || item?.admin?.user?.agreementTemplate?.[0] || null,
      null
    );
  }, [campaign]);

  const perRowCost = useMemo(
    () =>
      rows.map((row) => {
        const creatorRow = creatorsById.get(row.userId);
        const isGuest = creatorRow?.user?.creator?.isGuest === true;
        if (isGuest) return 0;
        const videoCount = Number(row.videoCount) || 0;
        if (!campaign?.isCreditTier) return videoCount;
        const tier = resolveTierForFollowerCount(creditTierList, Number(row.followerCount) || 0);
        return (tier?.creditsPerVideo || 0) * videoCount;
      }),
    [rows, creatorsById, campaign?.isCreditTier, creditTierList]
  );

  const totalRequired = perRowCost.reduce((sum, c) => sum + c, 0);
  const creditsRemaining = Math.max(
    0,
    Number(campaign?.campaignCredits ?? 0) - Number(campaign?.creditsUtilized ?? 0)
  );
  const hasCreditLimit = campaign?.campaignCredits != null;
  const isInsufficient = hasCreditLimit && totalRequired > creditsRemaining;

  const hasMissingFields = rows.some(
    (row) =>
      row.paymentAmount === '' ||
      row.paymentAmount == null ||
      row.ugcCredits === '' ||
      row.ugcCredits == null
  );

  const handleClose = () => {
    // if (sending) return;
    table.setSelected([]);
    onClose();
  };

  const refreshAfterCreditChange = async () => {
    if (campaignMutate) await campaignMutate();
  };

  const mutation = useMutation({
    mutationFn: async (formData) => {
      const res = await axiosInstance.post('/api/campaign/agreement/bulk-send', formData, {
        headers: { Accept: 'multipart/form-data' },
      });
      return res.data;
    },
    mutationKey: ['bulk-agreement'],
    onSuccess: async () => {
      const selectedUserIds = agreements.map((a) => a.userId);
      onSent(selectedUserIds);
      onClose();
    },
  });

  const { isPending, mutate } = mutation;

  const buildAgreementBlob = (row, creatorRow) => {
    const prefix = getCurrencyPrefix(row.currency);
    const creatorName =
      creatorRow?.user?.paymentForm?.bankAccountName || creatorRow?.user?.name || 'N/A';

    return pdf(
      <AgreementTemplate
        DATE={dayjs().format('LL')}
        IC_NUMBER={creatorRow?.user?.paymentForm?.icNumber}
        FREELANCER_FULL_NAME={creatorName}
        ADDRESS={creatorRow?.user?.creator?.address}
        ccEmail="hello@cultcreative.com"
        ccPhoneNumber="+60162678757"
        effectiveDate={dayjs().add(4, 'day').format('LL')}
        creatorPayment={`${prefix}${row.paymentAmount}`}
        CREATOR_NAME={creatorName}
        CREATOR_ACCOUNT_NUMBER={creatorRow?.user?.paymentForm?.bankAccountNumber}
        CREATOR_BANK_ACCOUNT_NAME={creatorName}
        CREATOR_BANK_NAME={creatorRow?.user?.paymentForm?.bankName}
        AGREEMENT_ENDDATE={dayjs().add(1, 'month').format('LL')}
        NOW_DATE={dayjs().format('LL')}
        VERSION_NUMBER={`V${dayjs().unix()}`}
        ADMIN_IC_NUMBER={extractAgreementsInfo?.adminICNumber ?? 'Default'}
        ADMIN_NAME={extractAgreementsInfo?.adminName ?? 'Default'}
        SIGNATURE={extractAgreementsInfo?.signURL ?? 'Default'}
        isForSurfShark={campaign?.isForSurfShark}
        isSeedingAgreement={row.isSeedingAgreement}
        productValue={row.isSeedingAgreement ? `${prefix}${row.product?.value}` : undefined}
      />
    ).toBlob();
  };

  const onSubmit = handleSubmit(async (data) => {
    const rowsWithBlobs = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const row of data.agreements) {
      const creatorRow = creatorsById.get(row.userId);
      const isGuestCreator = creatorRow?.user?.creator?.isGuest === true;
      const credits = isGuestCreator ? null : Number(row.ugcCredits) || 0;
      const followerCount = Number(row.platformFollowerCount) || 0;
      const fileKey = row.agreementId || row.userId;

      // eslint-disable-next-line no-await-in-loop
      const blob = await buildAgreementBlob(row, creatorRow);

      rowsWithBlobs.push({
        blob,
        fileKey,
        meta: {
          agreementId: row.agreementId,
          userId: row.userId,
          fileKey,
          user: creatorRow?.user,
          isNew: creatorRow?.isNew || false,
          paymentAmount: row.paymentAmount,
          currency: row.currency,
          credits,
          selectedPlatform: row.selectedPlatform,
          ...(followerCount > 0 && { followerCount }),
          isSeedingAgreement: row.isSeedingAgreement,
          product: row.isSeedingAgreement ? row.product : undefined,
        },
      });
    }

    const formData = new FormData();
    formData.append('campaignId', campaign.id);
    formData.append('creators', JSON.stringify(rowsWithBlobs.map((r) => r.meta)));
    rowsWithBlobs.forEach(({ blob, fileKey }) => {
      formData.append('agreementForms', blob, `${fileKey}.pdf`);
    });

    mutate(formData);
  });

  useEffect(() => {
    if (!agreements?.length) return;

    const mapped = agreements.map((agreement) => {
      const agreedPlatform = agreement?.shortlistedCreator?.selectedPlatform || 'instagram';
      const product = agreement?.productSeeding?.[0];

      return {
        agreementId: agreement?.id, // keep your own id here (see note below)
        userId: agreement?.userId,
        paymentAmount: parseInt(agreement?.shortlistedCreator?.amount, 10) || '',
        currency: agreement?.shortlistedCreator?.currency || 'MYR',
        ugcCredits: agreement?.videoCount ?? '',
        platformFollowerCount: String(
          getFollowerCountByPlatform(campaign, agreement, agreedPlatform) || ''
        ),
        isSeedingAgreement: Boolean(agreement?.isSeeding),
        product: product ? { name: product.name, value: product.value } : undefined,
      };
    });

    replace(mapped);
    // trigger(); // validate once, not on every field
  }, [agreements, campaign, replace, trigger]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={!smUp}
        PaperProps={{ sx: { borderRadius: '20px', bgcolor: '#F5F5F5', position: 'relative' } }}
      >
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ px: 3.5, pt: 3.5 }}
            >
              <DialogTitle
                sx={{
                  p: 0,
                }}
              >
                <Typography
                  fontFamily="Instrument Serif"
                  fontSize="30px"
                  fontWeight={500}
                  letterSpacing={-0.5}
                  flex={1}
                >
                  Send Bulk Agreement
                </Typography>
              </DialogTitle>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                {/* {hasCreditLimit && (
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      color: isInsufficient ? '#D4321C' : '#1340FF',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isInsufficient
                      ? 'Insufficient Campaign Credits!'
                      : `${creditsRemaining} Campaign Credits Remaining`}
                  </Typography>
                )} */}
                <IconButton onClick={handleClose} disabled={isPending} sx={{ color: '#221f20' }}>
                  <Iconify icon="eva:close-fill" width={24} />
                </IconButton>
              </Stack>
            </Stack>

            <Divider sx={{ borderColor: '#E3E3E3', mt: 2.5, mx: 3.5 }} />

            <DialogContent sx={{ px: 4, pb: 0.5, maxHeight: smUp ? '60vh' : '80vh' }}>
              <Stack divider={<Divider sx={{ borderColor: '#E3E3E3' }} />} spacing={2} py={3}>
                {fields.map((field, index) => {
                  const row = agreements.find((i) => i.id === field.agreementId);

                  return (
                    <CAgreement
                      agreement={row}
                      index={index}
                      campaign={campaign}
                      exclude={() => {
                        remove(index);
                        table.setSelected((prev) => prev.filter((id) => id !== field.userId));
                      }}
                    />
                  );
                })}
              </Stack>
            </DialogContent>

            <Divider sx={{ borderColor: '#E3E3E3', mx: 3.5 }} />

            <DialogActions sx={{ px: 4, pb: 4, pt: 2.5, alignItems: 'center', gap: 2.5 }}>
              {isInsufficient && (
                <Typography
                  sx={{
                    color: '#D4321C',
                    textAlign: 'right',
                    flex: 1,
                    lineHeight: 1.5,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                  }}
                >
                  You only have {creditsRemaining} Campaign Credits for this campaign.
                  <br />
                  <Typography
                    component="button"
                    type="button"
                    onClick={() => setShowAttach(true)}
                    sx={{
                      border: 'none',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      p: 0,
                      color: '#D4321C',
                      fontWeight: 500,
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      textDecoration: 'underline',
                    }}
                  >
                    Attach a New Package
                  </Typography>{' '}
                  or{' '}
                  <Typography
                    component="button"
                    type="button"
                    onClick={() => setShowTransfer(true)}
                    sx={{
                      border: 'none',
                      bgcolor: 'transparent',
                      cursor: 'pointer',
                      p: 0,
                      color: '#D4321C',
                      fontWeight: 500,
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      textDecoration: 'underline',
                    }}
                  >
                    Transfer from Package Credits
                  </Typography>
                  .
                </Typography>
              )}
              <LoadingButton
                type="submit"
                loading={isPending}
                disabled={isInsufficient || rows.length === 0 || !isValid || isPending}
                sx={{
                  width: '170px',
                  height: '44px',
                  gap: '6px',
                  opacity: 1,
                  pt: '10px',
                  pr: '18px',
                  pb: '13px',
                  pl: '18px',
                  borderRadius: '8px',
                  background:
                    'linear-gradient(0deg, #1340FF, #1340FF), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                  boxShadow: '0px -3px 0px 0px #0000001A inset',
                  color: '#ffffff',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': {
                    background:
                      'linear-gradient(0deg, #0F35D6, #0F35D6), linear-gradient(0deg, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.6))',
                    boxShadow: '0px -3px 0px 0px #0000001A inset',
                  },
                  // '&.Mui-disabled': {
                  //   background: '#A6ADF5',
                  //   color: '#ffffff',
                  //   boxShadow: 'none',
                  // },
                }}
              >
                {`Send to ${rows.length} Creator${rows.length !== 1 ? 's' : ''}`}
              </LoadingButton>
            </DialogActions>
          </Box>
        </FormProvider>
      </Dialog>

      <AttachAdditionalPackageDialog
        open={showAttach}
        onClose={() => setShowAttach(false)}
        campaign={campaign}
        onAttached={refreshAfterCreditChange}
      />

      <TransferPackageCreditsDialog
        open={showTransfer}
        onClose={() => setShowTransfer(false)}
        campaign={campaign}
        onTransferred={refreshAfterCreditChange}
      />
    </>
  );
}

SendBulkAgreementModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  campaign: PropTypes.object,
  creators: PropTypes.array,
  onSent: PropTypes.func,
  campaignMutate: PropTypes.func,
  table: PropTypes.func,
};
