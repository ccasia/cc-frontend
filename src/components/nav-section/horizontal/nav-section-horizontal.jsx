import { memo } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';

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

function NavSectionHorizontal({ data, slotProps, sx, ...other }) {
  return (
    <Stack
      component="nav"
      id="nav-section-horizontal"
      direction="row"
      alignItems="center"
      spacing={`${slotProps?.gap || 6}px`}
      sx={{
        mx: 'auto',
        ...sx,
      }}
      {...other}
    >
      {data.map((group, index) => (
        <Group
          key={group.subheader || index}
          subheader={group.subheader}
          items={group.items}
          slotProps={slotProps}
        />
      ))}
    </Stack>
  );
}

NavSectionHorizontal.propTypes = {
  data: PropTypes.array,
  sx: PropTypes.object,
  slotProps: PropTypes.object,
};

export default memo(NavSectionHorizontal);

// ----------------------------------------------------------------------

function Group({ items, slotProps }) {
  return (
    <>
      {items.map((list, index) => (
        <NavList key={getNavItemKey(list, index)} data={list} depth={1} slotProps={slotProps} />
      ))}
    </>
  );
}

Group.propTypes = {
  items: PropTypes.array,
  slotProps: PropTypes.object,
};
