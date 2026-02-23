// ─── Discovery Tool Filter Constants ──────────────────────────────────────────

export const AGE_RANGES = [
  { value: '18-24', label: '18–24' },
  { value: '25-34', label: '25–34' },
  { value: '35-44', label: '35–44' },
  { value: '45-54', label: '45–54' },
];

export const GENDERS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-Binary', label: 'Non-Binary' },
];

export const CREDIT_TIERS = [
  { value: 'Nano A', label: 'Nano A (0K – 5K)' },
  { value: 'Nano B', label: 'Nano B (5K – 15K)' },
  { value: 'Micro A', label: 'Micro A (15K – 30K)' },
  { value: 'Micro B', label: 'Micro B (30K – 50K)' },
  { value: 'Micro C', label: 'Micro C (50K – 100K)' },
  { value: 'Macro', label: 'Macro (100K – 500K)' },
];

export const PLATFORMS = [
  { value: 'all', label: 'All Platforms' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
];

// ─── Filter initial state & reducer ──────────────────────────────────────────

export const FILTER_INITIAL_STATE = {
  platform: 'all',
  keyword: '',
  debouncedKeyword: '',
  ageRange: '',
  country: null,
  city: null,
  gender: '',
  creditTier: '',
  interests: [],
};

export const filterReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PLATFORM':
      return { ...state, platform: action.payload };
    case 'SET_KEYWORD':
      return { ...state, keyword: action.payload };
    case 'SET_DEBOUNCED_KEYWORD':
      return { ...state, debouncedKeyword: action.payload };
    case 'SET_AGE_RANGE':
      return { ...state, ageRange: action.payload };
    case 'SET_COUNTRY':
      return { ...state, country: action.payload, city: null };
    case 'SET_CITY':
      return { ...state, city: action.payload };
    case 'SET_GENDER':
      return { ...state, gender: action.payload };
    case 'SET_CREDIT_TIER':
      return { ...state, creditTier: action.payload };
    case 'SET_INTERESTS':
      return { ...state, interests: action.payload };
    case 'CLEAR_ALL':
      return { ...FILTER_INITIAL_STATE };
    default:
      return state;
  }
};

// ─── Shared select styles ─────────────────────────────────────────────────────

export const selectSx = {
  minWidth: 160,
  '& .MuiInputBase-input': {
    py: 1,
    px: 1.5,
    fontSize: 14,
  },
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
};
