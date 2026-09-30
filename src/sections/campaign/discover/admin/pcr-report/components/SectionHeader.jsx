import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';

import { Box, Typography, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

const ICON_BUTTON_SX = {
  width: '46px',
  height: '46px',
  padding: '8px',
  borderRadius: '11px',
  border: '1.38px solid #E7E7E7',
  backgroundColor: '#FFFFFF',
  boxShadow: '0px -2.75px 0px 0px #E7E7E7 inset',
};

const NEUTRAL_BUTTON_SX = { ...ICON_BUTTON_SX, '&:hover': { backgroundColor: '#F9F9F9' } };
const DANGER_BUTTON_SX = { ...ICON_BUTTON_SX, '&:hover': { backgroundColor: '#FEE2E2' } };

/**
 * Title + divider line + edit-mode action buttons for one PCR report section. Every section
 * (Engagement, Platform Breakdown, Views, Audience Sentiment, Creator Tiers, Strategies,
 * Recommendations) uses this exact same header shape — only the title and the `sectionEditStates`
 * / `sectionVisibility` key it drives change.
 */
const SectionHeader = ({
  title,
  sectionKey,
  effectiveEditMode,
  sectionEditStates,
  setSectionEditStates,
  sectionVisibility,
  setSectionVisibility,
  handleSavePCR,
  setIsSaving,
  mb,
}) => {
  const isConfirmed = sectionEditStates[sectionKey];

  const handleSaveAndConfirm = async () => {
    try {
      setIsSaving(true);
      const response = await handleSavePCR();
      if (response?.data?.success) {
        setSectionEditStates({ ...sectionEditStates, [sectionKey]: true });
        enqueueSnackbar(`${title} section saved successfully`, { variant: 'success' });
      }
    } catch (error) {
      console.error('Error saving section:', error);
      enqueueSnackbar('Failed to save section', { variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchToEdit = () => {
    setSectionEditStates({ ...sectionEditStates, [sectionKey]: false });
  };

  const handleRemove = () => {
    setSectionVisibility({ ...sectionVisibility, [sectionKey]: false });
    enqueueSnackbar(`${title} section removed`, { variant: 'info' });
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb }}>
      <Typography
        variant="h2"
        sx={{
          fontFamily: 'Instrument Serif, serif',
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '56px',
          lineHeight: '60px',
          letterSpacing: '0%',
          color: '#231F20',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </Typography>

      <Box sx={{ flex: 1, height: '1px', background: '#231F20' }} />

      {effectiveEditMode && !isConfirmed && (
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          <IconButton onClick={handleSaveAndConfirm} sx={NEUTRAL_BUTTON_SX}>
            <Iconify icon="mingcute:check-fill" width={30} sx={{ color: '#10B981' }} />
          </IconButton>
          <IconButton onClick={handleRemove} sx={DANGER_BUTTON_SX}>
            <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
          </IconButton>
        </Box>
      )}

      {effectiveEditMode && isConfirmed && (
        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
          <IconButton onClick={handleSwitchToEdit} sx={NEUTRAL_BUTTON_SX}>
            <Iconify icon="mingcute:edit-line" width={30} sx={{ color: '#3B82F6' }} />
          </IconButton>
          <IconButton onClick={handleRemove} sx={DANGER_BUTTON_SX}>
            <Iconify icon="mingcute:delete-2-fill" width={30} sx={{ color: '#EF4444' }} />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default SectionHeader;

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  sectionKey: PropTypes.string.isRequired,
  effectiveEditMode: PropTypes.bool,
  sectionEditStates: PropTypes.object.isRequired,
  setSectionEditStates: PropTypes.func.isRequired,
  sectionVisibility: PropTypes.object.isRequired,
  setSectionVisibility: PropTypes.func.isRequired,
  handleSavePCR: PropTypes.func.isRequired,
  setIsSaving: PropTypes.func.isRequired,
  mb: PropTypes.number,
};

SectionHeader.defaultProps = {
  mb: 1,
};
