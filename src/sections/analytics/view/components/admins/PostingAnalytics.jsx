/* eslint-disable no-unused-vars */
/* eslint-disable perfectionist/sort-imports */

import { useState, useEffect } from "react";
import axiosInstance, { endpoints } from "src/utils/axios";
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

export default function PostingAnalytics() {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    // Filter submissions of type "AGREEMENT_FORM" that have both submissionDate & completedAt
    const validSubmissions = submissions.filter(
        (submission) =>
            submission.type === "POSTING" &&
            submission.submissionDate &&
            submission.completedAt
    );

    //  console.log("posting submissions", validSubmissions);

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography
                    variant="h3"
                    gutterBottom
                    style={{ fontFamily: "Instrument Serif", fontWeight: 550 }}
                >
                    Posting
                </Typography>

                {loading && <Typography>Loading...</Typography>}
                {error && <Typography>Error: {error}</Typography>}

                {validSubmissions.length > 0 ? (
                    <TableContainer
                        component="div"
                        sx={{
                            maxHeight: 350,
                            overflowY: "auto",
                        }}
                    >
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Posting ID</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Time Taken</TableCell>
                                    <TableCell>Approved By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {validSubmissions.map((submission) => {
                                    // Calculate turnaround time (completedAt - submissionDate)
                                    const submissionDate = dayjs(submission.submissionDate);
                                    const completedAt = dayjs(submission.completedAt);
                                    const diffInSeconds = completedAt.diff(submissionDate, "second");

                                    // Format turnaround time: min:sec if >60 seconds
                                    let turnaroundTime = `${diffInSeconds} seconds`;
                                    if (diffInSeconds > 60) {
                                        const durationObj = dayjs.duration(diffInSeconds, "seconds");
                                        turnaroundTime = `${durationObj.minutes()}m ${durationObj.seconds()}s`;
                                    }

                                    return (
                                        <TableRow key={submission.id}>
                                            <TableCell>{submission.id}</TableCell>
                                            <TableCell>
                                                {(submission.status === "IN_PROGRESS" || submission.status === "APPROVED") ? (
                                                    <Box display="flex" alignItems="center">
                                                        <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                                        Sent
                                                    </Box>
                                                ) : (
                                                    <Box display="flex" alignItems="center">
                                                        <HourglassEmptyIcon color="warning" sx={{ mr: 1 }} />
                                                        Pending
                                                    </Box>
                                                )}
                                            </TableCell>
                                            <TableCell>{turnaroundTime}</TableCell>
                                            <TableCell>{submission.approvedByAdmin?.name || "Null"}</TableCell>
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
                                width: "80px",
                                height: "80px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "40px",
                                backgroundColor: "#f5f5f5",
                                borderRadius: "50%",
                                marginBottom: "16px",
                            }}
                        >
                            😿
                        </Box>
                        <Typography variant="h3" style={{ fontFamily: "Instrument Serif", fontWeight: 550 }}>
                            No data to show
                        </Typography>
                        <Typography variant="subtitle2" color="#636366">
                            Turnaround data will be visible when submissions are processed.
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
}
