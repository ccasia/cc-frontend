import { create } from 'zustand';

export const useCreatorSubmissionsStore = create(() => ({
  search: '',
  statusFilter: 'all',
  typeFilter: 'all',
}));

export const setSearch = (search) => useCreatorSubmissionsStore.setState(() => ({ search }));

export const setStatusFilter = (statusFilter) =>
  useCreatorSubmissionsStore.setState(() => ({ statusFilter }));

export const setTypeFilter = (typeFilter) =>
  useCreatorSubmissionsStore.setState(() => ({ typeFilter }));
