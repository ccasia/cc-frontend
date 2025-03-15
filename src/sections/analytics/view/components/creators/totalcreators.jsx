import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { LineChart, PieChart, BarChart } from '@mui/x-charts';
import axiosInstance, {endpoints} from 'src/utils/axios';
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
    '18-24': 0,
    '25-34': 0,
    '35-44': 0,
    '45-54': 0,
    '55+': 0,
  };

  const ageData = [
    { label: '18-24', value: ageGroups['18-24'] },
    { label: '25-34', value: ageGroups['25-34'] },
    { label: '35-44', value: ageGroups['35-44'] },
    { label: '45-54', value: ageGroups['45-54'] },
    { label: '55+', value: ageGroups['55+'] }
  ];
  
  const genderStats = {
    Male: 0,
    Female: 0,
    Other: 0,
  };


  useEffect(() => {
    const fetchCreators = async () => {
      try {
        const res = await axiosInstance.get(endpoints.creators.getCreators);
        setCreators(res.data); 
        console.log(res.data)
        //  console.log(res)
      } catch (err) {
        setError('Failed to load creators data');
      } finally {
        setLoading(false);
      }
    };

    fetchCreators();
  }, []);

 



 console.log("creators", creators)
  

 creators.forEach((data) => {
    console.log("data", data)
    console.log(data.country)
    const age = calculateAge(data.creator.birthDate); // Ensure correct function call
  
    if (age !== null) {
      if (age >= 18 && age <= 24) ageGroups['18-24'] += 1;
      else if (age >= 25 && age <= 34) ageGroups['25-34'] += 1;
      else if (age >= 35 && age <= 44) ageGroups['35-44'] += 1;
      else if (age >= 45 && age <= 54) ageGroups['45-54'] += 1;
      else ageGroups['55+'] += 1;
    }
  
    // Ensure 'pronounce' exists and is in a known format
    const gender = data.creator.pronounce?.toLowerCase();
    console.log("Gender", gender)
    if (gender?.includes('he/him')) genderStats.Male += 1;
    else if (gender?.includes('she/her')) genderStats.Female += 1;
    else genderStats.Other += 1;
  });
  
  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Total Creators on Platform
        </Typography>

        {/* Line Graph - Filter by Age Range */}
        <LineChart
          width={400}
          height={200}
          series={[{ data: Object.values(ageGroups), label: 'Creators by Age' }]}
          xAxis={[{ scaleType: 'point', data: Object.keys(ageGroups) }]}
        />
        

        {/* <BarChart
        width={400}
        height={200}
        series={[{
            data: ageData.map(item => item.value), // Value for each age group
            label: 'Creators by Age',
        }]}
        xAxis={[{
            scaleType: 'point',
            data: ageData.map(item => item.label), // Labels for each age group
        }]}
        /> */}

        {/* Pie Chart - Gender Distribution */}
        <PieChart
          series={[
            {
              data: Object.entries(genderStats)
                .map(([label, value], index) => ({ id: index + 1, value, label }))
                .filter((item) => item.value > 0),
            },
          ]}
          width={300}
          height={200}
        />
      </CardContent>
    </Card>
  );
}
