import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import { alpha, styled } from '@mui/material/styles';
import ListItemButton from '@mui/material/ListItemButton';

import { RouterLink } from 'src/routes/components';

import { useAuthContext } from 'src/auth/hooks';

import Label from 'src/components/label';

import Iconify from '../../iconify';

// ----------------------------------------------------------------------

const NavItem = forwardRef(
  (
    {
      title,
      path,
      icon,
      msgcounter,
      info,
      disabled,
      caption,
      roles,
      //
      open,
      depth,
      active,
      hasChild,
      externalLink,
      currentRole = 'superadmin',
      ...other
    },
    ref
  ) => {
    const subItem = depth !== 1;

    const { user } = useAuthContext();

    const renderContent = (
      <StyledNavItem
        ref={ref}
        disableGutters
        open={open}
        depth={depth}
        active={active}
        disabled={disabled}
        {...other}
      >
        {!subItem && icon && (
          <Box component="span" className="icon">
            {icon}
          </Box>
        )}

        {subItem && icon ? (
          <Box component="span" className="icon">
            {icon}
          </Box>
        ) : (
          <Box component="span" className="sub-icon" />
        )}

        {title && (
          <Box component="span" sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Box component="span" className="label">
              {title}
            </Box>

            {caption && (
              <Tooltip title={caption} placement="top-start">
                <Box component="span" className="caption">
                  {caption}
                </Box>
              </Tooltip>
            )}
          </Box>
        )}

        {info && (
          <Box component="span" className="info">
            {info}
          </Box>
        )}

        {msgcounter && (
          <Label
            sx={{
              color: 'white',
              backgroundColor: '#de5243',
              borderRadius: '12px',
              padding: '2px 6px',
              height: '24px',
              width: '32px',
              fontWeight: 550,
              fontSize: '13px',
            }}
          >
            {msgcounter}
          </Label>
        )}

        {hasChild && (
          <Iconify
            width={16}
            className="arrow"
            icon={open ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
          />
        )}
      </StyledNavItem>
    );

    if (user?.role === 'admin' && roles && !roles?.includes(user?.admin?.role?.name)) {
      return null;
    }

    if (user?.role !== 'admin' && roles && !roles.includes(user?.role)) {
      return null;
    }

    // if (title === 'Clients' && user?.admin?.mode !== 'god') return null;

    if (hasChild) {
      return renderContent;
    }

    if (externalLink)
      return (
        <Link
          href={path}
          target="_blank"
          rel="noopener"
          color="inherit"
          underline="none"
          sx={{
            ...(disabled && {
              cursor: 'default',
            }),
          }}
        >
          {renderContent}
        </Link>
      );

    return (
      <Link
        component={RouterLink}
        href={path}
        color="inherit"
        underline="none"
        sx={{
          ...(disabled && {
            cursor: 'default',
          }),
        }}
      >
        {renderContent}
      </Link>
    );
  }
);

NavItem.propTypes = {
  open: PropTypes.bool,
  active: PropTypes.bool,
  path: PropTypes.string,
  depth: PropTypes.number,
  msgcounter: PropTypes.number,
  icon: PropTypes.element,
  info: PropTypes.element,
  title: PropTypes.string,
  disabled: PropTypes.bool,
  hasChild: PropTypes.bool,
  caption: PropTypes.string,
  externalLink: PropTypes.bool,
  currentRole: PropTypes.string,
  roles: PropTypes.arrayOf(PropTypes.string),
};

export default NavItem;

// ----------------------------------------------------------------------

const StyledNavItem = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== 'active',
})(({ active, open, depth, theme }) => {
  const subItem = depth !== 1;

  const opened = open && !active;

  const deepSubItem = Number(depth) > 2;

  const noWrapStyles = {
    width: '100%',
    maxWidth: '100%',
    display: 'block',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  };

  const baseStyles = {
    item: {
      marginBottom: 4,
      borderRadius: 12,
      color: theme.palette.text.secondary,
      padding: theme.spacing(0.5, 1, 0.5, 1.5),
    },
    icon: {
      width: 24,
      height: 24,
      flexShrink: 0,
      marginRight: theme.spacing(1),
      ...(active && {
        color:
          theme.palette.mode === 'light' ? 'rgba(19, 64, 255, 1)' : theme.palette.primary.light,
      }),
    },
    label: {
      ...noWrapStyles,
      ...theme.typography.body2,
      textTransform: 'capitalize',
      fontWeight: theme.typography[active ? 'fontWeightSemiBold' : 'fontWeightMedium'],
    },
    caption: {
      ...noWrapStyles,
      ...theme.typography.caption,
      color: theme.palette.text.disabled,
    },
    info: {
      display: 'inline-flex',
      marginLeft: theme.spacing(0.75),
    },
    arrow: {
      flexShrink: 0,
      marginLeft: theme.spacing(0.75),
      ...(opened && {
        color: 'rgba(19, 64, 255, 1)',
      }),
    },
  };

  return {
    // Root item
    ...(!subItem && {
      ...baseStyles.item,
      position: 'relative',
      minHeight: 44,
      '& .icon': {
        ...baseStyles.icon,
      },
      '& .sub-icon': {
        display: 'none',
      },
      '& .label': {
        ...baseStyles.label,
      },
      '& .caption': {
        ...baseStyles.caption,
      },
      '& .info': {
        ...baseStyles.info,
      },
      '& .arrow': {
        ...baseStyles.arrow,
      },

      ...(active && {
        fontWeight: 900,
        color: 'rgba(19, 64, 255, 1)',
        background: alpha('rgba(19, 64, 255, 1)', 0.08),
        // '::before': {
        //   content: '""',
        //   width: 8,
        //   height: 20,
        //   backgroundColor: 'blue',
        //   position: 'absolute',
        //   left: -20,
        //   top: '50%',
        //   transform: 'translateY(-50%)',
        //   borderRadius: 10,
        // },
        '&:hover': {
          backgroundColor: alpha('#203ff5', 0.2),
        },
      }),
      ...(opened && {
        color: 'rgba(19, 64, 255, 1)',
        backgroundColor: alpha('rgba(19, 64, 255, 1)', 0.08),
        '&:hover': {
          backgroundColor: alpha('#203ff5', 0.2),
        },
        '& .arrow': {
          color: 'rgba(19, 64, 255, 1)',
        },
      }),
    }),

    // Sub item
    ...(subItem && {
      ...baseStyles.item,
      minHeight: 36,
      '& .icon': {
        ...baseStyles.icon,
      },
      '& .sub-icon': {
        ...baseStyles.icon,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:before': {
          content: '""',
          width: 4,
          height: 4,
          borderRadius: '50%',
          backgroundColor: theme.palette.text.disabled,
          transition: theme.transitions.create(['transform'], {
            duration: theme.transitions.duration.shorter,
          }),
          ...(active && {
            transform: 'scale(2)',
            backgroundColor: 'rgba(45, 194, 98, 1)',
          }),
          ...(opened && {
            backgroundColor: 'rgba(45, 194, 98, 1)',
          }),
        },
      },
      '& .label': {
        ...baseStyles.label,
      },
      '& .caption': {
        ...baseStyles.caption,
      },
      '& .info': {
        ...baseStyles.info,
      },
      '& .arrow': {
        ...baseStyles.arrow,
      },
      ...(active && {
        color: 'rgba(19, 64, 255, 1)',
      }),
      ...(opened && {
        color: 'rgba(19, 64, 255, 1)',
        backgroundColor: alpha('rgba(19, 64, 255, 1)', 0.08),
        '&:hover': {
          backgroundColor: alpha('#203ff5', 0.2),
        },
      }),
    }),

    // Deep sub item
    ...(deepSubItem && {
      paddingLeft: `${theme.spacing(Number(depth))} !important`,
    }),
  };
});
