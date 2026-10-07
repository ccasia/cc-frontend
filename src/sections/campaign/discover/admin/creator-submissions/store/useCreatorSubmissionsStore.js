import { create } from 'zustand';

const initialState = {
  search: '',
  statusFilter: 'all',
  typeFilter: 'all',
  selectedByCreator: {},
  expandedByCreator: {},
};

export const useCreatorSubmissionsStore = create(() => initialState);

export const setSearch = (search) => useCreatorSubmissionsStore.setState(() => ({ search }));

export const setStatusFilter = (statusFilter) =>
  useCreatorSubmissionsStore.setState(() => ({ statusFilter }));

export const setTypeFilter = (typeFilter) =>
  useCreatorSubmissionsStore.setState(() => ({ typeFilter }));

export const selectSubmission = (creatorId, submissionId) =>
  useCreatorSubmissionsStore.setState((state) => ({
    selectedByCreator: { ...state.selectedByCreator, [creatorId]: submissionId },
  }));

export const setExpanded = (creatorId, expanded) =>
  useCreatorSubmissionsStore.setState((state) => ({
    expandedByCreator: { ...state.expandedByCreator, [creatorId]: expanded },
  }));

export const resetCreatorSubmissions = () => useCreatorSubmissionsStore.setState(initialState);
