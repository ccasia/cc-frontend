import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { Box, TextField, IconButton, Typography } from '@mui/material';

import Image from 'src/components/image';
import Iconify from 'src/components/iconify';

import LoadingSkeleton from './LoadingSkeleton';
import { usePcrStore } from '../store/usePcrStore';
import FormattedTextField from './FormattedTextField';
import { setPrompt, useAiPrompt } from '../store/useAiPrompt';
import { sanitizeReportHtml } from '../utils/sanitize-report-html';

const BADGE_SX = {
  position: 'absolute',
  top: '12px',
  left: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  zIndex: 1,
  bgcolor: '#F3F4F6',
  px: 0.5,
};

const READ_ONLY_SX = {
  fontFamily: 'Aileron',
  fontWeight: 400,
  fontStyle: 'normal',
  fontSize: '20px',
  lineHeight: '24px',
  letterSpacing: '0%',
  color: '#231F20',
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  whiteSpace: 'pre-wrap',
  '& strong': { fontWeight: 700 },
  '& em': { fontStyle: 'italic' },
  '& u': { textDecoration: 'underline' },
};

/**
 * One "description" field of the PCR report: an editable rich-text box while editing (with an
 * "Editable" badge, unless an AI-generated prefill is being shown), the sanitized HTML read-only
 * once saved, or an empty-state placeholder. This exact 3-state shape repeats for every
 * description field in the report (campaign summary, engagement, platform breakdown, views,
 * audience sentiment, creator personas) — this component is the single source of truth for it.
 */

const MotionIconButton = m(IconButton);

/**
 * @param {Object} props
 * @param {'campaign_summary' |'engagement_interactions' |'views_analysis' |'audience_sentiment' |'top_creator_personas' |'campaign_recommendations'} props.aiSection
 */
const EditableDescriptionField = ({
  label,
  fieldKey,
  hydrationVersion,
  value,
  onChange,
  rows,
  mb,
  isClientView,
  isLoading,
  loadingTitle,
  onCancelLoading,
  badgeSx,
  textFieldSx,
  readOnlySx,
  aiSection,
  isStreamRunning,
}) => {
  const isEditMode = usePcrStore((state) => state.isEditMode);
  const promptValue = useAiPrompt((state) => state.prompt);

  if (isLoading) {
    return <LoadingSkeleton title={loadingTitle} cancel={onCancelLoading} />;
  }

  if (isEditMode.state) {
    if (isEditMode.state && isEditMode.type === 'ai') {
      return (
        <Box sx={{ mb, position: 'relative' }}>
          <Box sx={{ ...BADGE_SX, ...badgeSx, bgcolor: 'transparent' }}>
            <Image
              src="/assets/ai-star.svg"
              alt="star-logo"
              sx={{ width: 28, height: 28, flexShrink: 0 }}
            />
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(138, 90, 254, 1)',
              }}
            >
              AI Draft
            </Typography>
          </Box>

          <FormattedTextField
            key={`pcr-ftf-${fieldKey}-${hydrationVersion}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="type here"
            rows={rows}
            sx={textFieldSx}
            isAiGenerated
            section="campaign_summary"
          />

          <TextField
            placeholder="Prompts"
            fullWidth
            sx={{ mt: 2 }}
            value={promptValue.get(aiSection)}
            onChange={(e) => setPrompt(aiSection, e.target.value)}
            InputProps={{
              ...(isStreamRunning && {
                endAdornment: (
                  <MotionIconButton
                    whileTap={{
                      y: 2,
                    }}
                    onClick={() => {
                      onCancelLoading();
                    }}
                  >
                    <Iconify icon="bx:stop-circle" />
                  </MotionIconButton>
                ),
              }),
            }}
          />
        </Box>
      );
    }

    return (
      <Box sx={{ position: 'relative', mb }}>
        <Box sx={{ ...BADGE_SX, ...badgeSx }}>
          <Typography
            sx={{ fontFamily: 'Aileron', fontSize: '14px', fontWeight: 600, color: '#3A3A3C' }}
          >
            Editable
          </Typography>
        </Box>
        <FormattedTextField
          key={`pcr-ftf-${fieldKey}-${hydrationVersion}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="type here"
          rows={rows}
          sx={textFieldSx}
        />
      </Box>
    );
  }

  if (value) {
    return (
      <Box
        sx={{ ...READ_ONLY_SX, ...readOnlySx, mb }}
        dangerouslySetInnerHTML={{ __html: sanitizeReportHtml(value) }}
      />
    );
  }

  return (
    <Box
      className="hide-in-pdf"
      sx={{ bgcolor: '#E5E7EB', borderRadius: '8px', padding: '12px', mb }}
    >
      <Typography
        variant="body1"
        sx={{
          fontFamily: 'Aileron',
          fontWeight: 400,
          fontSize: '20px',
          lineHeight: '24px',
          letterSpacing: '0%',
          color: '#9CA3AF',
        }}
      >
        {isClientView ? 'No content' : `Click Edit Report to edit ${label}`}
      </Typography>
    </Box>
  );
};

export default EditableDescriptionField;

EditableDescriptionField.propTypes = {
  label: PropTypes.string.isRequired,
  fieldKey: PropTypes.string.isRequired,
  hydrationVersion: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  rows: PropTypes.number,
  mb: PropTypes.number,
  isClientView: PropTypes.bool,
  isLoading: PropTypes.bool,
  loadingTitle: PropTypes.string,
  onCancelLoading: PropTypes.func,
  badgeSx: PropTypes.object,
  textFieldSx: PropTypes.object,
  readOnlySx: PropTypes.object,
  aiSection: PropTypes.array,
};

EditableDescriptionField.defaultProps = {
  rows: 3,
  mb: 3,
};
