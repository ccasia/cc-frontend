import useSWR from 'swr';
import { mutate } from 'swr';
import { Box, Typography } from '@mui/material';
import { fetcher } from 'src/utils/axios';

export default function CampaignLogisticsClient({ campaign, id }) {
  const campaignId = id || campaign?.id;
  const { data } = useSWR(
    campaignId ? `/api/campaign/getClientByCampID/${campaignId}` : null,
    fetcher,
    { refreshInterval: 0 }
  );
  const sheetLink = data?.spreadSheetURL;
  return (
    <Box sx={{ mb: 5 }}>
      <Typography
        mb={1}
        sx={{
          fontFamily: 'Instrument Serif, serif',
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '32px',
          lineHeight: '36px',
          letterSpacing: 0,
          color: '#221f20',
        }}
      >
        Google Sheet Link
      </Typography>
      <Typography
        mb={5}
        sx={{
          fontFamily: 'Inter Display, Inter, sans-serif',
          fontWeight: 400,
          fontStyle: 'normal',
          fontSize: '14px',
          lineHeight: '18px',
          letterSpacing: 0,
          color: '#636366',
        }}
      >
        This link will take you to the tracking of your Product Deliveries and Store Visits/Reservations
      </Typography>

      <Typography
        sx={{
          fontFamily: 'Inter Display, Inter, sans-serif',
          fontWeight: 500,
          fontSize: '12px',
          lineHeight: '16px',
          color: '#636366',
          mb: 1,
        }}
      >
        Google Sheet Link
      </Typography>
      <Box mb={2}>
        {sheetLink ? (
          <Box
            sx={{
              width: '303.33px',
              height: '44px',
              pt: '10px',
              pb: '10px',
              pr: '12px',
              pl: '12px',
              borderRadius: 2,
              color: '#377DFF',
              border: '1px solid #E7E7E7',
              fontFamily: 'Inter Display, Inter, sans-serif',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '18px',
              letterSpacing: 0,
              boxShadow: 'none',
              opacity: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#fff',
              overflow: 'auto'
            }}
          >
            <a
              href={sheetLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration: 'underline',
                color: '#377DFF',
                fontWeight: 400,
                fontSize: '14px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                width: '100%'
              }}
              title={sheetLink}
            >
              {sheetLink}
            </a>
          </Box>
        ) : (
          <Box
            sx={{
              width: '303.33px',
              height: '44px',
              pt: '10px',
              pb: '10px',
              pr: '12px',
              pl: '12px',
              borderRadius: 2,
              border: '1px solid #E7E7E7',
              color: '#A0A0A0',
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#fafafa',
              fontFamily: 'Inter Display, Inter, sans-serif',
            }}
          >
            No link set.
          </Box>
        )}
      </Box>
    </Box>
  );
}
