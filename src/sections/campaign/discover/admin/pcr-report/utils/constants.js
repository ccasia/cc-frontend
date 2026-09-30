// Shared defaults for the PCR report editor.
//
// These live outside pcr-report-page.jsx so the load path (usePcrData) can merge
// a saved or drafted payload on top of them. Without a merge, a record written
// before a field existed leaves that key `undefined`, and reads such as
// `editableContent.positiveComments.map(...)` throw.

export const PCR_DRAFT_STORAGE_PREFIX = 'pcr-draft-';
export const PCR_EDITOR_SESSION_STORAGE_PREFIX = 'pcr-editor-session-';

export const DEFAULT_SECTION_ORDER = [
  'engagement',
  'platformBreakdown',
  'views',
  'audienceSentiment',
  'creatorTiers',
  'strategies',
  'recommendations',
];

export const DEFAULT_SECTION_VISIBILITY = {
  engagement: true,
  platformBreakdown: true,
  views: true,
  audienceSentiment: true,
  creatorTiers: true,
  strategies: true,
  recommendations: true,
};

export const DEFAULT_EDITABLE_CONTENT = {
  campaignDescription: '',
  engagementDescription: '',
  platformBreakdownDescription: '',
  viewsDescription: '',
  audienceSentimentDescription: '',
  noteworthyCreatorsDescription: '',
  bestPerformingPersonasDescription: '',
  positiveComments: [],
  neutralComments: [],
  comicTitle: '',
  comicEmoji: '',
  comicContentStyle: '',
  comicWhyWork: '',
  educatorTitle: '',
  educatorEmoji: '',
  educatorContentStyle: '',
  educatorWhyWork: '',
  creatorStrategyCount: '',
  educatorCreatorCount: '',
  thirdTitle: '',
  thirdEmoji: '',
  thirdContentStyle: '',
  thirdWhyWork: '',
  thirdCreatorCount: '',
  fourthTitle: '',
  fourthEmoji: '',
  fourthContentStyle: '',
  fourthWhyWork: '',
  fourthCreatorCount: '',
  fifthTitle: '',
  fifthEmoji: '',
  fifthContentStyle: '',
  fifthWhyWork: '',
  fifthCreatorCount: '',
  personaCards: [],
  improvedInsights: [],
  workedWellInsights: [],
  nextStepsInsights: [],
  creatorTiersDescription: '',
};
