// components/admins/SendAgreementsAnalytics.jsx

import React, { useState, useEffect } from "react";
import axiosInstance, { endpoints } from "src/utils/axios";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PauseCircleOutlineIcon from "@mui/icons-material/PauseCircleOutline";
import AlarmOnIcon from "@mui/icons-material/AlarmOn";
import EditIcon from "@mui/icons-material/Edit";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import { Card, Table, TableRow, TableHead, TableBody, TableCell, CardContent, TableContainer, Typography, CircularProgress, Box } from "@mui/material";
import { sub } from "date-fns";

// Extend dayjs to use duration plugin
dayjs.extend(duration);

export default function DraftAnalytics() {
  const [submissions, setSubmissions] = useState([]); // Ensure it's initialized as an empty array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const statusConfig = {
    APPROVED: { label: "Approved", icon: <CheckCircleIcon color="success" sx={{ mr: 1 }} /> },
    REJECTED: { label: "Rejected", icon: <CancelIcon color="error" sx={{ mr: 1 }} /> },
    ON_HOLD: { label: "On Hold", icon: <PauseCircleOutlineIcon color="info" sx={{ mr: 1 }} /> },
    OVERDUE: { label: "Overdue", icon: <AlarmOnIcon color="error" sx={{ mr: 1 }} /> },
    CHANGES_REQUIRED: { label: "Changes Required", icon: <EditIcon color="warning" sx={{ mr: 1 }} /> },
    PENDING: { label: "Pending Approval", icon: <HourglassEmptyIcon color="warning" sx={{ mr: 1 }} /> },
  };

  const getStatusContent = (status) => {
    return statusConfig[status] || statusConfig["PENDING"];
  };

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const response = await axiosInstance.get(endpoints.submission.all);
        setSubmissions(response.data.submissions || []); // Ensure submissions is an array
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch submissions");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  console.log("draft", submissions)
  // Filter only submissions with type "First Draft"
  const fistDraftSubmissions = submissions.filter(submission => submission.type === "FIRST_DRAFT" && submission.turnaroundTime > 0);

  // Filter only submissions with type "Final Draft"
  const finalDraftSubmissions = submissions.filter(submission => submission.type === "FINAL_DRAFT" && submission.status === "APPROVED");

  console.log("Agreement", fistDraftSubmissions)

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h3" gutterBottom style={{ fontFamily: 'Instrument Serif', fontWeight: 550 }}>
            First Draft
          </Typography>

          {/* Loading and Error Handling */}

          {/* Display table only if there are agreement submissions */}
          {fistDraftSubmissions.length > 0 ? (
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
                    <TableCell>Status</TableCell>
                    <TableCell>Turnaround Time</TableCell>
                    <TableCell>Approved By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fistDraftSubmissions.map((submission) => {
                    // Convert submission date to formatted string using dayjs
                    const submissionDate = dayjs(submission.createdAt);
                    const completedDate = submission.completedAt ? dayjs(submission.completedAt) : null;

                    // Calculate the turnaround time using dayjs duration
                    const turnaroundTimeInSeconds = submission.draftTurnaroundTime;
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
                      <TableRow key={submission.id}>
                        <TableCell>{submission.user?.name}</TableCell>
                        {/* <TableCell>
                         {submission.status === "APPROVED" ? (
                          <>
                            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                            Approved
                          </>
                        ) : submission.status === "REJECTED" ? (
                          <>
                            <CancelIcon color="error" sx={{ mr: 1 }} />
                            Rejected
                          </>
                        ) : submission.status === "ON_HOLD" ? (
                          <>
                            <PauseCircleOutlineIcon color="info" sx={{ mr: 1 }} />
                            On Hold
                          </>
                        ) : submission.status === "OVERDUE" ? (
                          <>
                            <AlarmOnIcon color="error" sx={{ mr: 1 }} />
                            Overdue
                          </>
                        ) : submission.status === "CHANGES_REQUIRED" ? (
                          <>
                            <EditIcon color="warning" sx={{ mr: 1 }} />
                            Changes Required
                          </>
                        ) : (
                          <>
                            <HourglassEmptyIcon color="warning" sx={{ mr: 1 }} />
                            Pending Approval
                          </>
                        )}
                      </TableCell> */}
                        <TableCell>
                          {(() => {
                            const { label, icon } = getStatusContent(submission.status);
                            return (
                              <>
                                {icon} {label}
                              </>
                            );
                          })()}
                        </TableCell>
                        <TableCell>{formattedTurnaroundTime}</TableCell>
                        <TableCell>{submission.approvedByAdmin?.name || "N/A"}</TableCell>
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
                Turn Around data can be visible for newer submissions
              </Typography>
            </Box>
          )}

          {/* If there are no agreement submissions, show this message */}
          {/* {fistDraftSubmissions.length === 0 && !loading && (
          // <Typography variant="body2" color="textSecondary">
          //   Turnaround time can only be calculated for completed submissions of type "AGREEMENT_FORM".
          // </Typography>
        )} */}
        </CardContent>
      </Card>


      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h3" gutterBottom style={{ fontFamily: 'Instrument Serif', fontWeight: 550 }}>
            Final Draft
          </Typography>

          {/* Loading and Error Handling */}
          {loading && <CircularProgress />}
          {error && <Typography color="error">{error}</Typography>}

          {/* Display table only if there are agreement submissions */}
          {finalDraftSubmissions.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Creator</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Turnaround Time</TableCell>
                    <TableCell>Approved By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {finalDraftSubmissions.map((submission) => {
                    // Convert submission date to formatted string using dayjs
                    const submissionDate = dayjs(submission.createdAt);
                    const completedDate = submission.completedAt ? dayjs(submission.completedAt) : null;

                    // Calculate the turnaround time using dayjs duration
                    const turnaroundTimeInSeconds = submission.draftTurnaroundTime;
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
                      <TableRow key={submission.id}>
                        <TableCell>{submission.user?.name}</TableCell>
                        <TableCell>
                          {(() => {
                            const { label, icon } = getStatusContent(submission.status);
                            return (
                              <>
                                {icon} {label}
                              </>
                            );
                          })()}
                        </TableCell>
                        <TableCell>{formattedTurnaroundTime}</TableCell>
                        <TableCell>{submission.approvedByAdmin?.name || "N/A"}</TableCell>
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
                Turn Around data can be visible for newer submissions
              </Typography>
            </Box>
          )}

        </CardContent>
      </Card>
    </>

  );
}
