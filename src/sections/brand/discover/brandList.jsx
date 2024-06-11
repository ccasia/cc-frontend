import PropTypes from 'prop-types';
import { enqueueSnackbar } from 'notistack';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import axiosInstance, { endpoints } from 'src/utils/axios';

import BrandItem from './brandItem';

// ----------------------------------------------------------------------

export default function BrandList({ companies }) {
  const router = useRouter();
  const [filterData, setFilterData] = useState();

  const handleView = useCallback(
    (id) => {
      router.push(paths.dashboard.brand.details(id));
    },
    [router]
  );

  const handleEdit = useCallback(
    (id) => {
      router.push(paths.dashboard.job.edit(id));
    },
    [router]
  );

  const handleDelete = useCallback(async (id) => {
    try {
      const res = await axiosInstance.delete(`${endpoints.company.delete}/${id}`);
      enqueueSnackbar(res?.data?.message, {
        variant: 'success',
      });
      setFilterData((prev) => prev.filter((elem) => elem.id !== id));
    } catch (error) {
      enqueueSnackbar('Failed to delete', {
        variant: 'error',
      });
    }
  }, []);

  useEffect(() => {
    setFilterData([...companies]);
  }, [companies]);

  return (
    <>
      {JSON.stringify(companies)}
      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
        }}
      >
        {filterData?.map((company) => (
          <BrandItem
            key={company.id}
            company={company}
            onView={() => handleView(company.id)}
            onEdit={() => handleEdit(company.id)}
            onDelete={() => handleDelete(company.id)}
          />
        ))}
      </Box>
      {/* {jobs.length > 8 && (
        <Pagination
          count={8}
          sx={{
            mt: 8,
            [`& .${paginationClasses.ul}`]: {
              justifyContent: 'center',
            },
          }}
        />
      )} */}
    </>
  );
}

BrandList.propTypes = {
  companies: PropTypes.array,
};
