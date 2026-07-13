import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

const LEGEND_ROW_SX = { display: 'flex', alignItems: 'center', gap: 0.75 };
const LEGEND_DOT_SX = { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 };
const LEGEND_LABEL_SX = {
  fontFamily: 'Aileron',
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '18px',
  color: '#231F20',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const LegendRow = ({ color, label }) => (
  <Box sx={LEGEND_ROW_SX}>
    <Box sx={{ ...LEGEND_DOT_SX, bgcolor: color }} />
    <Typography sx={LEGEND_LABEL_SX}>{label}</Typography>
  </Box>
);

LegendRow.propTypes = {
  color: PropTypes.string.isRequired,
  label: PropTypes.string,
};

// Legend for the Creator Strategy Breakdown chart. Identical markup in edit and display mode.
const StrategyLegend = ({ editableContent, showEducatorCard, showThirdCard, showFourthCard, showFifthCard }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '100%', px: 1.5 }}>
    <LegendRow color="#1340FF" label={editableContent.comicTitle} />
    {showEducatorCard && <LegendRow color="#8A5AFE" label={editableContent.educatorTitle} />}
    {showThirdCard && <LegendRow color="#FF3500" label={editableContent.thirdTitle} />}
    {showFourthCard && <LegendRow color="#D8FF01" label={editableContent.fourthTitle} />}
    {showFifthCard && <LegendRow color="#026D54" label={editableContent.fifthTitle} />}
  </Box>
);

StrategyLegend.propTypes = {
  editableContent: PropTypes.object.isRequired,
  showEducatorCard: PropTypes.bool.isRequired,
  showThirdCard: PropTypes.bool.isRequired,
  showFourthCard: PropTypes.bool.isRequired,
  showFifthCard: PropTypes.bool.isRequired,
};

export default StrategyLegend;
