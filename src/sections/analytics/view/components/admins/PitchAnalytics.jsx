/* eslint-disable no-unused-vars */
/* eslint-disable perfectionist/sort-imports */

import { useState, useEffect } from "react";
import axiosInstance, { endpoints } from 'src/utils/axios';
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import {  Card, Table, TableRow,  TableHead,  TableBody, TableCell,    CardContent,  TableContainer, Typography,  } from "@mui/material";



dayjs.extend(duration);

export default function ApprovePitch() {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPitches() {
      try {
        const response = await axiosInstance.get(endpoints.campaign.pitch.all);
        setPitches(response.data.pitches);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch pitches");
      } finally {
        setLoading(false);
      }
    }

    fetchPitches();
  }, []);

  console.log("pitches", pitches)

  //   if (loading) return <Typography>Loading...</Typography>;
  //   if (error) return <Typography>Error: {error}</Typography>;
  //   if (pitches.length === 0) return <Typography>No pitches found.</Typography>;
  // Filter pitches that have both createdAt and completedAt
  const validPitches = pitches.filter(pitch => pitch.createdAt && pitch.completedAt);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Pitch Approval
        </Typography>

        <Typography variant="h8" m={2} gutterBottom>
          Only pitches that have been approved or rejected will be displayed here
        </Typography>

        {loading && <Typography>Loading...</Typography>}
        {error && <Typography>Error: {error}</Typography>}

        {/* Display table only if there are valid pitches */}
        {validPitches.length > 0 ? (
          <TableContainer>
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
          <Typography>No completed pitches found.</Typography>
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
