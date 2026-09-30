import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

import { sanitizeReportHtml } from '../utils/sanitize-report-html';
import LoadingSkeleton from '../components/LoadingSkeleton';
import useAiAnalytic from '../hooks/useAiAnalytic';

const CampaignSummary = ({ effectiveEditMode, campaignDescription, isClientView }) => {
  if (effectiveEditMode) {
    if (mutation.isPending) {
      return <LoadingSkeleton title="Overview" cancel={mutation.cancel} />;
    }

    if (aiAnalyticsData?.campaign_summary) {
      return (
        <Box>
          <FormattedTextField
            key={`pcr-ftf-campaignDescription-${hydrationVersion}`}
            value={aiAnalyticsData?.campaign_summary}
            onChange={(e) =>
              setEditableContent({
                ...editableContent,
                campaignDescription: e.target.value,
              })
            }
            placeholder="type here"
            rows={3}
          />
        </Box>
      );
    }
    return (
      <Box sx={{ position: 'relative', mb: 2 }}>
        <Box
          sx={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            zIndex: 1,
            bgcolor: '#F3F4F6',
            px: 0.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: 'Aileron',
              fontSize: '14px',
              fontWeight: 600,
              color: '#3A3A3C',
            }}
          >
            Editable
          </Typography>
        </Box>

        <FormattedTextField
          key={`pcr-ftf-campaignDescription-${hydrationVersion}`}
          value={editableContent.campaignDescription}
          onChange={(e) =>
            setEditableContent({
              ...editableContent,
              campaignDescription: e.target.value,
            })
          }
          placeholder="type here"
          rows={3}
        />
      </Box>
    );
  }

  if (campaignDescription) {
    return (
      <Box
        sx={{
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
        }}
        dangerouslySetInnerHTML={{
          __html: sanitizeReportHtml(campaignDescription),
        }}
      />
    );
  }

  return (
    <Box
      className="hide-in-pdf"
      sx={{
        bgcolor: '#E5E7EB',
        borderRadius: '8px',
        padding: '12px',
      }}
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
        {isClientView ? 'No content' : 'Click Edit Report to edit Campaign Description'}
      </Typography>
    </Box>
  );
};

export default CampaignSummary;

CampaignSummary.propTypes = {
  effectiveEditMode: PropTypes.bool,
  isClientView: PropTypes.bool,
  campaignDescription: PropTypes.string,
};
