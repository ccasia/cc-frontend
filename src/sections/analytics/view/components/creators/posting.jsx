/* eslint-disable no-unused-vars */
/* eslint-disable perfectionist/sort-imports */

import useSWR from 'swr';
import { useMemo } from "react";
import { fetcher, endpoints } from "src/utils/axios";
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

export default function CreatorSendPosting() {
    // OPTIMIZED: Use SWR with aggressive caching - shared across multiple components
    const { data, isLoading: loading, error } = useSWR(
        endpoints.submission.all,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnMount: true,
            revalidateOnReconnect: false,
            revalidateIfStale: false,
            dedupingInterval: 120000, // Cache for 2 minutes - shared cache
            keepPreviousData: true,
        }
    );

    // OPTIMIZED: Memoize filtered data to prevent unnecessary re-calculations
    const validSubmissions = useMemo(() => {
        const submissions = data?.submissions || [];
        return submissions.filter(
            (submission) =>
                submission.type === "POSTING" &&
                submission.submissionDate &&
                submission.nextsubmission
        );
    }, [data]);

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
                                    <TableCell>Submitted By</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {validSubmissions.map((submission) => {
                                    // Calculate turnaround time (completedAt - submissionDate)
                                    const submissionDate = dayjs(submission.submissionDate);
                                    const completedAt = dayjs(submission.nextsubmission);
                                    const diffInSeconds = submissionDate.diff(completedAt, "second");

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
                                            <TableCell>{submission.user?.name || "Not approved yet"}</TableCell>
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
