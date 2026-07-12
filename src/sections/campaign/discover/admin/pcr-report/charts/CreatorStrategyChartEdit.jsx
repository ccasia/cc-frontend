import PropTypes from 'prop-types';

import { Box, Grid, Typography } from '@mui/material';

import StrategyLegend from './StrategyLegend';
import StrategyPieChart from './StrategyPieChart';

// Creator Strategy Breakdown chart, edit-mode variant. Sits on the right side of the
// persona cards Grid in edit mode.
const CreatorStrategyChartEdit = ({ editableContent, showEducatorCard, showThirdCard, showFourthCard, showFifthCard }) => {
  const stacked = showEducatorCard || showThirdCard;

  return (
    <Grid item xs={12} md={5} sx={{ display: 'flex', alignItems: 'flex-start' }}>
      <Box
        sx={{
          bgcolor: '#F5F5F5',
          borderRadius: '16px',
          p: 2,
          width: '400px',
          height: (() => {
            // Calculate height based on number of visible cards
            const visibleCards = 1 + (showEducatorCard ? 1 : 0) + (showThirdCard ? 1 : 0) + (showFourthCard ? 1 : 0) + (showFifthCard ? 1 : 0);
            if (visibleCards === 1) return '220px';
            return '580px';
          })(),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          ml: -1,
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Aileron',
            fontWeight: 600,
            fontSize: '18px',
            lineHeight: '22px',
            color: '#231F20',
            textAlign: 'left',
            mb: 2,
          }}
        >
          Creator Strategy Breakdown
        </Typography>

        {/* Circle and Legend Layout */}
        <Box sx={{ display: 'flex', flexDirection: stacked ? 'column' : 'row', alignItems: 'center', gap: stacked ? 0.5 : 2, flex: 1 }}>
          {/* Full Circle Chart or Pie Chart */}
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: stacked ? 1 : 'none' }}>
            <StrategyPieChart
              size={360}
              editableContent={editableContent}
              showEducatorCard={showEducatorCard}
              showThirdCard={showThirdCard}
              showFourthCard={showFourthCard}
              showFifthCard={showFifthCard}
            />
          </Box>

          <StrategyLegend
            editableContent={editableContent}
            showEducatorCard={showEducatorCard}
            showThirdCard={showThirdCard}
            showFourthCard={showFourthCard}
            showFifthCard={showFifthCard}
          />
        </Box>
      </Box>
    </Grid>
  );
};

CreatorStrategyChartEdit.propTypes = {
  editableContent: PropTypes.object.isRequired,
  showEducatorCard: PropTypes.bool.isRequired,
  showThirdCard: PropTypes.bool.isRequired,
  showFourthCard: PropTypes.bool.isRequired,
  showFifthCard: PropTypes.bool.isRequired,
};

export default CreatorStrategyChartEdit;
