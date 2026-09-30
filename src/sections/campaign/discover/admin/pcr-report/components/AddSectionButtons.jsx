import PropTypes from 'prop-types';

import { Box, Button } from '@mui/material';

const ADDABLE_SECTIONS = [
  { key: 'engagement', label: 'Engagements' },
  { key: 'platformBreakdown', label: 'Platform Breakdown' },
  { key: 'views', label: 'Views' },
  { key: 'audienceSentiment', label: 'Audience Sentiment' },
  { key: 'creatorTiers', label: 'Creator Tiers' },
  { key: 'strategies', label: 'Strategies' },
  { key: 'recommendations', label: 'Recommendations' },
];

const buttonSx = {
  textTransform: 'none',
  bgcolor: '#FFFFFF',
  border: '1px solid #E7E7E7',
  color: '#374151',
  '&:hover': { bgcolor: '#F9FAFB' },
  gap: '4px',
};

/** Row of "+ Section" buttons, one per hidden section, that flip it back into `sectionVisibility`. */
const AddSectionButtons = ({ sectionVisibility, setSectionVisibility }) => (
  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
    {ADDABLE_SECTIONS.filter(({ key }) => !sectionVisibility[key]).map(({ key, label }) => (
      <Button
        key={key}
        size="small"
        onClick={() => setSectionVisibility({ ...sectionVisibility, [key]: true })}
        sx={buttonSx}
      >
        <Box component="span" sx={{ fontSize: '16px', lineHeight: 1 }}>
          +
        </Box>
        {label}
      </Button>
    ))}
  </Box>
);

export default AddSectionButtons;

AddSectionButtons.propTypes = {
  sectionVisibility: PropTypes.object.isRequired,
  setSectionVisibility: PropTypes.func.isRequired,
};
