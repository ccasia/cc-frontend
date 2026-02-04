/* eslint-disable no-unused-vars */
/* eslint-disable perfectionist/sort-imports */

import useSWR from 'swr';
import { useMemo } from "react";
import { fetcher, endpoints } from 'src/utils/axios';
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
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
  TableContainer,
  } from "@mui/material";



dayjs.extend(duration);

export default function ApprovePitch() {
  // OPTIMIZED: Use SWR with aggressive caching to reduce load time
  const { data, isLoading: loading, error } = useSWR(
    endpoints.campaign.pitch.all,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 120000, // Cache for 2 minutes
      keepPreviousData: true,
    }
  );

  // OPTIMIZED: Memoize filtered data to prevent unnecessary re-calculations
  const validPitches = useMemo(() => {
    const pitches = data?.pitches || [];
    return pitches.filter(pitch => pitch.createdAt && pitch.completedAt);
  }, [data]);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h3" gutterBottom style={{ fontFamily: 'Instrument Serif', fontWeight: 550 }}>
          Pitch Approval
        </Typography>

        {/* <Typography variant="h8" m={2} gutterBottom>
          Only pitches that have been approved or rejected will be displayed here
        </Typography> */}

        {loading && <Typography>Loading...</Typography>}
        {error && <Typography>Error: {error}</Typography>}

        {/* Display table only if there are valid pitches */}
        {validPitches.length > 0 ? (
          <TableContainer
          component="div"
          sx={{
            maxHeight: 350,
            overflowY: 'auto',
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Pitch ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>TimeTaken</TableCell>
                  <TableCell>Approved By</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {validPitches.map((pitch) => {
                  // Calculate turnaround time in seconds using dayjs
                  const createdAt = dayjs(pitch.createdAt);
                  const completedAt = dayjs(pitch.completedAt);
                  const diffInSeconds = completedAt.diff(createdAt, "second");

                  // Format turnaround time as min:sec if more than 60 seconds
                  let turnaroundTime = `${diffInSeconds} seconds`;
                  if (diffInSeconds > 60) {
                    const shomoi = dayjs.duration(diffInSeconds, "seconds");
                    turnaroundTime = `${shomoi.minutes()}m ${shomoi.seconds()}s`;
                  }

                  return (
                    <TableRow key={pitch.id}>
                      <TableCell>{pitch.id}</TableCell>
                      <TableCell>
                         <Box display="flex" alignItems="center">
                         {pitch.status === "approved" ? (
                          <>
                            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                            Approved
                          </>
                        ) : (
                          <>
                            <HourglassEmptyIcon color="warning" sx={{ mr: 1 }} />
                            Pending Approval
                          </>
                        )}

                         </Box>
                      
                      </TableCell>
                      <TableCell>{turnaroundTime}</TableCell>
                      <TableCell>{pitch.admin?.user?.name || "Not approved yet"}</TableCell>
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
            Turn Around data can be visible for new Pitch&apos;s
          </Typography>
        </Box>
        )}

        {/* If there are no valid pitches, show this message */}
        {validPitches.length === 0 && !loading && (
          <Typography variant="body2" color="textSecondary">
            Turnaround time can only be calculated for completed pitches.
          </Typography>
        )}
      </CardContent>
    </Card>

  );
}
