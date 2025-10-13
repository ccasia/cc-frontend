import { Helmet } from 'react-helmet-async';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { Box, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

import MediaKit from 'src/sections/creator/media-kit-public/view/mediakit-view';

export default function ClientMediaKitPage() {
  const params = useParams();
  const { id } = params;
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <Helmet>
        <title>Creator Media Kit</title>
      </Helmet>
      <Box sx={{ mb: 2, mt: 2, px: 2 }}>
        <IconButton
          onClick={() => {
            if (location?.state?.returnTo) {
              navigate(location.state.returnTo.pathname + location.state.returnTo.search, {
                state: location.state.reopenModal
              });
            } else {
              navigate('/dashboard');
            }
          }}
          sx={{
            backgroundColor: 'white',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e7e7e7',
            borderRadius: 2,
            width: 48,
            height: 48,
            '&:hover': {
              backgroundColor: '#f5f5f5',
              boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
            },
          }}
        >
          <Iconify icon="eva:arrow-back-fill" width={24} />
        </IconButton>
      </Box>
      {id ? <MediaKit id={id} hideBackButton hideShareButton /> : <div>Creator ID not found</div>}
    </>
  );
}
