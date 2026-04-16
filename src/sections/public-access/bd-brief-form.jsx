import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircleIcon from '@mui/icons-material/FiberManualRecord';
import CheckIcon from '@mui/icons-material/Check';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { useSnackbar } from 'notistack';
import Image from 'src/components/image';
import FormProvider, {
  RHFTextField,
  RHFDatePicker,
} from 'src/components/hook-form';
import { RHFSelect } from 'src/components/hook-form/rhf-select';

const BRAND = {
  blue: '#1340FF',
  blueDark: '#0A2DB3',
  blueMid: '#2D4FCC',
  bluePale: '#EEF1FF',
  blueBorder: '#B3C0FF',
  bg: '#F7F6F3',
  ink: '#1A1A1A',
  mute: '#666',
  mute2: '#888',
  mute3: '#999',
  mute4: '#BBB',
  hairline: '#E0DDD8',
  hairline2: '#D5D2CC',
  hairline3: '#EEECEA',
  neutral: '#FAFAF9',
  hover: '#F0EDE8',
  successBg: '#EAF3DE',
  successInk: '#3B6D11',
};

const INDUSTRIES = [
  'F&B',
  'Fashion',
  'Beauty & Skincare',
  'FMCG',
  'Health & Wellness',
  'Hotel & Travel',
  'Home & Living',
  'Technology',
  'Banking & Finance',
  'Lifestyle',
  'Others',
];

const OBJECTIVES = [
  {
    val: 'Brand Awareness',
    title: 'Brand awareness',
    desc: 'Introduce your brand to a new audience',
  },
  {
    val: 'Product Launch',
    title: 'Product launch',
    desc: 'Generate buzz for a new product or service',
  },
  {
    val: 'Education',
    title: 'Education',
    desc: 'Educate audiences about your brand or product category',
  },
  {
    val: 'Community Building',
    title: 'Community building',
    desc: 'Foster a loyal community around your brand values',
  },
];

const KPI_OPTIONS = [
  'Views (100k – 1M+)',
  'Reach & impressions',
  'Engagement rate',
  'Link clicks',
  'Foot traffic',
  'App downloads',
  'Sales / conversions',
  'Follower growth',
  'UGC volume',
];

const schema = Yup.object().shape({
  brandName: Yup.string().trim().required('Please enter your brand name.'),
  industry: Yup.string().required('Please select an industry.'),
  dateFrom: Yup.mixed().nullable(),
  dateTo: Yup.mixed()
    .nullable()
    .required('Please select the latest posting date.')
    .test('after-start', 'Latest posting date must be on or after the earliest.', function (val) {
      const { dateFrom } = this.parent;
      if (!val || !dateFrom) return true;
      return val.isSame(dateFrom) || val.isAfter(dateFrom);
    }),
  primaryGoal: Yup.string().required('Please select a campaign objective.'),
  kpis: Yup.array().of(Yup.string()),
  kpiNotes: Yup.string().max(300),
  extraNotes: Yup.string().max(500),
});

const defaultValues = {
  brandName: '',
  industry: '',
  dateFrom: null,
  dateTo: null,
  primaryGoal: '',
  kpis: [],
  kpiNotes: '',
  extraNotes: '',
};

// shared input styling so every TextField/Select matches the artifact
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#fff',
    borderRadius: '8px',
    fontSize: 14,
    color: BRAND.ink,
    '& fieldset': { borderColor: BRAND.hairline2, borderWidth: '0.5px' },
    '&:hover fieldset': { borderColor: BRAND.hairline2 },
    '&.Mui-focused fieldset': { borderColor: BRAND.blue, borderWidth: '1px' },
    '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(19,64,255,0.1)' },
  },
  '& .MuiOutlinedInput-input': {
    padding: '9px 13px',
    '&::placeholder': { color: BRAND.mute4, opacity: 1 },
  },
  '& .MuiInputBase-inputMultiline': { padding: 0 },
};

const labelSx = { fontSize: 13, fontWeight: 500, color: BRAND.ink, mb: '5px', display: 'block' };
const hintSx = { fontSize: 12, color: BRAND.mute2, mb: '7px', lineHeight: 1.5 };
const sectionTitleSx = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: BRAND.mute3,
  mb: '14px',
};

function SectionCard({ title, children }) {
  return (
    <Card
      elevation={0}
      sx={{
        bgcolor: '#fff',
        border: `0.5px solid ${BRAND.hairline}`,
        borderRadius: '12px',
        px: 3,
        py: '20px',
        mb: '14px',
      }}
    >
      <Typography sx={sectionTitleSx}>{title}</Typography>
      {children}
    </Card>
  );
}

SectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default function BDBriefForm({ token }) {
  const { enqueueSnackbar } = useSnackbar();
  const [bdName, setBdName] = useState(null);
  const [lookupError, setLookupError] = useState(false);
  const [submittedRows, setSubmittedRows] = useState(null);

  const methods = useForm({ resolver: yupResolver(schema), defaultValues, mode: 'onTouched' });
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = methods;
  const values = watch();

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get(endpoints.bd.publicInfo(token))
      .then((res) => {
        if (!cancelled) setBdName(res.data?.bdName ?? null);
      })
      .catch(() => {
        if (!cancelled) setLookupError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = BRAND.bg;
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  const filled = useMemo(() => {
    let n = 0;
    if (values.brandName?.trim()) n += 1;
    if (values.industry) n += 1;
    if (values.dateFrom && values.dateTo) n += 1;
    if (values.primaryGoal) n += 1;
    return n;
  }, [values]);
  const pct = Math.round((filled / 4) * 100);

  const toggleKpi = (k) => {
    const set = new Set(values.kpis ?? []);
    if (set.has(k)) set.delete(k);
    else set.add(k);
    setValue('kpis', Array.from(set));
  };

  const onSubmit = handleSubmit(
    async (data) => {
      const payload = {
        brandName: data.brandName.trim(),
        industry: data.industry,
        postingStart: data.dateFrom ? dayjs(data.dateFrom).toISOString() : null,
        postingEnd: data.dateTo ? dayjs(data.dateTo).toISOString() : null,
        primaryGoal: data.primaryGoal,
        kpis: data.kpis ?? [],
        kpiNotes: data.kpiNotes?.trim() || null,
        additionalInfo: data.extraNotes?.trim() || null,
      };
      try {
        await axiosInstance.post(endpoints.bd.publicSubmit(token), payload);
        const rows = [
          ['Brand', payload.brandName],
          ['Industry', payload.industry],
          ['Timeline', `${data.dateFrom || 'TBD'} → ${data.dateTo || 'TBD'}`],
          ['Objective', payload.primaryGoal],
        ];
        if (payload.kpis.length) rows.push(['KPIs', payload.kpis.join(', ')]);
        if (payload.kpiNotes) rows.push(['KPI notes', payload.kpiNotes]);
        if (payload.additionalInfo) rows.push(['Additional context', payload.additionalInfo]);
        setSubmittedRows(rows);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        enqueueSnackbar('Something went wrong submitting your brief. Please try again.', {
          variant: 'error',
        });
      }
    },
    (errs) => {
      const first = Object.values(errs)[0];
      if (first?.message) enqueueSnackbar(first.message, { variant: 'warning' });
    }
  );

  const clearForm = () => reset(defaultValues);
  const startOver = () => {
    clearForm();
    setSubmittedRows(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (lookupError) {
    return (
      <Box sx={{ minHeight: '100vh', py: '2rem', px: '1rem' }}>
        <Box sx={{ maxWidth: 660, mx: 'auto' }}>
          <Card
            elevation={0}
            sx={{
              textAlign: 'center',
              p: '3rem 2rem',
              bgcolor: '#fff',
              border: `0.5px solid ${BRAND.hairline}`,
              borderRadius: '12px',
            }}
          >
            <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1, color: BRAND.ink }}>
              Link not valid
            </Typography>
            <Typography sx={{ fontSize: 13, color: BRAND.mute }}>
              This invite link isn't valid anymore. Please ask your contact at Cult Creative for a
              new one.
            </Typography>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: '2rem',
        pb: '4rem',
        px: '1rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
        <Box sx={{ maxWidth: 660, mx: 'auto' }}>
          {/* Topbar */}
          <Stack direction="row" alignItems="center" spacing="10px">
            <Box
              component="div"
              sx={{
                position: 'relative',
                width: 25,
                height: 25,
                // borderRadius: 1,
                my: 3,
              }}
            >
              <Image
                src="/assets/icons/navbar/ic_navlogo.svg"
                alt="Cult Creative Logo"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 'inherit',
                }}
              />
            </Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: BRAND.ink }}>
              Cult Creative
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Box
              sx={{
                fontSize: 11,
                px: '10px',
                py: '3px',
                borderRadius: '20px',
                bgcolor: BRAND.bluePale,
                color: BRAND.blueDark,
                border: `0.5px solid ${BRAND.blueBorder}`,
                fontWeight: 500,
              }}
            >
              Content Strategy Intake
            </Box>
          </Stack>

          {submittedRows ? (
            <Card
              elevation={0}
              sx={{
                textAlign: 'center',
                bgcolor: '#fff',
                border: `0.5px solid ${BRAND.hairline}`,
                borderRadius: '12px',
                p: '3rem 2rem',
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  bgcolor: BRAND.successBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: '14px',
                  color: BRAND.successInk,
                }}
              >
                <CheckIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontSize: 18, fontWeight: 600, mb: 1, color: BRAND.ink }}>
                Brief received!
              </Typography>
              <Typography sx={{ fontSize: 13, color: BRAND.mute, lineHeight: 1.6, mb: '1.5rem' }}>
                Our team{bdName ? ` (${bdName})` : ''} will review your submission and come back
                with a content strategy and creator recommendation shortly.
              </Typography>

              <Box
                sx={{
                  bgcolor: BRAND.neutral,
                  border: `0.5px solid ${BRAND.hairline}`,
                  borderRadius: '10px',
                  p: '1rem 1.25rem',
                  textAlign: 'left',
                  mb: '1.5rem',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.07em',
                    textTransform: 'uppercase',
                    color: BRAND.mute3,
                    mb: '10px',
                  }}
                >
                  Submission summary
                </Typography>
                {submittedRows.map(([k, v], i) => (
                  <Box
                    key={k}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      fontSize: 13,
                      py: '5px',
                      borderBottom:
                        i === submittedRows.length - 1 ? 'none' : `0.5px solid ${BRAND.hairline3}`,
                    }}
                  >
                    <Box sx={{ color: BRAND.mute2, width: 130, flexShrink: 0 }}>{k}</Box>
                    <Box sx={{ color: BRAND.ink, fontWeight: 500 }}>{v}</Box>
                  </Box>
                ))}
              </Box>

              <Button
                variant="outlined"
                onClick={startOver}
                sx={{
                  textTransform: 'none',
                  px: '20px',
                  py: '10px',
                  fontSize: 14,
                  fontWeight: 400,
                  borderRadius: '8px',
                  border: `0.5px solid ${BRAND.hairline2}`,
                  color: BRAND.mute,
                  '&:hover': { bgcolor: BRAND.hover, border: `0.5px solid ${BRAND.hairline2}` },
                }}
              >
                Submit another brief
              </Button>
            </Card>
          ) : (
            <>
              {/* Header */}
              <Box sx={{ mb: '1.75rem' }}>
                <Typography sx={{ fontSize: 22, fontWeight: 600, color: BRAND.ink, mb: '6px' }}>
                  Tell us about your campaign
                </Typography>
                <Typography sx={{ fontSize: 14, color: BRAND.mute, lineHeight: 1.6 }}>
                  Fill in the details below and our team will prepare a tailored content strategy
                  and influencer recommendations for your brand.
                </Typography>
              </Box>

              {/* Progress */}
              <Box sx={{ mb: '1.5rem' }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: '5px' }}>
                  <Typography sx={{ fontSize: 12, color: BRAND.mute2 }}>
                    {filled} of 4 required fields filled
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: BRAND.mute2 }}>{pct}%</Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 3,
                    borderRadius: '3px',
                    bgcolor: '#EEE',
                    '& .MuiLinearProgress-bar': { bgcolor: BRAND.blue, borderRadius: '3px' },
                  }}
                />
              </Box>

              <FormProvider methods={methods} onSubmit={onSubmit}>
                {/* Brand info */}
                <SectionCard title="Brand info">
                  <Box sx={{ mb: '1.2rem' }}>
                    <Typography component="label" sx={labelSx}>
                      Brand name{' '}
                      <Box component="span" sx={{ color: BRAND.blue, ml: '2px' }}>
                        *
                      </Box>
                    </Typography>
                    <RHFTextField
                      name="brandName"
                      size="small"
                      placeholder="e.g. Spritzer, Levain Bakery"
                      sx={fieldSx}
                    />
                  </Box>
                  <Box>
                    <Typography component="label" sx={labelSx}>
                      Industry{' '}
                      <Box component="span" sx={{ color: BRAND.blue, ml: '2px' }}>
                        *
                      </Box>
                    </Typography>
                    <RHFSelect
                      name="industry"
                      size="small"
                      SelectProps={{
                        displayEmpty: true,
                        sx: { textTransform: 'none' },
                      }}
                      sx={fieldSx}
                    >
                      <MenuItem value="" disabled>
                        Select your industry
                      </MenuItem>
                      {INDUSTRIES.map((i) => (
                        <MenuItem key={i} value={i}>
                          {i}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  </Box>
                </SectionCard>

                {/* Timeline */}
                <SectionCard title="Timeline">
                  <Typography component="label" sx={labelSx}>
                    When do you want the content to go live?{' '}
                    <Box component="span" sx={{ color: BRAND.blue, ml: '2px' }}>
                      *
                    </Box>
                  </Typography>
                  <Typography sx={hintSx}>
                    This helps us plan creator briefing, production, and review schedules.
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: '12px',
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontSize: 11, color: BRAND.mute2, mb: '4px' }}>
                        Earliest posting date{' '}
                        <Box component="span" sx={{ color: BRAND.blue }}>
                          *
                        </Box>
                      </Typography>
                      <RHFDatePicker name="dateFrom" sx={fieldSx} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: 11, color: BRAND.mute2, mb: '4px' }}>
                        Latest posting date{' '}
                        <Box component="span" sx={{ color: BRAND.blue }}>
                          *
                        </Box>
                      </Typography>
                      <RHFDatePicker name="dateTo" sx={fieldSx} />
                    </Box>
                  </Box>
                </SectionCard>

                {/* Objective */}
                <SectionCard title="Campaign objective">
                  <Typography component="label" sx={labelSx}>
                    What is the primary goal of this campaign?{' '}
                    <Box component="span" sx={{ color: BRAND.blue, ml: '2px' }}>
                      *
                    </Box>
                  </Typography>
                  <Typography sx={hintSx}>
                    Select one that best describes what you want to achieve.
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                      gap: '8px',
                    }}
                  >
                    {OBJECTIVES.map((o) => {
                      const selected = values.primaryGoal === o.val;
                      return (
                        <Box
                          key={o.val}
                          onClick={() => setValue('primaryGoal', o.val)}
                          sx={{
                            cursor: 'pointer',
                            userSelect: 'none',
                            border: `0.5px solid ${selected ? BRAND.blue : BRAND.hairline}`,
                            bgcolor: selected ? BRAND.bluePale : '#fff',
                            borderRadius: '10px',
                            p: '11px 13px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '9px',
                            transition: 'border-color 0.15s, background 0.15s',
                            '&:hover': !selected && {
                              borderColor: '#C0BDB8',
                              bgcolor: BRAND.neutral,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 15,
                              height: 15,
                              borderRadius: '50%',
                              border: `1.5px solid ${selected ? BRAND.blue : '#CCC'}`,
                              bgcolor: selected ? BRAND.blue : 'transparent',
                              mt: '1px',
                              flexShrink: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {selected && <CircleIcon sx={{ fontSize: 5, color: '#fff' }} />}
                          </Box>
                          <Box>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: selected ? BRAND.blueDark : BRAND.ink,
                                mb: '2px',
                              }}
                            >
                              {o.title}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: 11,
                                lineHeight: 1.4,
                                color: selected ? BRAND.blueMid : BRAND.mute2,
                              }}
                            >
                              {o.desc}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  {errors.primaryGoal && (
                    <Typography sx={{ mt: '8px', fontSize: 12, color: '#D32F2F' }}>
                      {errors.primaryGoal.message}
                    </Typography>
                  )}
                </SectionCard>

                {/* KPIs */}
                <SectionCard title="KPIs & success metrics">
                  <Box sx={{ mb: '1.2rem' }}>
                    <Typography component="label" sx={labelSx}>
                      Do you have specific KPIs in mind?
                    </Typography>
                    <Typography sx={hintSx}>
                      Select any that apply — these help us calibrate creator tier, content format,
                      and posting strategy.
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '7px', mb: '10px' }}>
                      {KPI_OPTIONS.map((k) => {
                        const selected = values.kpis?.includes(k);
                        return (
                          <Chip
                            key={k}
                            label={k}
                            onClick={() => toggleKpi(k)}
                            sx={{
                              height: 'auto',
                              px: '12px',
                              py: '5px',
                              borderRadius: '20px',
                              fontSize: 12,
                              fontWeight: 500,
                              border: `0.5px solid ${selected ? BRAND.blue : BRAND.hairline}`,
                              bgcolor: selected ? BRAND.bluePale : BRAND.neutral,
                              color: selected ? BRAND.blueDark : '#555',
                              '&:hover': {
                                bgcolor: selected ? BRAND.bluePale : BRAND.neutral,
                                borderColor: selected ? BRAND.blue : '#C0BDB8',
                              },
                              '& .MuiChip-label': { px: 0 },
                            }}
                          />
                        );
                      })}
                    </Box>
                  </Box>
                  <Box>
                    <Typography component="label" sx={labelSx}>
                      Any specific targets or context?
                    </Typography>
                    <Typography sx={hintSx}>
                      e.g. "I want at least 500k views per video" or "We're targeting 200 store
                      visits over the campaign period"
                    </Typography>
                    <RHFTextField
                      name="kpiNotes"
                      multiline
                      minRows={3}
                      placeholder="Describe your targets here…"
                      inputProps={{ maxLength: 300 }}
                      sx={{
                        ...fieldSx,
                        '& .MuiOutlinedInput-root': {
                          ...fieldSx['& .MuiOutlinedInput-root'],
                          padding: '9px 13px',
                        },
                      }}
                    />
                    <Typography
                      sx={{ fontSize: 11, color: BRAND.mute4, textAlign: 'right', mt: '4px' }}
                    >
                      {(values.kpiNotes ?? '').length} / 300
                    </Typography>
                  </Box>
                </SectionCard>

                {/* Extra */}
                <SectionCard title="Anything else?">
                  <Typography component="label" sx={labelSx}>
                    Additional context or requirements
                  </Typography>
                  <Typography sx={hintSx}>
                    Budget range, key messages, content do's & don'ts, past campaigns — anything
                    useful for our team.
                  </Typography>
                  <RHFTextField
                    name="extraNotes"
                    multiline
                    minRows={3}
                    placeholder="Optional notes…"
                    inputProps={{ maxLength: 500 }}
                    sx={{
                      ...fieldSx,
                      '& .MuiOutlinedInput-root': {
                        ...fieldSx['& .MuiOutlinedInput-root'],
                        padding: '9px 13px',
                      },
                    }}
                  />
                  <Typography
                    sx={{ fontSize: 11, color: BRAND.mute4, textAlign: 'right', mt: '4px' }}
                  >
                    {(values.extraNotes ?? '').length} / 500
                  </Typography>
                </SectionCard>

                {/* Actions */}
                <Stack direction="row" spacing="10px" justifyContent="flex-end" sx={{ mt: '6px' }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={clearForm}
                    disabled={isSubmitting}
                    sx={{
                      textTransform: 'none',
                      px: '20px',
                      py: '10px',
                      fontSize: 14,
                      fontWeight: 400,
                      borderRadius: '8px',
                      border: `0.5px solid ${BRAND.hairline2}`,
                      color: BRAND.mute,
                      bgcolor: 'transparent',
                      '&:hover': { bgcolor: BRAND.hover, border: `0.5px solid ${BRAND.hairline2}` },
                    }}
                  >
                    Clear form
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    sx={{
                      textTransform: 'none',
                      px: '24px',
                      py: '10px',
                      fontSize: 14,
                      fontWeight: 500,
                      borderRadius: '8px',
                      bgcolor: BRAND.blue,
                      color: '#fff',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: BRAND.blue, opacity: 0.88, boxShadow: 'none' },
                    }}
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit brief →'}
                  </Button>
                </Stack>
              </FormProvider>
            </>
          )}
      </Box>
    </Box>
  );
}

BDBriefForm.propTypes = {
  token: PropTypes.string.isRequired,
};
