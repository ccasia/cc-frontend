import { Container, Typography } from "@mui/material"

const DiscoveryToolView = () => {
	return (
		<Container>
			<Typography
				sx={{
					fontFamily: 'Aileron',
					fontSize: { xs: 24, md: 48 },
					fontWeight: 400,
				}}
			>
				Creator Discovery Tool
			</Typography>
		</Container>
	);
}

export default DiscoveryToolView;