import useSWR from 'swr';
import { useMemo } from "react";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

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

import { fetcher, endpoints } from "src/utils/axios";

// Extend dayjs to use duration plugin
dayjs.extend(duration);

export default function SendAgreementsAnalytics() {
  // OPTIMIZED: Use SWR with aggressive caching to reduce load time
  const { data: creatorAgreements, isLoading: loading } = useSWR(
    endpoints.campaign.allcreatorAgreement,
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
  const completedCreatorAgreements = useMemo(() => 
    (creatorAgreements || []).filter(agreement => agreement.completedAt)
  , [creatorAgreements]);

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
