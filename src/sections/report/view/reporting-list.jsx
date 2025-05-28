import { Container, Typography } from "@mui/material"
import ReportLanding from "../components/report-landing";
import { useSettingsContext } from "src/components/settings";
import CampaignPerformanceTable from "../components/campaign-performance-table";

const ReportingList = () => {
	const settings = useSettingsContext();

	return (
		<Container
      maxWidth={settings.themeStretch ? false : 'xl'}
      sx={{
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
			<Typography
				sx={{
					fontFamily: 'Aileron',
					fontSize: { xs: 24, md: 48 },
					fontWeight: 400,
				}}
			>
				Content Performance Report
			</Typography>
			
			<CampaignPerformanceTable />

			<ReportLanding />
		</Container>
	);
}

export default ReportingList;