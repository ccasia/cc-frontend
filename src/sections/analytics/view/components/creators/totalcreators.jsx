import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, CircularProgress, Box, Stack } from '@mui/material';
import { LineChart, PieChart, BarChart } from '@mui/x-charts';
import axiosInstance, { endpoints } from 'src/utils/axios';
import dayjs from 'dayjs';

const calculateAge = (birthDate) => {
  if (!birthDate) return null; // Handle missing birthDate

  const birth = dayjs(birthDate);  // Parse birthDate with Day.js
  const today = dayjs();          // Get today's date with Day.js

  const age = today.diff(birth, 'year');  // Calculate age in years

  return age;
};


export default function TotalCreators() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const ageGroups = {
    '18-25': 0,
    '26-34': 0,
    '35-40': 0,
    '40+': 0,
  };

  const genderStats = {
    Male: 0,
    Female: 0,
    Other: 0,
  };

  const customColors = {
    Male: '#1340ff',
    Female: '#bc5090',
    Other: '#ff6361',
  };

  creators.forEach((data) => {
    const gender = data.creator?.pronounce?.toLowerCase();
    if (gender?.includes('he/him')) genderStats.Male += 1;
    else if (gender?.includes('she/her')) genderStats.Female += 1;
    else genderStats.Other += 1;
  });

  // Prepare Pie Chart Data
  const pieData = Object.entries(genderStats)
    .map(([label, value]) => ({
      id: label,
      value,
      label,
      color: customColors[label],
    }))
    .filter((item) => item.value > 0);


  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await axiosInstance.get(endpoints.creators.getCreators);
        setCreators(res.data);
      } catch (err) {
        setError('Failed to load creators data');
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);






  creators.forEach((data) => {
    const age = calculateAge(data.creator.birthDate); // Ensure correct function call

    if (age !== null) {
      if (age >= 18 && age <= 25) ageGroups["18-25"] += 1;
      else if (age >= 26 && age <= 34) ageGroups["26-34"] += 1;
      else if (age >= 35 && age <= 40) ageGroups["35-40"] += 1;
      else ageGroups["40+"] += 1;
    }

    const gender = data.creator.pronounce?.toLowerCase();
    if (gender?.includes('he/him')) genderStats.Male += 1;
    else if (gender?.includes('she/her')) genderStats.Female += 1;
    else genderStats.Other += 1;
  });

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card>
      <CardContent>
        <Typography  marginBottom={2} variant="h6" gutterBottom>
          Total Creators on Platform: {creators.length}
        </Typography>

        {/* Line Graph - Filter by Age Range */}
        {/* <LineChart
          mb={8}
          width={400}
          height={200}
          series={[{ data: Object.values(ageGroups), label: 'Creators by Age' }]}
          xAxis={[{ scaleType: 'point', data: Object.keys(ageGroups) }]}
        /> */}

        <Typography variant="h8" align="start" sx={{  mt: 4, mb: 2, fontWeight: 'bold' }}>
          Creators by Age Group
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <BarChart
            width={600}
            height={350}
            series={[
              {
                data: Object.values(ageGroups),
                //  label: "Creators by Age Group",
                color: "#3f51b5",
              },
            ]}
            xAxis={[
              {
                scaleType: "band",
                label: "Age Group",
                data: Object.keys(ageGroups),
              },
            ]}
            yAxis={[
              {
                label: "Creators",

              },
            ]}
          />
        </Box>


        <Typography mt={4} sx={{  mt: 4, mb: 2, fontWeight: 'bold' }}>
          By Gender
        </Typography>

        {/* Gender Distribution Pie Chart with Legends on Left */}
        <Box display="flex" alignItems="center">

          {/* Legend Section */}
          <Stack spacing={1} sx={{ minWidth: 140, mr: 2 }}>
            {pieData.map((item) => (
              <Box key={item.id} display="flex" alignItems="center">
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    backgroundColor: item.color,
                    borderRadius: '50%',
                    mr: 1,
                  }}
                />
                <Typography variant="body2">
                  {item.label}: {item.value}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* Pie Chart */}
          <PieChart
            series={[
              {
                data: pieData,
              },
            ]}
            width={300}
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
