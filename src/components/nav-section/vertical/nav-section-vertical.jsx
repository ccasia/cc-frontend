import PropTypes from 'prop-types';
import { memo, useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import { Divider, Collapse, ListSubheader } from '@mui/material';

import NavList from './nav-list';

// ----------------------------------------------------------------------

// Helper function to generate unique keys from navigation items
const getNavItemKey = (item, index) => {
  if (item.path) {
    return item.path;
  }
  
  // If title is a React element, try to extract text content
  if (typeof item.title === 'object' && item.title?.props?.children) {
    return `nav-${item.title.props.children.replace(/\s+/g, '-').toLowerCase()}-${index}`;
  }
  
  // If title is a string
  if (typeof item.title === 'string') {
    return `nav-${item.title.replace(/\s+/g, '-').toLowerCase()}-${index}`;
  }
  
  // Fallback to index
  return `nav-item-${index}`;
};

function NavSectionVertical({ data, collapsed, slotProps, ...other }) {
  return (
    <Stack 
      component="nav" 
      id="nav-section-vertical" 
      spacing={collapsed ? 0.5 : 0.75} 
      sx={{
        transition: (theme) => theme.transitions.create(['gap'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
      }}
      {...other}
    >
      {data.map((group, index) => (
        <Group
          key={group.subheader || index}
          subheader={group.subheader}
          items={group.items}
          collapsed={collapsed}
          slotProps={slotProps}
          whoCanSee={group?.roles}
        />
      ))}
    </Stack>
  );
}

NavSectionVertical.propTypes = {
  data: PropTypes.array,
  collapsed: PropTypes.bool,
  slotProps: PropTypes.object,
};

export default memo(NavSectionVertical);

// ----------------------------------------------------------------------

function Group({ subheader, items, collapsed, slotProps, whoCanSee }) {
  const [open, setOpen] = useState(true);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const renderContent = items?.map((list, index) => (
    <NavList 
      key={getNavItemKey(list, index)} 
      data={list} 
      depth={1} 
      collapsed={collapsed}
      slotProps={slotProps} 
    />
  ));

  if (collapsed) {
    // In collapsed mode, render items without subheader and grouping
    return (
      <Stack spacing={0.5} sx={{ px: 0.5 }}>
        {renderContent}
        {items?.length > 0 && (
          <Divider
            sx={{
              mx: 0.5,
              my: 0.5,
              borderColor: 'divider',
            }}
          />
        )}
      </Stack>
    );
  }

  return (
    <Stack>
      {subheader ? (
        <>
          <ListSubheader
            disableGutters
            disableSticky
            onClick={handleToggle}
            sx={{
              fontSize: 11,
              cursor: 'pointer',
              typography: 'overline',
              display: 'inline-flex',
              color: 'text.disabled',
              px: 2,
              py: 0.75,
              mb: 0.5,
              transition: (theme) =>
                theme.transitions.create(['color'], {
                  duration: theme.transitions.duration.shortest,
                }),
              '&:hover': {
                color: 'text.primary',
              },
              ...slotProps?.subheader,
            }}
          >
            {subheader}
          </ListSubheader>

          <Collapse in={open}>
            <Stack spacing={0.25} sx={{ px: 2 }}>
              {renderContent}
            </Stack>
          </Collapse>
        </>
      ) : (
        <Stack spacing={0.25} sx={{ px: 2 }}>
          {renderContent}
        </Stack>
      )}
      
      {items?.length > 0 && (
        <Divider
          sx={{
            mx: 2,
            my: 1,
            borderColor: 'divider',
          }}
        />
      )}
    </Stack>
  );
}

Group.propTypes = {
  items: PropTypes.array,
  subheader: PropTypes.string,
  collapsed: PropTypes.bool,
  slotProps: PropTypes.object,
  whoCanSee: PropTypes.array,
};
