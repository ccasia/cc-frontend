import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import React, { useState, useEffect } from "react";

import { 
    Box, 
    Card, 
    Table, 
    TableRow, 
    TableHead, 
    TableBody, 
    TableCell, 
    Typography, 
    CardContent, 
    TableContainer
 } from "@mui/material";

import axiosInstance, { endpoints } from "src/utils/axios";

// Extend dayjs to use duration plugin
dayjs.extend(duration);

export default function SendAgreementsAnalytics() {
  const [creatorAgreements, setCreatorAgreements] = useState([]); // Ensure it's initialized as an empty array
  const [loading, setLoading] = useState(true);
  //    const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchCreatorAgreements() {
        try {
            const response = await axiosInstance.get(endpoints.campaign.allcreatorAgreement);
            // console.log(response.data);
            setCreatorAgreements(response.data); 
          } catch (error) {
            console.error('Error fetching creator agreements:', error);
            // setError(error.message || 'An error occurred');
          }
        }

    fetchCreatorAgreements();
  }, []);

  console.log("creators", creatorAgreements)
  
  // Filter only creator agreements with a completedAt value
  const completedCreatorAgreements = (creatorAgreements || []).filter(agreement => agreement.completedAt);

  console.log("Completed Creator Agreements", completedCreatorAgreements)

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h3" gutterBottom style={{ fontFamily: 'Instrument Serif', fontWeight: 550 }}>
          Sending Agreements
        </Typography>

        {/* Display table only if there are completed creator agreements */}
        {completedCreatorAgreements.length > 0 ? (
          <TableContainer
          component="div"
          sx={{
            maxHeight: 350,
            overflowY: 'auto',
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Creator</TableCell>
                  <TableCell>Turnaround Time</TableCell>
                  <TableCell>Approved By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {completedCreatorAgreements.map((agreement) => {
                  // Convert agreement date to formatted string using dayjs
                  const createdAt = dayjs(agreement.createdAt);
                  const completedAt = dayjs(agreement.completedAt);

                  // Calculate the turnaround time using dayjs duration
                  const turnaroundTimeInSeconds = agreement.turnaroundTime;
                  let formattedTurnaroundTime = "";

                  if (turnaroundTimeInSeconds) {
                    const durationObj = dayjs.duration(turnaroundTimeInSeconds, "seconds");
                    if (durationObj.asMinutes() < 1) {
                      formattedTurnaroundTime = `${durationObj.asSeconds()} seconds`;
                    } else {
                      formattedTurnaroundTime = `${durationObj.minutes()} min ${durationObj.seconds()} sec`;
                    }
                  }

                  return (
                    <TableRow key={agreement.id}>
                      <TableCell>{agreement.user?.name}</TableCell>
                      <TableCell>{formattedTurnaroundTime}</TableCell>
                      <TableCell>{agreement.approvedByAdmin?.name}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
            textAlign="center"
            mt={5}
          >
            <Box
              style={{
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                backgroundColor: '#f5f5f5',
                borderRadius: '50%',
                marginBottom: '16px',
              }}
            >
              😿
            </Box>
            <Typography variant="h3" style={{ fontFamily: 'Instrument Serif', fontWeight: 550 }}>
              No data to show
            </Typography>
            <Typography variant="subtitle2" color="#636366">
              Turnaround data can be visible for newer submissions
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
