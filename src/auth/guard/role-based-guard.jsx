import { m } from 'framer-motion';
import PropTypes from 'prop-types';

import { Button } from '@mui/material';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { ForbiddenIllustration } from 'src/assets/illustrations';

import { varBounce, MotionContainer } from 'src/components/animate';

import { useAuthContext } from '../hooks';

// ----------------------------------------------------------------------

export default function RoleBasedGuard({ hasContent, roles, children, sx }) {
  const { user } = useAuthContext();
  const router = useRouter();

  const hasPermission = () => {
    if (typeof roles === 'undefined') return true;
    
    if (roles.includes('god')) {
      const godPermission = roles.includes(user?.admin?.mode) || roles.includes(user?.role) || roles.includes(user?.admin?.role?.name);
      console.log('God role check result:', godPermission);
      return godPermission;
    }
    
    if (roles.includes(user?.role)) return true;
    
    if (user?.role === 'admin' && roles.includes(user?.admin?.role?.name)) {
      return true;
    }
    
    return false;
  };

  if (!hasPermission()) {
    return hasContent ? (
      <Container component={MotionContainer} sx={{ textAlign: 'center', ...sx }}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Permission Denied
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            You do not have permission to access this page
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <ForbiddenIllustration
            sx={{
              height: 260,
              my: { xs: 5, sm: 10 },
            }}
          />
        </m.div>
        <Button variant="outlined" onClick={() => router.push(paths.dashboard.root)}>
          Go Home
        </Button>
      </Container>
    ) : null;
  }

  return <> {children} </>;
}

RoleBasedGuard.propTypes = {
  children: PropTypes.node,
  hasContent: PropTypes.bool,
  roles: PropTypes.arrayOf(PropTypes.string),
  sx: PropTypes.object,
};
