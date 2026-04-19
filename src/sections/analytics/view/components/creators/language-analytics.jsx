import { useMemo } from "react";
import PropTypes from "prop-types";

import { BarChart } from '@mui/x-charts';
import { Box, Card, Typography, CardContent } from '@mui/material';

const colorPalette = [
  '#1340ff', // Blue
  '#bc5090', // Pink
  '#ff6361', // Red
  '#58508d', // Purple
  '#ffa600', // Orange
  '#003f5c', // Dark Blue
  '#665191', // Purple
  '#a05195', // Magenta
  '#d45087', // Pink Red
  '#f95d6a', // Light Red
  '#ff7c43', // Orange Red
  '#2f4b7c', // Navy
];

export default function LanguageAnalytics({ creators }) {

  const languageData = useMemo(() => {
    const languageCount = {};

    // Debug: Log the first creator to see the structure
    if (creators.length > 0) {
      console.log('First creator structure:', creators[0]);
      console.log('First creator.creator:', creators[0]?.creator);
      console.log('First creator.creator.languages:', creators[0]?.creator?.languages);
    }

    creators.forEach((creator) => {
      // Access languages from creator.creator.languages (nested structure)
      const languages = creator?.creator?.languages;
      
      if (languages) {
        let languageArray = [];
        
        // Handle both JSON string and JSON object
        if (typeof languages === 'string') {
          try {
            languageArray = JSON.parse(languages);
          } catch (error) {
            console.error('Error parsing languages:', error);
          }
        } else if (Array.isArray(languages)) {
          languageArray = languages;
        } else if (typeof languages === 'object' && languages !== null) {
          // If it's an object with a languages property or other structure
          languageArray = languages.languages || Object.values(languages);
        }

        // Count each language
        if (Array.isArray(languageArray)) {
          languageArray.forEach((lang) => {
            // Handle different possible structures
            let language = null;
            
            if (typeof lang === 'string') {
              language = lang;
            } else if (typeof lang === 'object' && lang !== null) {
              language = lang.name || lang.value || lang.label || lang.language;
            }
            
            if (language && typeof language === 'string') {
              languageCount[language] = (languageCount[language] || 0) + 1;
            }
          });
        }
      }
    });

    console.log('Language count:', languageCount);

    // Convert to array and sort by count (descending)
    return Object.entries(languageCount)
      .map(([language, count], index) => ({
        language,
        count,
        color: colorPalette[index % colorPalette.length], // Assign unique color
      }))
      .sort((a, b) => b.count - a.count);
  }, [creators]);

  // Prepare data for horizontal bar chart with different colors
  const languages = languageData.map((item) => item.language);
  const chartSeries = languageData.map((item, index) => ({
    data: languages.map((_, i) => (i === index ? item.count : 0)),
    label: item.language,
    color: item.color,
    stack: 'total',
  }));

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography 
          variant="h6" 
          fontWeight="bold"
          gutterBottom
          sx={{ mb: 2 }}
        >
          Creator Languages
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Languages selected during registration
        </Typography>

        {languageData.length > 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
            <BarChart
              yAxis={[
                {
                  scaleType: 'band',
                  data: languages,
                },
              ]}
              series={languageData.map((item, index) => ({
                data: languageData.map((_, i) => (i === index ? item.count : null)),
                label: item.language,
                color: item.color,
                stack: 'languages',
              }))}
              layout="horizontal"
              width={450}
              height={Math.min(400, Math.max(250, languageData.length * 40))}
              margin={{ left: 5, right: 20, top: 10, bottom: 30 }}
              slotProps={{
                legend: {
                  hidden: true,
                },
              }}
            />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            No language data available
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

LanguageAnalytics.propTypes = {
  creators: PropTypes.arrayOf(
    PropTypes.shape({
      creator: PropTypes.shape({
        languages: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.array,
          PropTypes.object,
        ]),
      }),
    })
  ).isRequired,
};
