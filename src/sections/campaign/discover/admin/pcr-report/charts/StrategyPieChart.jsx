import PropTypes from 'prop-types';

import { Box, Typography } from '@mui/material';

const numberTextProps = {
  fill: '#FFFFFF',
  fontSize: '14',
  fontFamily: 'Aileron',
  fontWeight: '600',
  style: { textShadow: '1px 1px 3px #231F20, 0px 0px 2px rgba(0, 0, 0, 0.8)' },
};

// Creator Strategy Breakdown pie chart. Shared by edit and display mode PCR report views —
// `size` is the only thing that differs between them (the single-persona circle is always 160x160).
const StrategyPieChart = ({ size, editableContent, showEducatorCard, showThirdCard, showFourthCard, showFifthCard }) => {
  if (showFifthCard || showFourthCard || showThirdCard) {
    return (
      <svg width={size} height={size} viewBox="0 0 160 160">
        {(() => {
          const comicCount = parseInt(editableContent.creatorStrategyCount, 10) || 1;
          const educatorCount = parseInt(editableContent.educatorCreatorCount, 10) || 1;
          const thirdCount = parseInt(editableContent.thirdCreatorCount, 10) || 1;
          const fourthCount = parseInt(editableContent.fourthCreatorCount, 10) || 1;
          const fifthCount = parseInt(editableContent.fifthCreatorCount, 10) || 1;
          const total = comicCount + (showEducatorCard ? educatorCount : 0) + (showThirdCard ? thirdCount : 0) + (showFourthCard ? fourthCount : 0) + (showFifthCard ? fifthCount : 0);
          const comicPercentage = comicCount / total;
          const educatorPercentage = showEducatorCard ? educatorCount / total : 0;
          const thirdPercentage = showThirdCard ? thirdCount / total : 0;
          const fourthPercentage = showFourthCard ? fourthCount / total : 0;
          const fifthPercentage = showFifthCard ? fifthCount / total : 0;

          const comicAngle = comicPercentage * 2 * Math.PI;
          const educatorAngle = educatorPercentage * 2 * Math.PI;
          const thirdAngle = thirdPercentage * 2 * Math.PI;
          const fourthAngle = fourthPercentage * 2 * Math.PI;
          const fifthAngle = fifthPercentage * 2 * Math.PI;

          let currentAngle = 0;

          const comicEndAngle = currentAngle + comicAngle;
          const comicEndX = 80 + 70 * Math.sin(comicEndAngle);
          const comicEndY = 80 - 70 * Math.cos(comicEndAngle);
          const comicLargeArc = comicAngle > Math.PI ? 1 : 0;

          currentAngle = comicEndAngle;
          const educatorEndAngle = currentAngle + educatorAngle;
          const educatorEndX = 80 + 70 * Math.sin(educatorEndAngle);
          const educatorEndY = 80 - 70 * Math.cos(educatorEndAngle);
          const educatorLargeArc = educatorAngle > Math.PI ? 1 : 0;

          currentAngle = educatorEndAngle;
          const thirdEndAngle = currentAngle + thirdAngle;
          const thirdEndX = 80 + 70 * Math.sin(thirdEndAngle);
          const thirdEndY = 80 - 70 * Math.cos(thirdEndAngle);
          const thirdLargeArc = thirdAngle > Math.PI ? 1 : 0;

          currentAngle = thirdEndAngle;
          const fourthEndAngle = currentAngle + fourthAngle;
          const fourthEndX = 80 + 70 * Math.sin(fourthEndAngle);
          const fourthEndY = 80 - 70 * Math.cos(fourthEndAngle);
          const fourthLargeArc = fourthAngle > Math.PI ? 1 : 0;

          currentAngle = fourthEndAngle;
          const fifthEndAngle = currentAngle + fifthAngle;
          const fifthEndX = 80 + 70 * Math.sin(fifthEndAngle);
          const fifthEndY = 80 - 70 * Math.cos(fifthEndAngle);
          const fifthLargeArc = fifthAngle > Math.PI ? 1 : 0;

          const comicMidAngle = comicAngle / 2;
          const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
          const comicTextY = 80 - 35 * Math.cos(comicMidAngle);

          const educatorMidAngle = comicAngle + educatorAngle / 2;
          const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
          const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);

          const thirdMidAngle = comicAngle + educatorAngle + thirdAngle / 2;
          const thirdTextX = 80 + 35 * Math.sin(thirdMidAngle);
          const thirdTextY = 80 - 35 * Math.cos(thirdMidAngle);

          const fourthMidAngle = comicAngle + educatorAngle + thirdAngle + fourthAngle / 2;
          const fourthTextX = 80 + 35 * Math.sin(fourthMidAngle);
          const fourthTextY = 80 - 35 * Math.cos(fourthMidAngle);

          const fifthMidAngle = comicAngle + educatorAngle + thirdAngle + fourthAngle + fifthAngle / 2;
          const fifthTextX = 80 + 35 * Math.sin(fifthMidAngle);
          const fifthTextY = 80 - 35 * Math.cos(fifthMidAngle);

          return (
            <>
              {/* Comic segment (blue) */}
              <path d={`M 80 80 L 80 10 A 70 70 0 ${comicLargeArc} 1 ${comicEndX} ${comicEndY} Z`} fill="#1340FF" />
              {/* Educator segment (purple) */}
              {showEducatorCard && (
                <path d={`M 80 80 L ${comicEndX} ${comicEndY} A 70 70 0 ${educatorLargeArc} 1 ${educatorEndX} ${educatorEndY} Z`} fill="#8A5AFE" />
              )}
              {/* Third segment (orange-red) */}
              {showThirdCard && (
                <path d={`M 80 80 L ${educatorEndX} ${educatorEndY} A 70 70 0 ${thirdLargeArc} 1 ${thirdEndX} ${thirdEndY} Z`} fill="#FF3500" />
              )}
              {/* Fourth segment (yellow-green) */}
              {showFourthCard && (
                <path d={`M 80 80 L ${thirdEndX} ${thirdEndY} A 70 70 0 ${fourthLargeArc} 1 ${fourthEndX} ${fourthEndY} Z`} fill="#D8FF01" />
              )}
              {/* Fifth segment (teal) - closes the circle */}
              {showFifthCard && (
                <path d={`M 80 80 L ${fourthEndX} ${fourthEndY} A 70 70 0 ${fifthLargeArc} 1 80 10 Z`} fill="#026D54" />
              )}
              {!showFifthCard && showFourthCard && (
                <path d={`M 80 80 L ${fourthEndX} ${fourthEndY} A 70 70 0 0 1 80 10 Z`} fill="#D8FF01" opacity="0" />
              )}
              {!showFifthCard && !showFourthCard && (
                <path d={`M 80 80 L ${thirdEndX} ${thirdEndY} A 70 70 0 0 1 80 10 Z`} fill="#FF3500" opacity="0" />
              )}
              {/* Comic number */}
              <text x={comicTextX} y={comicTextY} textAnchor="middle" dominantBaseline="middle" {...numberTextProps}>
                {comicCount}
              </text>
              {/* Educator number */}
              <text x={educatorTextX} y={educatorTextY} textAnchor="middle" dominantBaseline="middle" {...numberTextProps}>
                {educatorCount}
              </text>
              {/* Third number */}
              {thirdCount > 0 && showThirdCard && (
                <text x={thirdTextX} y={thirdTextY} textAnchor="middle" dominantBaseline="middle" {...numberTextProps}>
                  {thirdCount}
                </text>
              )}
              {/* Fourth number */}
              {fourthCount > 0 && showFourthCard && (
                <text x={fourthTextX} y={fourthTextY} textAnchor="middle" dominantBaseline="middle" {...numberTextProps}>
                  {fourthCount}
                </text>
              )}
              {/* Fifth number */}
              {fifthCount > 0 && showFifthCard && (
                <text x={fifthTextX} y={fifthTextY} textAnchor="middle" dominantBaseline="middle" {...numberTextProps}>
                  {fifthCount}
                </text>
              )}
            </>
          );
        })()}
      </svg>
    );
  }

  if (showEducatorCard) {
    return (
      <svg width={size} height={size} viewBox="0 0 160 160">
        {(() => {
          const comicCount = parseInt(editableContent.creatorStrategyCount, 10) || 1;
          const educatorCount = parseInt(editableContent.educatorCreatorCount, 10) || 1;
          const total = comicCount + educatorCount;
          const comicPercentage = comicCount / total;
          const educatorPercentage = educatorCount / total;

          const comicAngle = comicPercentage * 2 * Math.PI;
          const educatorAngle = educatorPercentage * 2 * Math.PI;

          const comicEndX = 80 + 70 * Math.sin(comicAngle);
          const comicEndY = 80 - 70 * Math.cos(comicAngle);
          const comicLargeArc = comicPercentage > 0.5 ? 1 : 0;

          const comicMidAngle = comicAngle / 2;
          const comicTextX = 80 + 35 * Math.sin(comicMidAngle);
          const comicTextY = 80 - 35 * Math.cos(comicMidAngle);

          const educatorMidAngle = comicAngle + (educatorAngle / 2);
          const educatorTextX = 80 + 35 * Math.sin(educatorMidAngle);
          const educatorTextY = 80 - 35 * Math.cos(educatorMidAngle);

          return (
            <>
              <circle cx="80" cy="80" r="70" fill="#8A5AFE" />
              <path d={`M 80 80 L 80 10 A 70 70 0 ${comicLargeArc} 1 ${comicEndX} ${comicEndY} Z`} fill="#1340FF" />
              {/* Comic number */}
              <text x={comicTextX} y={comicTextY} textAnchor="middle" dominantBaseline="middle" {...numberTextProps}>
                {comicCount}
              </text>
              {/* Educator number */}
              <text x={educatorTextX} y={educatorTextY} textAnchor="middle" dominantBaseline="middle" {...numberTextProps}>
                {educatorCount}
              </text>
            </>
          );
        })()}
      </svg>
    );
  }

  // Full circle when only one persona
  return (
    <>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="70" fill="#1340FF" />
      </svg>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Inter Display',
            fontWeight: 400,
            fontStyle: 'normal',
            fontSize: '18px',
            lineHeight: '22px',
            letterSpacing: '0%',
            color: '#FFFFFF',
            textAlign: 'center',
            textShadow: '0.5px 0.5px 1px #231F20',
          }}
        >
          {editableContent.creatorStrategyCount || '1'}
        </Typography>
      </Box>
    </>
  );
};

StrategyPieChart.propTypes = {
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  editableContent: PropTypes.object.isRequired,
  showEducatorCard: PropTypes.bool.isRequired,
  showThirdCard: PropTypes.bool.isRequired,
  showFourthCard: PropTypes.bool.isRequired,
  showFifthCard: PropTypes.bool.isRequired,
};

export default StrategyPieChart;
