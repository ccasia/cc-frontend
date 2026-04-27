import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import GlobalStyles from '@mui/material/GlobalStyles';

import axiosInstance, { endpoints } from 'src/utils/axios';
import { useSnackbar } from 'notistack';
import FormProvider, { RHFTextField, RHFDatePicker } from 'src/components/hook-form';
import { RHFSelect, RHFMultiSelect } from 'src/components/hook-form/rhf-select';
import { langList } from 'src/contants/language';
import { countriesCities } from 'src/contants/countries';
import { interestsLists } from 'src/contants/interestLists';

/* ─────────────────────────────────────────
   Design tokens
───────────────────────────────────────── */
const T = {
  ink: '#0a0910',
  ink2: '#3a3848',
  ink3: '#9896a8',
  off: '#f6f5f1',
  white: '#ffffff',
  border: '#e5e3ee',
  purple: '#8a5afe',
  blue: '#1340ff',
  grad: 'linear-gradient(135deg, #8a5afe, #1340ff)',
  panel: '#09080f',
  sans: '"Inter Display", Inter, sans-serif',
  serif: '"Instrument Serif", serif',
  dm: '"Inter Display", Inter, sans-serif',
};

/* ─────────────────────────────────────────
   Data
───────────────────────────────────────── */

const OBJECTIVES = [
  {
    val: 'Brand Awareness (Introduce brands to new audiences)',
    title: 'Brand awareness',
    desc: 'Introduce your brand to a new audience',
  },
  {
    val: 'Product Launch (Generate buzz for new product/service)',
    title: 'Product launch',
    desc: 'Generate buzz for a new product or service',
  },
  {
    val: 'Education (Educate audiences about product category)',
    title: 'Education',
    desc: 'Educate audiences about your brand or product',
  },
  {
    val: "Community Building (Foster a loyal community around the brand's values or lifestyle)",
    title: 'Community building',
    desc: 'Foster loyalty around your brand values',
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

const STEPS = [
  { key: 'brand', label: 'Brand', check: (v) => v.brandName?.trim() && v.industry },
  { key: 'timeline', label: 'Timeline', check: (v) => v.dateFrom && v.dateTo },
  {
    key: 'objectives',
    label: 'Objectives',
    check: (v) => (v.secondaryObjectives ?? []).length > 0,
  },
  { key: 'kpis', label: 'KPIs', check: (v) => (v.kpis ?? []).length > 0 },
  { key: 'details', label: 'Details', check: () => true },
];

/* ─────────────────────────────────────────
   Validation schema (unchanged)
───────────────────────────────────────── */
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
  secondaryObjectives: Yup.array()
    .of(Yup.string())
    .min(2, 'Please select 2 campaign objectives.')
    .max(2, 'Please select only 2 campaign objectives.')
    .required('Please select 2 campaign objectives.'),
  kpis: Yup.array()
    .of(Yup.string())
    .min(1, 'Please select at least one KPI.')
    .required('Please select at least one KPI.'),
  kpiNotes: Yup.string().max(300),
  extraNotes: Yup.string().max(500),
  gender: Yup.array().of(Yup.string()),
  age: Yup.array().of(Yup.string()),
  country: Yup.string(),
  language: Yup.array().of(Yup.string()),
  creatorPersona: Yup.array().of(Yup.string()),
  userPersona: Yup.string().max(500),
  geographicFocus: Yup.string().max(200),
  brandGuidelines: Yup.mixed().nullable(),
});

const defaultValues = {
  brandName: '',
  industry: '',
  dateFrom: null,
  dateTo: null,
  secondaryObjectives: [],
  kpis: [],
  kpiNotes: '',
  extraNotes: '',
  gender: [],
  age: [],
  country: '',
  language: [],
  creatorPersona: [],
  userPersona: '',
  geographicFocus: '',
  brandGuidelines: null,
};

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'nonbinary', label: 'Non-Binary' },
];
const AGE_OPTIONS = [
  { value: '18-25', label: '18-25' },
  { value: '26-34', label: '26-34' },
  { value: '35-40', label: '35-40' },
  { value: '>40', label: '>40' },
];
const LANGUAGE_OPTIONS = (() => {
  const preferred = ['Malay', 'English'];
  const rest = [...langList]
    .filter((l) => !preferred.includes(l))
    .sort((a, b) => a.localeCompare(b));
  return [...preferred, ...rest];
})();
const COUNTRY_OPTIONS = Object.keys(countriesCities).sort((a, b) => a.localeCompare(b));
const GEOGRAPHIC_FOCUS_OPTIONS = ['SEA Region', 'Global', 'Others'];
const CREATOR_PERSONA_OPTIONS = interestsLists.map((item) => ({
  value: item.toLowerCase(),
  label: item,
}));

/* ─────────────────────────────────────────
   Shared input sx — underline style, no box
───────────────────────────────────────── */
const noBoxSx = {
  '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    fontFamily: T.dm,
    fontSize: 16,
    color: T.ink,
    padding: 0,
    background: 'transparent',
  },
  '& .MuiOutlinedInput-input': {
    padding: '10px 0 12px',
    fontFamily: T.dm,
    fontSize: 16,
    color: T.ink,
    '&::placeholder': { color: T.ink3, fontWeight: 300, opacity: 1 },
  },
  '& .MuiInputBase-inputMultiline': {
    padding: '10px 0 12px',
    fontFamily: T.dm,
    '&::placeholder': { color: T.ink3, fontWeight: 300, opacity: 1 },
  },
  '& .MuiSelect-select:has(em)': {
    color: T.ink3,
    fontWeight: 300,
  },
  '& .MuiSelect-select em': {
    color: T.ink3,
    fontWeight: 300,
    fontStyle: 'normal',
  },
  '& .MuiSelect-icon': { right: 0 },
};

/* Placeholder renderer for RHFSelect — displays greyed text when empty. */
const selectPlaceholder = (placeholder) => (selected) => {
  if (!selected) {
    return (
      <Box component="span" sx={{ color: T.ink3, fontWeight: 300 }}>
        {placeholder}
      </Box>
    );
  }
  return selected;
};

/* ─────────────────────────────────────────
   FieldWrap — adds animated gradient underline
───────────────────────────────────────── */
function FieldWrap({ children }) {
  return (
    <Box
      sx={{
        position: 'relative',
        borderBottom: `1.5px solid ${T.border}`,
        transition: 'border-color 0.2s',
        '&:focus-within': { borderBottomColor: 'transparent' },
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-1px',
          left: '50%',
          right: '50%',
          height: '2px',
          background: T.grad,
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1), right 0.3s cubic-bezier(0.4,0,0.2,1)',
          borderRadius: '2px',
          pointerEvents: 'none',
        },
        '&:focus-within::after': { left: 0, right: 0 },
      }}
    >
      {children}
    </Box>
  );
}
FieldWrap.propTypes = { children: PropTypes.node };

/* ─────────────────────────────────────────
   AnimSec — fade-up on scroll
───────────────────────────────────────── */
function AnimSec({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <Box
      ref={ref}
      sx={{
        mb: '72px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
    </Box>
  );
}
AnimSec.propTypes = { children: PropTypes.node, delay: PropTypes.number };

/* ─────────────────────────────────────────
   InlineCheckIcon
───────────────────────────────────────── */
function CheckSvg({ stroke = 'currentColor', size = 9 }) {
  return (
    <Box
      component="svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </Box>
  );
}
CheckSvg.propTypes = { stroke: PropTypes.string, size: PropTypes.number };

/* ─────────────────────────────────────────
   FieldLabel
───────────────────────────────────────── */
function FieldLabel({ children, required }) {
  return (
    <Stack direction="row" alignItems="center" gap="5px" sx={{ mb: '10px' }}>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          color: T.ink2,
          fontFamily: T.sans,
        }}
      >
        {children}
      </Typography>
      {required && (
        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: T.purple, flexShrink: 0 }} />
      )}
    </Stack>
  );
}
FieldLabel.propTypes = { children: PropTypes.node, required: PropTypes.bool };

/* ─────────────────────────────────────────
   ErrorMsg
───────────────────────────────────────── */
function ErrMsg({ message }) {
  if (!message) return null;
  return (
    <Stack direction="row" alignItems="center" gap="5px" sx={{ mt: '6px' }}>
      <Box
        component="svg"
        width={11}
        height={11}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#dc2626"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </Box>
      <Typography sx={{ fontSize: 12, color: '#dc2626', fontFamily: T.dm }}>{message}</Typography>
    </Stack>
  );
}
ErrMsg.propTypes = { message: PropTypes.string };

/* ─────────────────────────────────────────
   SectionHeader — with ghost number
───────────────────────────────────────── */
function SectionHeader({ num, tag, title, sub }) {
  return (
    <Box sx={{ position: 'relative', mb: { xs: '16px', md: '20px' } }}>
      {/* Ghost number */}
      <Typography
        sx={{
          position: 'absolute',
          top: { xs: '-8px', md: '-14px' },
          right: 0,
          fontSize: { xs: 44, sm: 56, md: 80 },
          fontWeight: 700,
          lineHeight: 1,
          background: T.grad,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          opacity: 0.1,
          letterSpacing: '-4px',
          pointerEvents: 'none',
          fontFamily: T.sans,
          userSelect: 'none',
        }}
      >
        {num}
      </Typography>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: T.ink3,
          mb: '10px',
          fontFamily: T.sans,
        }}
      >
        {tag}
      </Typography>
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: 22, md: 24 },
          fontWeight: 700,
          color: T.ink,
          letterSpacing: '-0.6px',
          lineHeight: 1.15,
          mb: '6px',
          fontFamily: T.sans,
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{ fontSize: { xs: 13, md: 13.5 }, color: T.ink3, lineHeight: 1.7, fontFamily: T.dm }}
      >
        {sub}
      </Typography>
    </Box>
  );
}
SectionHeader.propTypes = {
  num: PropTypes.string,
  tag: PropTypes.string,
  title: PropTypes.string,
  sub: PropTypes.string,
};

/* ─────────────────────────────────────────
   ChipToggle — small pill multi-select
───────────────────────────────────────── */
function ChipToggle({ active, onClick, children }) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        fontFamily: T.dm,
        px: '16px',
        py: '8px',
        borderRadius: '100px',
        border: `1.5px solid ${active ? 'transparent' : T.border}`,
        background: active ? T.grad : T.white,
        color: active ? 'white' : T.ink2,
        fontSize: 13,
        fontWeight: 400,
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: active ? '0 4px 16px rgba(138,90,254,.3)' : 'none',
        '&:hover': {
          borderColor: active ? 'transparent' : '#ccc9e0',
          color: active ? 'white' : T.ink,
          transform: 'translateY(-1px)',
        },
      }}
    >
      {children}
    </Box>
  );
}
ChipToggle.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

/* ─────────────────────────────────────────
   FileDrop — minimal file input styled
───────────────────────────────────────── */
function FileDrop({ label, accept, file, onChange, hint }) {
  const inputRef = useRef(null);
  return (
    <Box>
      <FieldLabel>{label}</FieldLabel>
      {hint && (
        <Typography
          sx={{ fontSize: 12, color: T.ink3, mb: '8px', lineHeight: 1.6, fontFamily: T.dm }}
        >
          {hint}
        </Typography>
      )}
      <Box
        component="button"
        type="button"
        onClick={() => inputRef.current?.click()}
        sx={{
          width: '100%',
          fontFamily: T.dm,
          textAlign: 'left',
          px: '16px',
          py: '14px',
          bgcolor: T.white,
          border: `1.5px solid ${file ? T.purple : T.border}`,
          borderRadius: '12px',
          fontSize: 13,
          color: file ? T.ink : T.ink3,
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          '&:hover': { borderColor: T.purple, color: T.ink },
        }}
      >
        <Box
          component="span"
          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {file ? file.name : 'Click to choose a file'}
        </Box>
        {file ? (
          <Box
            component="span"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            sx={{
              fontSize: 11,
              color: T.ink3,
              fontWeight: 600,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
              '&:hover': { color: T.ink },
            }}
          >
            Remove
          </Box>
        ) : (
          <Box
            component="span"
            sx={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: T.purple,
            }}
          >
            Browse
          </Box>
        )}
      </Box>
      <Box
        component="input"
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        sx={{ display: 'none' }}
      />
    </Box>
  );
}
FileDrop.propTypes = {
  label: PropTypes.string,
  accept: PropTypes.string,
  file: PropTypes.object,
  onChange: PropTypes.func,
  hint: PropTypes.string,
};

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function BDBriefForm({ token }) {
  const { enqueueSnackbar } = useSnackbar();
  const [bdName, setBdName] = useState(null);
  const [lookupError, setLookupError] = useState(false);
  const [submittedRows, setSubmittedRows] = useState(null);
  const [extraOpen, setExtraOpen] = useState(false);

  const methods = useForm({ resolver: yupResolver(schema), defaultValues, mode: 'onTouched' });
  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = methods;
  const values = watch();

  /* Google Fonts */
  useEffect(() => {
    const id = 'cc-design-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,700&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap';
    document.head.appendChild(link);
  }, []);

  /* BD lookup */
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

  /* body background */
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = T.off;
    return () => {
      document.body.style.background = prev;
    };
  }, []);

  /* stepper active step */
  const activeStep = STEPS.findIndex((s) => !s.check(values));
  const progressSteps = STEPS.slice(0, -1);
  const completedSteps = progressSteps.filter((s) => s.check(values)).length;
  const progressPct = Math.round((completedSteps / progressSteps.length) * 100);

  /* toggles */
  const toggleKpi = (k) => {
    const s = new Set(values.kpis ?? []);
    if (s.has(k)) s.delete(k);
    else s.add(k);
    setValue('kpis', Array.from(s), { shouldValidate: true });
  };
  const toggleArrField = (name, val) => {
    const s = new Set(values[name] ?? []);
    if (s.has(val)) s.delete(val);
    else s.add(val);
    setValue(name, Array.from(s), { shouldValidate: false });
  };
  const toggleObjective = (v) => {
    const cur = values.secondaryObjectives ?? [];
    if (cur.includes(v)) {
      setValue(
        'secondaryObjectives',
        cur.filter((x) => x !== v),
        { shouldValidate: true }
      );
      return;
    }
    if (cur.length >= 2) return;
    setValue('secondaryObjectives', [...cur, v], { shouldValidate: true });
  };

  /* submit */
  const onSubmit = handleSubmit(
    async (data) => {
      const payload = {
        brandName: data.brandName.trim(),
        industry: data.industry,
        postingStart: data.dateFrom ? dayjs(data.dateFrom).toISOString() : null,
        postingEnd: data.dateTo ? dayjs(data.dateTo).toISOString() : null,
        primaryGoal: 'Awareness',
        secondaryObjectives: data.secondaryObjectives ?? [],
        kpis: data.kpis ?? [],
        kpiNotes: data.kpiNotes?.trim() || null,
        additionalInfo: data.extraNotes?.trim() || null,
      };
      const audiencePayload = {
        gender: data.gender ?? [],
        age: data.age ?? [],
        country: data.country?.trim() || '',
        language: data.language ?? [],
        creator_persona: data.creatorPersona ?? [],
        user_persona: data.userPersona?.trim() || '',
        geographic_focus: data.geographicFocus?.trim() || '',
      };
      const hasFiles = !!data.brandGuidelines;
      try {
        if (hasFiles) {
          const fd = new FormData();
          Object.entries(payload).forEach(([k, v]) => {
            if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
            else if (v !== null && v !== undefined) fd.append(k, v);
          });
          Object.entries(audiencePayload).forEach(([k, v]) => {
            if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
            else if (v) fd.append(k, v);
          });
          fd.append('brandGuidelines', data.brandGuidelines);
          await axiosInstance.post(endpoints.bd.publicSubmit(token), fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          await axiosInstance.post(endpoints.bd.publicSubmit(token), {
            ...payload,
            ...audiencePayload,
          });
        }
        const rows = [
          ['Brand', payload.brandName],
          ['Industry', payload.industry],
          ['Timeline', `${data.dateFrom || 'TBD'} → ${data.dateTo || 'TBD'}`],
          ['Objectives', payload.secondaryObjectives.join(', ')],
        ];
        if (payload.kpis.length) rows.push(['KPIs', payload.kpis.join(', ')]);
        if (payload.kpiNotes) rows.push(['KPI notes', payload.kpiNotes]);
        if (payload.additionalInfo) rows.push(['Additional context', payload.additionalInfo]);
        setSubmittedRows(rows);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
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

  /* ── Error page ── */
  if (lookupError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          bgcolor: T.off,
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            p: '3rem 2rem',
            bgcolor: T.white,
            border: `1.5px solid ${T.border}`,
            borderRadius: '16px',
            maxWidth: 440,
          }}
        >
          <Typography
            sx={{ fontSize: 20, fontWeight: 700, mb: 1, color: T.ink, fontFamily: T.sans }}
          >
            Link not valid
          </Typography>
          <Typography sx={{ fontSize: 14, color: T.ink3, lineHeight: 1.6, fontFamily: T.dm }}>
            This invite link isn&apos;t valid anymore. Please ask your contact at Cult Creative for
            a new one.
          </Typography>
        </Box>
      </Box>
    );
  }

  /* ════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '480px 1fr' },
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflowX: 'clip',
      }}
    >
      {/* ══════════════════════════════
          LEFT PANEL
      ══════════════════════════════ */}
      <Box
        component="aside"
        sx={{
          bgcolor: T.panel,
          position: { xs: 'relative', lg: 'sticky' },
          top: { lg: 0 },
          height: { xs: 'auto', lg: '100vh' },
          display: 'flex',
          flexDirection: 'column',
          p: { xs: '26px 18px 24px', sm: '30px 22px 30px', lg: '44px 48px 40px' },
          overflow: 'hidden',
        }}
      >
        {/* Animated aurora blobs */}
        {[
          {
            sx: {
              width: { xs: 280, md: 480 },
              height: { xs: 280, md: 480 },
              background: 'radial-gradient(circle, rgba(138,90,254,.65) 0%, transparent 70%)',
              top: -120,
              left: -80,
              animation: 'blob1 14s ease-in-out infinite alternate',
            },
          },
          {
            sx: {
              width: { xs: 240, md: 400 },
              height: { xs: 240, md: 400 },
              background: 'radial-gradient(circle, rgba(19,64,255,.6) 0%, transparent 70%)',
              bottom: -100,
              right: -60,
              animation: 'blob2 18s ease-in-out infinite alternate',
            },
          },
          {
            sx: {
              width: { xs: 200, md: 300 },
              height: { xs: 200, md: 300 },
              background: 'radial-gradient(circle, rgba(138,90,254,.4) 0%, transparent 70%)',
              top: '42%',
              left: '52%',
              animation: 'blob3 11s ease-in-out infinite alternate',
            },
          },
          {
            sx: {
              width: { xs: 160, md: 220 },
              height: { xs: 160, md: 220 },
              background: 'radial-gradient(circle, rgba(19,64,255,.35) 0%, transparent 70%)',
              top: '18%',
              right: -10,
              animation: 'blob4 9s ease-in-out infinite alternate',
            },
          },
        ].map((blob, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              borderRadius: '50%',
              filter: 'blur(80px)',
              pointerEvents: 'none',
              willChange: 'transform',
              '@keyframes blob1': {
                '0%': { transform: 'translate(0,0) scale(1)' },
                '35%': { transform: 'translate(55px,80px) scale(1.1)' },
                '70%': { transform: 'translate(-30px,40px) scale(.93)' },
                '100%': { transform: 'translate(75px,-45px) scale(1.06)' },
              },
              '@keyframes blob2': {
                '0%': { transform: 'translate(0,0) scale(1)' },
                '25%': { transform: 'translate(-65px,-55px) scale(1.12)' },
                '65%': { transform: 'translate(45px,-75px) scale(.91)' },
                '100%': { transform: 'translate(-55px,55px) scale(1.08)' },
              },
              '@keyframes blob3': {
                '0%': { transform: 'translate(0,0) scale(1)' },
                '45%': { transform: 'translate(-85px,65px) scale(1.14)' },
                '100%': { transform: 'translate(65px,-75px) scale(.88)' },
              },
              '@keyframes blob4': {
                '0%': { transform: 'translate(0,0) scale(1)' },
                '55%': { transform: 'translate(-55px,80px) scale(1.18)' },
                '100%': { transform: 'translate(35px,-55px) scale(.85)' },
              },
              ...blob.sx,
            }}
          />
        ))}

        {/* Noise overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Panel content (above blobs) */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src="/Cult Creative Logo.svg"
            alt="Cult Creative"
            sx={{
              width: { xs: 122, md: 150 },
              height: 'auto',
            }}
          />

          {/* Hero text */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              py: { xs: '28px', lg: '36px 0 28px' },
            }}
          >
            <Typography
              sx={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,.55)',
                mb: '16px',
                fontFamily: T.sans,
              }}
            >
              Content Strategy Intake
            </Typography>

            <Typography
              component="h1"
              sx={{
                fontSize: { xs: 38, lg: 'clamp(38px, 4vw, 58px)' },
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.03,
                letterSpacing: '-2px',
                mb: '18px',
                fontFamily: T.sans,
              }}
            >
              Let&apos;s build
              <br />
              <Box
                component="em"
                sx={{
                  display: 'block',
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  background: T.grad,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-1px',
                }}
              >
                your campaign.
              </Box>
            </Typography>

            <Typography
              sx={{
                fontSize: 13.5,
                color: 'rgba(255,255,255,.62)',
                lineHeight: 1.8,
                maxWidth: { xs: '100%', md: 280 },
                mb: { xs: '20px', lg: '36px' },
                fontFamily: T.dm,
              }}
            >
              Fill in your brief and our team will prepare a tailored content strategy and creator
              recommendations — no commitment required.
            </Typography>

            {/* Process steps */}
            <Box
              sx={{
                borderTop: '1px solid rgba(255,255,255,.07)',
                display: { xs: 'none', md: 'block' },
              }}
            >
              {[
                ['Share your brief', 'Tell us your goals, audience, and budget'],
                [
                  'Get strategy + shortlist',
                  'Our team maps your plan and recommends suitable creators',
                ],
                [
                  'Launch with confidence',
                  'Approve the direction and we help you go live smoothly',
                ],
              ].map(([title, desc], i) => (
                <Stack
                  key={i}
                  direction="row"
                  alignItems="flex-start"
                  gap="13px"
                  sx={{ py: '15px', borderBottom: '1px solid rgba(255,255,255,.07)' }}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,.18)',
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(255,255,255,.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: '2px',
                      fontFamily: T.sans,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Box>
                    <Typography
                      sx={{
                        display: 'block',
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,.7)',
                        mb: '2px',
                        fontFamily: T.sans,
                      }}
                    >
                      {title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 11.5,
                        color: 'rgba(255,255,255,.56)',
                        lineHeight: 1.5,
                        fontFamily: T.dm,
                      }}
                    >
                      {desc}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Box>
          </Box>

          {/* Trust 2×2 grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1px',
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.07)',
              borderRadius: '12px',
              overflow: 'hidden',
              mt: 'auto',
              minHeight: 0,
              display: { xs: 'none', lg: 'grid' },
            }}
          >
            {[
              ['400+', 'Campaigns Launched'],
              ['600K+', 'Total Reach Across Campaigns'],
              ['3.7K+', 'Creators On Our Platform'],
              ['1.9M+', 'Creator Payments Processed'],
            ].map(([num, label], i) => (
              <Box
                key={i}
                sx={{
                  bgcolor: 'rgba(255,255,255,.025)',
                  p: '14px 16px',
                  borderTop: i >= 2 ? '1px solid rgba(255,255,255,.07)' : undefined,
                  borderLeft: i % 2 === 1 ? '1px solid rgba(255,255,255,.07)' : undefined,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'white',
                    letterSpacing: '-0.8px',
                    lineHeight: 1,
                    mb: '3px',
                    fontFamily: T.sans,
                  }}
                >
                  {num}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10.5,
                    color: 'rgba(255,255,255,.58)',
                    fontWeight: 500,
                    fontFamily: T.sans,
                  }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ══════════════════════════════
          RIGHT FORM SIDE
      ══════════════════════════════ */}
      <Box
        component="main"
        sx={{
          bgcolor: T.off,
          position: 'relative',
          minWidth: 0,
          width: '100%',
          // subtle purple tint at left edge
          '&::before': {
            content: '""',
            position: 'fixed',
            left: { xs: 0, lg: '480px' },
            top: 0,
            width: '120px',
            height: '100vh',
            background: 'linear-gradient(to right, rgba(138,90,254,.06), transparent)',
            pointerEvents: 'none',
            zIndex: 0,
            display: { xs: 'none', lg: 'block' },
          },
        }}
      >
        {/* ── Named stepper bar ── */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            bgcolor: 'rgba(246,245,241,.93)',
            backdropFilter: 'blur(16px)',
            borderBottom: `1px solid ${T.border}`,
            px: { xs: '14px', sm: '20px', md: '52px' },
          }}
        >
          <Box sx={{ py: '12px' }}>
            <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: '8px' }}>
              {/* <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: T.blue, fontFamily: T.sans }}>
                {progressPct}%
              </Typography> */}
            </Stack>

            <Box
              sx={{
                width: '100%',
                height: 8,
                borderRadius: '999px',
                bgcolor: '#e9e7f2',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${progressPct}%`,
                  height: '100%',
                  borderRadius: '999px',
                  background: 'linear-gradient(90deg, #8a5afe 0%, #1340ff 100%)',
                  transition: 'width 0.35s ease',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* ── SUCCESS SCREEN ── */}
        {submittedRows ? (
          <Box
            sx={{
              p: { xs: '46px 18px 60px', sm: '60px 20px', md: '80px 52px' },
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              minHeight: { xs: 'auto', md: '80vh' },
              position: 'relative',
              zIndex: 1,
              animation: 'fadeUpSuccess 0.6s ease forwards',
              '@keyframes fadeUpSuccess': {
                from: { opacity: 0, transform: 'translateY(24px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {/* Check icon */}
            <Box
              sx={{
                width: 56,
                height: 56,
                background: T.grad,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: '28px',
                boxShadow: '0 8px 32px rgba(138,90,254,.35)',
              }}
            >
              <Box
                component="svg"
                width={24}
                height={24}
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </Box>
            </Box>

            <Typography
              component="h2"
              sx={{
                fontSize: { xs: 30, md: 44 },
                fontWeight: 700,
                color: T.ink,
                letterSpacing: '-1.5px',
                lineHeight: 1.05,
                mb: '14px',
                fontFamily: T.sans,
              }}
            >
              Brief received.
              <br />
              <Box
                component="em"
                sx={{
                  fontFamily: T.serif,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  background: T.grad,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                We&apos;ll be in touch.
              </Box>
            </Typography>

            <Typography
              sx={{
                fontSize: 15,
                color: T.ink3,
                maxWidth: 380,
                lineHeight: 1.75,
                mb: '36px',
                fontFamily: T.dm,
              }}
            >
              Our team{bdName ? ` (${bdName})` : ''} will review your campaign brief and reach out
              within 1–2 business days with creator recommendations tailored to your goals.
            </Typography>

            {/* Next steps */}
            <Box sx={{ maxWidth: 380, borderTop: `1px solid ${T.border}` }}>
              {[
                'Brief reviewed by your strategist',
                'Creator shortlist prepared',
                'Strategy call scheduled',
              ].map((step, i) => (
                <Stack
                  key={i}
                  direction="row"
                  alignItems="center"
                  gap="14px"
                  sx={{ py: '16px', borderBottom: `1px solid ${T.border}` }}
                >
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: `1px solid ${T.border}`,
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.ink3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: T.sans,
                    }}
                  >
                    {i + 1}
                  </Box>
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 500, color: T.ink2, fontFamily: T.dm }}
                  >
                    {step}
                  </Typography>
                </Stack>
              ))}
            </Box>

            <Box
              component="button"
              onClick={startOver}
              sx={{
                mt: '32px',
                fontFamily: T.sans,
                fontSize: 13.5,
                fontWeight: 600,
                color: T.ink3,
                bgcolor: 'transparent',
                border: `1.5px solid ${T.border}`,
                borderRadius: '100px',
                px: '24px',
                py: '12px',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#ccc9e0', color: T.ink },
              }}
            >
              Submit another brief
            </Box>
          </Box>
        ) : (
          /* ── FORM CONTENT ── */
          <FormProvider methods={methods} onSubmit={onSubmit}>
            <GlobalStyles
              styles={{
                '.MuiMenu-paper .MuiCheckbox-root.Mui-checked': { color: `${T.blue} !important` },
                '.MuiMenu-paper .MuiCheckbox-root': { color: T.ink3 },
              }}
            />
            <Box
              sx={{
                p: { xs: '28px 16px 72px', sm: '36px 20px 80px', md: '56px 52px 100px' },
                maxWidth: { xs: '100%', lg: 920 },
                position: 'relative',
                zIndex: 1,
                // RHF field components already render MUI helper text for errors.
                // This page uses custom ErrMsg, so hide built-in helper to avoid duplicate warnings.
                '& .MuiFormHelperText-root': { display: 'none' },
              }}
            >
              {/* ── 01 BRAND ── */}
              <AnimSec delay={0}>
                <SectionHeader
                  num="01"
                  tag="Brand Info"
                  title="Who are you?"
                  sub="Tell us about your brand so we can match you with the right creators."
                />
                <Box sx={{ mb: '28px' }}>
                  <FieldLabel required>Brand name</FieldLabel>
                  <FieldWrap>
                    <RHFTextField
                      name="brandName"
                      size="small"
                      placeholder="e.g. Spritzer, Levain Bakery"
                      sx={noBoxSx}
                    />
                  </FieldWrap>
                  <ErrMsg message={errors.brandName?.message} />
                </Box>
                <Box>
                  <FieldLabel required>Industry</FieldLabel>
                  <FieldWrap>
                    <RHFSelect
                      name="industry"
                      size="small"
                      SelectProps={{
                        MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
                        displayEmpty: true,
                        sx: { textTransform: 'none' },
                        renderValue: selectPlaceholder('Select your industry'),
                      }}
                      sx={noBoxSx}
                    >
                      <MenuItem value="" disabled>
                        Select your industry
                      </MenuItem>
                      {interestsLists.map((ind) => (
                        <MenuItem key={ind} value={ind}>
                          {ind}
                        </MenuItem>
                      ))}
                    </RHFSelect>
                  </FieldWrap>
                  <ErrMsg message={errors.industry?.message} />
                </Box>
              </AnimSec>

              {/* ── 02 TIMELINE ── */}
              <AnimSec delay={60}>
                <SectionHeader
                  num="02"
                  tag="Timeline"
                  title="When does the content go live?"
                  sub="Helps us plan creator briefing, production, and review schedules."
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: '28px',
                  }}
                >
                  <Box>
                    <FieldLabel required>Earliest date</FieldLabel>
                    <FieldWrap>
                      <RHFDatePicker name="dateFrom" sx={noBoxSx} />
                    </FieldWrap>
                    <ErrMsg message={errors.dateFrom?.message} />
                  </Box>
                  <Box>
                    <FieldLabel required>Latest date</FieldLabel>
                    <FieldWrap>
                      <RHFDatePicker
                        name="dateTo"
                        sx={noBoxSx}
                        minDate={values.dateFrom ? dayjs(values.dateFrom) : undefined}
                      />
                    </FieldWrap>
                    <ErrMsg message={errors.dateTo?.message} />
                  </Box>
                </Box>
              </AnimSec>

              {/* ── 03 OBJECTIVES ── */}
              <AnimSec delay={80}>
                <SectionHeader
                  num="03"
                  tag="Campaign Objective"
                  title="Secondary objectives"
                  sub={`Select up to 2 goals for this campaign. (${(values.secondaryObjectives ?? []).length}/2 selected)`}
                />
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: '10px',
                  }}
                >
                  {OBJECTIVES.map((o) => {
                    const cur = values.secondaryObjectives ?? [];
                    const on = cur.includes(o.val);
                    const disabled = !on && cur.length >= 2;
                    return (
                      <Box
                        key={o.val}
                        onClick={() => !disabled && toggleObjective(o.val)}
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '13px',
                          p: '16px 18px',
                          border: `1.5px solid ${on ? 'transparent' : T.border}`,
                          borderRadius: '12px',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          userSelect: 'none',
                          background: on ? T.grad : T.white,
                          boxShadow: on ? '0 4px 16px rgba(138,90,254,.3)' : 'none',
                          transition:
                            'border-color 0.15s, background 0.15s, transform 0.1s, box-shadow 0.2s',
                          opacity: disabled ? 0.3 : 1,
                          '&:hover':
                            !on && !disabled
                              ? { borderColor: '#ccc9e0', transform: 'translateY(-1px)' }
                              : {},
                          '&:active': !disabled ? { transform: 'translateY(0)' } : {},
                        }}
                      >
                        {/* Checkbox */}
                        <Box
                          sx={{
                            width: 19,
                            height: 19,
                            borderRadius: '6px',
                            border: `1.5px solid ${on ? 'rgba(255,255,255,.95)' : T.border}`,
                            bgcolor: on ? 'white' : 'transparent',
                            flexShrink: 0,
                            mt: '1px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s',
                          }}
                        >
                          {on && <CheckSvg stroke={T.ink} size={9} />}
                        </Box>
                        <Box>
                          <Typography
                            sx={{
                              display: 'block',
                              fontSize: 13.5,
                              fontWeight: 600,
                              color: on ? 'white' : T.ink,
                              mb: '2px',
                              fontFamily: T.sans,
                            }}
                          >
                            {o.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 11.5,
                              color: on ? 'rgba(255,255,255,.82)' : T.ink3,
                              lineHeight: 1.4,
                              fontFamily: T.dm,
                            }}
                          >
                            {o.desc}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                <ErrMsg message={errors.secondaryObjectives?.message} />
              </AnimSec>

              {/* ── 04 KPIs ── */}
              <AnimSec delay={100}>
                <SectionHeader
                  num="04"
                  tag="KPIs & Success Metrics"
                  title="What does success look like?"
                  sub="Select all that apply — these calibrate creator tier, format, and posting strategy."
                />

                <Box sx={{ mb: '28px' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px', mb: '8px' }}>
                    {KPI_OPTIONS.map((k) => {
                      const active = values.kpis?.includes(k);
                      return (
                        <Box
                          key={k}
                          component="button"
                          type="button"
                          onClick={() => toggleKpi(k)}
                          sx={{
                            fontFamily: T.dm,
                            px: '18px',
                            py: '9px',
                            borderRadius: '100px',
                            border: `1.5px solid ${active ? 'transparent' : T.border}`,
                            background: active ? T.grad : T.white,
                            color: active ? 'white' : T.ink2,
                            fontSize: 13,
                            fontWeight: 400,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: active ? '0 4px 16px rgba(138,90,254,.3)' : 'none',
                            transform: active ? 'translateY(-1px)' : 'none',
                            '&:hover': {
                              borderColor: active ? 'transparent' : '#ccc9e0',
                              color: active ? 'white' : T.ink,
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          {k}
                        </Box>
                      );
                    })}
                  </Box>
                  <ErrMsg message={errors.kpis?.message} />
                </Box>

                <Box>
                  <FieldLabel>Specific targets or context</FieldLabel>
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: T.ink3,
                      mb: '8px',
                      lineHeight: 1.6,
                      fontFamily: T.dm,
                    }}
                  >
                    e.g. &quot;500k views per video&quot; or &quot;200 store visits over the
                    campaign period&quot;
                  </Typography>
                  <FieldWrap>
                    <RHFTextField
                      name="kpiNotes"
                      multiline
                      placeholder="Describe your targets here…"
                      inputProps={{ maxLength: 300 }}
                      sx={noBoxSx}
                    />
                  </FieldWrap>
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: T.ink3,
                      textAlign: 'right',
                      mt: '5px',
                      fontFamily: T.dm,
                      fontWeight: 300,
                    }}
                  >
                    {(values.kpiNotes ?? '').length} / 300
                  </Typography>
                </Box>
              </AnimSec>

              <AnimSec delay={120}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => setExtraOpen((v) => !v)}
                  sx={{
                    width: '100%',
                    textAlign: 'left',
                    bgcolor: 'transparent',
                    border: 'none',
                    p: 0,
                    cursor: 'pointer',
                    display: 'block',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '16px',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <SectionHeader
                        num="05"
                        tag="Anything Else?"
                        title="Additional context (optional)"
                        sub="Target audience, attachments, budget range, key messages, content do's & don'ts, past campaigns — anything useful for our team."
                      />
                    </Box>
                    <Box
                      component="svg"
                      width={20}
                      height={20}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={T.ink2}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      sx={{
                        mt: { xs: '6px', md: '10px' },
                        flexShrink: 0,
                        transform: extraOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </Box>
                  </Box>
                </Box>

                <Box
                  sx={{
                    overflow: 'hidden',
                    maxHeight: extraOpen ? '4000px' : 0,
                    opacity: extraOpen ? 1 : 0,
                    transition: extraOpen
                      ? 'max-height 0.5s ease, opacity 0.35s ease 0.1s'
                      : 'max-height 0.35s ease, opacity 0.2s ease',
                  }}
                >
                  <Stack spacing="32px" sx={{ mt: '8px' }}>
                    {/* Additional notes */}
                    <Box>
                      <FieldLabel>Additional notes</FieldLabel>
                      <FieldWrap>
                        <RHFTextField
                          name="extraNotes"
                          multiline
                          placeholder="Optional notes…"
                          inputProps={{ maxLength: 500 }}
                          sx={noBoxSx}
                        />
                      </FieldWrap>
                      <Typography
                        sx={{
                          fontSize: 11,
                          color: T.ink3,
                          textAlign: 'right',
                          mt: '5px',
                          fontFamily: T.dm,
                          fontWeight: 300,
                        }}
                      >
                        {(values.extraNotes ?? '').length} / 500
                      </Typography>
                    </Box>

                    {/* Target Audience */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          color: T.ink3,
                          mb: '14px',
                          fontFamily: T.sans,
                        }}
                      >
                        Target audience
                      </Typography>

                      <Stack spacing="24px">
                        <Box>
                          <FieldLabel>Gender</FieldLabel>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {GENDER_OPTIONS.map((g) => (
                              <ChipToggle
                                key={g.value}
                                active={values.gender?.includes(g.value)}
                                onClick={() => toggleArrField('gender', g.value)}
                              >
                                {g.label}
                              </ChipToggle>
                            ))}
                          </Box>
                        </Box>

                        <Box>
                          <FieldLabel>Age range</FieldLabel>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {AGE_OPTIONS.map((a) => (
                              <ChipToggle
                                key={a.value}
                                active={values.age?.includes(a.value)}
                                onClick={() => toggleArrField('age', a.value)}
                              >
                                {a.label}
                              </ChipToggle>
                            ))}
                          </Box>
                        </Box>

                        <Box>
                          <FieldLabel>Country</FieldLabel>
                          <FieldWrap>
                            <RHFSelect
                              name="country"
                              size="small"
                              SelectProps={{
                                displayEmpty: true,
                                sx: { textTransform: 'none' },
                                MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
                                renderValue: selectPlaceholder('Select a country'),
                              }}
                              sx={noBoxSx}
                            >
                              <MenuItem value="" disabled>
                                Select a country
                              </MenuItem>
                              {COUNTRY_OPTIONS.map((c) => (
                                <MenuItem key={c} value={c}>
                                  {c}
                                </MenuItem>
                              ))}
                            </RHFSelect>
                          </FieldWrap>
                        </Box>

                        <Box>
                          <FieldLabel>Language</FieldLabel>
                          <FieldWrap>
                            <RHFMultiSelect
                              name="language"
                              checkbox
                              size="small"
                              placeholder="Select one or more languages"
                              options={LANGUAGE_OPTIONS.map((l) => ({ value: l, label: l }))}
                              MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                              sx={{
                                width: '100%',
                                ...noBoxSx,
                                '& .MuiOutlinedInput-root': {
                                  ...noBoxSx['& .MuiOutlinedInput-root'],
                                  width: '100%',
                                },
                                // Match RHFSelect size="small" dimensions + font
                                '& .MuiSelect-select': {
                                  padding: '10px 0 12px',
                                  minHeight: 'auto',
                                  fontSize: 16,
                                  fontFamily: T.dm,
                                  color: T.ink,
                                  fontWeight: 400,
                                },
                                // Grey out placeholder Box rendered by RHFMultiSelect
                                '& .MuiSelect-select > .MuiBox-root': {
                                  color: T.ink3,
                                  fontWeight: 300,
                                },
                              }}
                            />
                          </FieldWrap>
                        </Box>

                        <Box>
                          <FieldLabel>Creator&apos;s interest</FieldLabel>
                          <FieldWrap>
                            <RHFMultiSelect
                              name="creatorPersona"
                              checkbox
                              size="small"
                              placeholder="Select one or more interests"
                              options={CREATOR_PERSONA_OPTIONS}
                              MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                              sx={{
                                width: '100%',
                                ...noBoxSx,
                                '& .MuiOutlinedInput-root': {
                                  ...noBoxSx['& .MuiOutlinedInput-root'],
                                  width: '100%',
                                },
                                '& .MuiSelect-select': {
                                  padding: '10px 0 12px',
                                  minHeight: 'auto',
                                  fontSize: 16,
                                  fontFamily: T.dm,
                                  color: T.ink,
                                  fontWeight: 400,
                                },
                                '& .MuiSelect-select > .MuiBox-root': {
                                  color: T.ink3,
                                  fontWeight: 300,
                                },
                              }}
                            />
                          </FieldWrap>
                        </Box>

                        <Box>
                          <FieldLabel>User persona</FieldLabel>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: T.ink3,
                              mb: '8px',
                              lineHeight: 1.6,
                              fontFamily: T.dm,
                            }}
                          >
                            Who is your ideal customer?
                          </Typography>
                          <FieldWrap>
                            <RHFTextField
                              name="userPersona"
                              multiline
                              // minRows={2}
                              placeholder="e.g. Young urban professionals interested in wellness"
                              inputProps={{ maxLength: 500 }}
                              sx={noBoxSx}
                            />
                          </FieldWrap>
                        </Box>

                        <Box>
                          <FieldLabel>Geographic focus</FieldLabel>
                          <FieldWrap>
                            <RHFSelect
                              name="geographicFocus"
                              size="small"
                              SelectProps={{
                                displayEmpty: true,
                                sx: { textTransform: 'none' },
                                MenuProps: { PaperProps: { sx: { maxHeight: 320 } } },
                                renderValue: selectPlaceholder('Select a geographic focus'),
                              }}
                              sx={noBoxSx}
                            >
                              <MenuItem value="" disabled>
                                Select a geographic focus
                              </MenuItem>
                              {GEOGRAPHIC_FOCUS_OPTIONS.map((g) => (
                                <MenuItem key={g} value={g}>
                                  {g}
                                </MenuItem>
                              ))}
                            </RHFSelect>
                          </FieldWrap>
                        </Box>
                      </Stack>
                    </Box>

                    {/* Attachments */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '2px',
                          textTransform: 'uppercase',
                          color: T.ink3,
                          mb: '14px',
                          fontFamily: T.sans,
                        }}
                      >
                        Attachments
                      </Typography>

                      <Stack>
                        <FileDrop
                          label="Brand guidelines"
                          accept="application/pdf,image/jpeg,image/png"
                          file={values.brandGuidelines}
                          onChange={(f) =>
                            setValue('brandGuidelines', f, { shouldValidate: false })
                          }
                          hint="PDF, JPG or PNG — max 10MB"
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </AnimSec>

              {/* ── SUBMIT ── */}
              <AnimSec delay={140}>
                <Box
                  sx={{
                    borderTop: `1px solid ${T.border}`,
                    pt: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} gap="12px">
                    <Box
                      component="button"
                      type="button"
                      onClick={clearForm}
                      disabled={isSubmitting}
                      sx={{
                        fontFamily: T.sans,
                        width: { xs: '100%', sm: 'auto' },
                        px: '24px',
                        py: '15px',
                        bgcolor: 'transparent',
                        border: `1.5px solid ${T.border}`,
                        borderRadius: '100px',
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: T.ink3,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                        '&:hover': { borderColor: '#ccc9e0', color: T.ink },
                        '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
                      }}
                    >
                      Clear form
                    </Box>

                    <Box
                      component="button"
                      type="submit"
                      disabled={isSubmitting}
                      sx={{
                        fontFamily: T.sans,
                        flex: 1,
                        width: { xs: '100%', sm: 'auto' },
                        px: '32px',
                        py: '16px',
                        background: T.grad,
                        border: 'none',
                        borderRadius: '100px',
                        fontSize: 14.5,
                        fontWeight: 700,
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '9px',
                        letterSpacing: '-0.2px',
                        boxShadow: '0 4px 24px rgba(138,90,254,.35)',
                        transition: 'all 0.2s',
                        '&:hover': {
                          opacity: 0.92,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 32px rgba(138,90,254,.45)',
                        },
                        '&:active': { transform: 'none' },
                        '&:disabled': { opacity: 0.6, cursor: 'not-allowed', transform: 'none' },
                        '&:hover svg': { transform: 'translateX(3px)' },
                      }}
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit brief'}
                      {!isSubmitting && (
                        <Box
                          component="svg"
                          width={15}
                          height={15}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          sx={{ transition: 'transform 0.18s' }}
                        >
                          <line x1="5" y1="12" x2="19" y2="12" />
                          <polyline points="12 5 19 12 12 19" />
                        </Box>
                      )}
                    </Box>
                  </Stack>

                  <Typography
                    sx={{
                      fontSize: 12,
                      color: T.ink3,
                      textAlign: 'center',
                      lineHeight: 1.65,
                      fontFamily: T.dm,
                    }}
                  >
                    No commitment required. Submitting this brief is just an expression of interest.
                  </Typography>
                </Box>
              </AnimSec>
            </Box>
          </FormProvider>
        )}
      </Box>
    </Box>
  );
}

BDBriefForm.propTypes = {
  token: PropTypes.string.isRequired,
};
