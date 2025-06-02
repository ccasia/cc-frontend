import { Box, Typography } from "@mui/material";

export default function ReportLanding() {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '60vh',
				gap: 4,
			}}
		>
			<Typography
				sx={{
					fontFamily: 'Instrument Serif',
					fontSize: { xs: 28, md: 36 },
					color: '#0066FF',
					textAlign: 'center',
					maxWidth: 600,
					lineHeight: 1.2,
				}}
			>
				Get insights and analytics into the posts of any creator!
			</Typography>

			<Box
				component="img"
				alt="empty content"
				src="/assets/icons/components/ic_report.svg"
				sx={{ width: 1, maxWidth: 160 }}
			/>
		</Box>
	);
};