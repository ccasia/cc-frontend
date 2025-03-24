import PropTypes from "prop-types";

import { Card, CardContent, Typography, Box } from '@mui/material';
import { PieChart } from '@mui/x-charts';

export default function ShortlistedCreators({ creators } ) {

  const shortlistedCount = creators.filter(
    (creator) => creator.shortlisted.length > 0
  ).length;
  const notShortlistedCount = creators.length - shortlistedCount;

  const data = [
    { id: 1, value: shortlistedCount, label: "Shortlisted", color: "#1340ff" },
    { id: 2, value: notShortlistedCount, label: "Not Shortlisted", color: "#9C9D9E" },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Shortlisted Creators
        </Typography>

        <Box display="flex" alignItems="center">
          {/* Legend on the Left */}
          <Box display="flex" flexDirection="column" mr={2}>
            {data.map((item) => (
              <Box key={item.id} display="flex" alignItems="center" mb={1}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: item.color,
                    borderRadius: "4px",
                    marginRight: "8px",
                  }}
                />
                <Typography variant="body2">{item.label}: {item.value}</Typography>
              </Box>
            ))}
          </Box>

          {/* Pie Chart */}
          <PieChart
            series={[
              {
                data,
              },
            ]}
            width={250}
            height={200}
            slotProps={{
              legend: { hidden: true },
            }}
          />
        </Box>
      </CardContent>
    </Card>

  );
}

ShortlistedCreators.propTypes = {
  creators: PropTypes.arrayOf(
    PropTypes.shape({
      shortlisted: PropTypes.array.isRequired, 
    })
  ).isRequired, 
};