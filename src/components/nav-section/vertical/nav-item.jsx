import PropTypes from 'prop-types';
import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
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
      collapsed,
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
        collapsed={collapsed}
        disabled={disabled}
        data-nav-item="true"
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

        {title && !collapsed && (
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

        {info && !collapsed && (
          <Box component="span" className="info">
            {info}
          </Box>
        )}

        {msgcounter && !collapsed && (
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

        {msgcounter && collapsed && (
          <Box
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#de5243',
              border: '2px solid white',
            }}
          />
        )}

        {hasChild && !collapsed && (
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
  collapsed: PropTypes.bool,
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
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'collapsed',
})(({ active, open, depth, collapsed, theme }) => {
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
      borderRadius: 8,
      color: theme.palette.text.secondary,
      minHeight: collapsed ? 40 : 42,
      transition: theme.transitions.create(['padding', 'background-color', 'color', 'min-height'], {
        duration: theme.transitions.duration.standard,
        easing: theme.transitions.easing.easeInOut,
      }),
      '&:hover': {
        backgroundColor: theme.palette.action.hover,
      },
    },
    icon: {
      width: 20,
      height: 20,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: collapsed ? 0 : theme.spacing(1.25),
      transition: theme.transitions.create(['margin-right', 'margin-left'], {
        duration: theme.transitions.duration.standard,
        easing: theme.transitions.easing.easeInOut,
      }),
      ...(active && {
        color: '#1340FF',
      }),
    },
    label: {
      ...noWrapStyles,
      ...theme.typography.body2,
      textTransform: 'capitalize',
      fontWeight: theme.typography[active ? 'fontWeightSemiBold' : 'fontWeightMedium'],
      fontSize: '14px',
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
        color: '#1340FF',
      }),
    },
  };

  return {
    // Root item
    ...(!subItem && {
      ...baseStyles.item,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: collapsed ? 'center' : 'flex-start',
      padding: collapsed 
        ? theme.spacing(0.875) 
        : theme.spacing(0.625, 1.25),
      width: collapsed ? 40 : 'auto',
      margin: collapsed ? '0 auto' : '0',
      '& .icon': {
        ...baseStyles.icon,
        marginLeft: 0,
        marginRight: collapsed ? 0 : theme.spacing(1.25),
      },
      '& .sub-icon': {
        display: 'none',
      },
      '& .label': {
        ...baseStyles.label,
        opacity: collapsed ? 0 : 1,
        transition: theme.transitions.create(['opacity'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
          delay: collapsed ? 0 : theme.transitions.duration.shorter,
        }),
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
        fontWeight: 600,
        color: '#1340FF',
        backgroundColor: 'rgba(19, 64, 255, 0.08)',
        '&:hover': {
          backgroundColor: 'rgba(19, 64, 255, 0.12)',
        },
      }),
      ...(opened && {
        color: '#1340FF',
        backgroundColor: 'rgba(19, 64, 255, 0.04)',
        '&:hover': {
          backgroundColor: 'rgba(19, 64, 255, 0.08)',
        },
        '& .arrow': {
          color: '#1340FF',
        },
      }),
    }),

    // Sub item
    ...(subItem && {
      ...baseStyles.item,
      minHeight: 36,
      display: 'flex',
      alignItems: 'center',
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
            backgroundColor: '#10b981',
          }),
          ...(opened && {
            backgroundColor: '#10b981',
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
        color: '#1340FF',
        fontWeight: 600,
      }),
      ...(opened && {
        color: '#1340FF',
        backgroundColor: 'rgba(19, 64, 255, 0.04)',
        '&:hover': {
          backgroundColor: 'rgba(19, 64, 255, 0.08)',
        },
      }),
    }),

    // Deep sub item
    ...(deepSubItem && {
      paddingLeft: `${theme.spacing(Number(depth))} !important`,
    }),
  };
});
