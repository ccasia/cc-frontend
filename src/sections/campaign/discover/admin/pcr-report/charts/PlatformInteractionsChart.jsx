import { useMemo } from 'react';
import PropTypes from 'prop-types';

import { PieChart } from '@mui/x-charts';
import { Box, Stack, Typography } from '@mui/material';

import { formatNumber, getMetricValue } from 'src/utils/socialMetricsCalculator';

const PlatformInteractionsChart = ({ filteredInsightsData, filteredSubmissions }) => {
  const platformData = useMemo(() => {

    if (!filteredInsightsData || filteredInsightsData.length === 0) {
      return { instagram: 0, tiktok: 0, total: 0 };
    }

    let instagramInteractions = 0;
    let tiktokInteractions = 0;

    filteredInsightsData.forEach((insightData) => {
      const submission = filteredSubmissions.find((sub) => sub.id === insightData.submissionId);

      if (submission && insightData.insight) {
        const likes = getMetricValue(insightData.insight, 'likes');
        const comments = getMetricValue(insightData.insight, 'comments');
        const shares = getMetricValue(insightData.insight, 'shares');
        const saved = getMetricValue(insightData.insight, 'saved');

        const interactions = likes + comments + shares + saved;

        if (submission.platform === 'Instagram') {
          instagramInteractions += interactions;
        } else if (submission.platform === 'TikTok') {
          tiktokInteractions += interactions;
        }
      }
    });

    const total = instagramInteractions + tiktokInteractions;

    return {
      instagram: instagramInteractions,
      tiktok: tiktokInteractions,
      total
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredInsightsData, filteredSubmissions]);

  const startAngle = -135;

  const chartData = useMemo(() => [
    { id: 0, value: platformData.tiktok, label: 'TikTok', color: '#000000' },
    { id: 1, value: platformData.instagram, label: 'Instagram', color: '#C13584' },
  ].filter((item) => item.value > 0), [platformData.tiktok, platformData.instagram]);

  return (
    <Box
      sx={{
        width: '335px',
        height: '240px',
        borderRadius: '16px',
        gap: '10px',
        opacity: 1,
        paddingTop: '16px',
        paddingRight: '16px',
        paddingBottom: '20px',
        paddingLeft: '16px',
        background: '#F5F5F5',
        border: '1px solid #F5F5F5',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontFamily: 'Aileron',
          fontWeight: 600,
          fontStyle: 'normal',
          fontSize: '20px',
          lineHeight: '100%',
          letterSpacing: '0%',
          textAlign: 'left',
          color: '#231F20',
          mb: 1.5,
          alignSelf: 'flex-start',
        }}
      >
        Platform Interactions
      </Typography>

      {/* Donut chart + legend: flex layout avoids overlap with MUI default legend */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          minHeight: '160px',
          overflow: 'visible',
          gap: 1,
          pl: '4px',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: 200,
            height: 160,
            flexShrink: 0,
            marginLeft: '-35px',
          }}
        >
          <PieChart
            hideLegend
            width={200}
            height={160}
            series={[
              {
                data: chartData,
                innerRadius: 52,
                outerRadius: 65,
                paddingAngle: 2,
                cornerRadius: 8,
                cx: 100,
                cy: 80,
                startAngle,
              },
            ]}
            slotProps={{
              legend: { hidden: true },
            }}
            sx={{
              '& .MuiChartsArc-root': {
                stroke: 'none',
              },
              '& .MuiChartsLegend-root': {
                display: 'none',
              },
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography
              sx={{
                fontFamily: 'Instrument Serif',
                fontWeight: 400,
                fontStyle: 'normal',
                fontSize: '24px',
                lineHeight: '28px',
                letterSpacing: '0%',
                textAlign: 'center',
                color: '#000000E5',
                mb: 0.5,
              }}
            >
              {formatNumber(platformData.total)}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Aileron',
                fontWeight: 600,
                fontStyle: 'normal',
                fontSize: '10px',
                lineHeight: '12px',
                letterSpacing: '0%',
                textAlign: 'center',
                color: '#000000E5',
              }}
            >
              Total Interactions
            </Typography>
          </Box>
        </Box>

        <Stack
          spacing={1.5}
          sx={{
            flex: '1 1 auto',
            minWidth: 0,
            justifyContent: 'center',
            alignItems: 'flex-start',
            alignSelf: 'stretch',
            py: 0.5,
          }}
        >
          {platformData.instagram > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#C13584',
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontFamily: 'Aileron',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '16px',
                  color: '#231F20',
                }}
              >
                Instagram ({formatNumber(platformData.instagram)})
              </Typography>
            </Box>
          )}
          {platformData.tiktok > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: '#000000',
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{
                  fontFamily: 'Aileron',
                  fontWeight: 400,
                  fontSize: '14px',
                  lineHeight: '16px',
                  color: '#231F20',
                }}
              >
                TikTok ({formatNumber(platformData.tiktok)})
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

PlatformInteractionsChart.propTypes = {
  filteredInsightsData: PropTypes.array.isRequired,
  filteredSubmissions: PropTypes.array.isRequired,
};

export default PlatformInteractionsChart;
