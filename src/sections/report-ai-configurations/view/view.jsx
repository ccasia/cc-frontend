import useSWR from 'swr';
import PropTypes from 'prop-types';
import { toast, Toaster } from 'sonner';
import React, { useState, useEffect, useCallback } from 'react';

import {
  Box,
  Chip,
  List,
  Stack,
  Paper,
  Alert,
  Slider,
  Button,
  Drawer,
  Divider,
  Tooltip,
  TextField,
  Accordion,
  InputBase,
  Typography,
  IconButton,
  ListItemText,
  ListItemIcon,
  InputAdornment,
  ListItemButton,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';

import axiosInstance, { fetcher } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import Markdown from 'src/components/markdown';

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMAT_RULE =
  'Write in 3–5 concise sentences using markdown bold for key metrics. No bullet points. No headers. Output only the paragraph.';

const DEFAULT_SECTION_PROMPTS = {
  campaign_summary: `You are an influencer marketing analyst writing a campaign summary for a post-campaign report.
${FORMAT_RULE}

Cover: total views, total engagements, engagement rate vs benchmark (3% is industry standard), ROAS if available, total posts published, credits utilised vs allocated (utilisation rate), and overall verdict.
Example style: "The campaign reached **180K users**, generating **19K engagements** at an engagement rate of **3.2%**, which is above industry benchmarks. With a ROAS of **4.36%**, the campaign met performance expectations."`,

  engagement_interactions: `You are an influencer marketing analyst writing the Engagement & Interactions section of a post-campaign report.
${FORMAT_RULE}

Cover: total engagement, when engagement peaked and what drove it, the posting window, platform breakdown (TikTok vs Instagram posts and engagement), and name the top 3 creators by engagement rate with their rates.`,

  views_analysis: `You are an influencer marketing analyst writing the Views Analysis section of a post-campaign report.
${FORMAT_RULE}

Cover: total cumulative views, the peak week and its view count, lowest week, the overall view range, and the growth trend. Explain what likely drove the peak (e.g. multiple creators posting, trending content).`,

  audience_sentiment: `You are an influencer marketing analyst writing the Audience Sentiment section.
${FORMAT_RULE}

Cover: the positive/neutral/negative percentage split, what it indicates about audience reception, the most common negative feedback themes, and whether sentiment reflects strong content-audience alignment.`,

  top_creator_personas: `You are an influencer marketing analyst writing the Top Performing Creator Personas section.
${FORMAT_RULE}

Name the top 2–3 creators explicitly with their key stats (engagement rate, followers, views, approved content count). Describe what made each effective — their niche, content style, or audience fit. End with what creator profile to prioritise in future campaigns.`,

  campaign_recommendations: `You are an influencer marketing analyst writing the Campaign Recommendations section.
${FORMAT_RULE}

Based on the full campaign data, give exactly 3 specific, data-backed recommendations for the next campaign. Each must reference actual figures from the data (e.g. "Given the **3.2% engagement rate** in Week 3..."). Focus areas: creator selection, posting timing, content format, or budget allocation. No generic advice.`,
};

const SECTION_META = {
  campaign_summary: {
    label: 'Campaign Summary',
    icon: 'mdi:chart-box-outline',
    description: 'Overall performance verdict — views, engagements, ROAS & utilisation rate.',
    color: '#2735F5',
  },
  engagement_interactions: {
    label: 'Engagement & Interactions',
    icon: 'mdi:heart-pulse',
    description: 'Engagement peaks, posting window, platform split & top creators by ER.',
    color: '#E91E63',
  },
  views_analysis: {
    label: 'Views Analysis',
    icon: 'mdi:eye-outline',
    description: 'Cumulative views, peak/low weeks & growth trend analysis.',
    color: '#00897B',
  },
  audience_sentiment: {
    label: 'Audience Sentiment',
    icon: 'mdi:emoticon-outline',
    description: 'Positive/neutral/negative split, feedback themes & content-audience fit.',
    color: '#FF6F00',
  },
  top_creator_personas: {
    label: 'Top Creator Personas',
    icon: 'mdi:account-star-outline',
    description: 'Top 2–3 creators with stats, niche fit & future casting direction.',
    color: '#7B1FA2',
  },
  campaign_recommendations: {
    label: 'Campaign Recommendations',
    icon: 'mdi:lightbulb-on-outline',
    description: '3 data-backed recommendations for the next campaign.',
    color: '#1565C0',
  },
};

const SECTIONS = Object.keys(DEFAULT_SECTION_PROMPTS);

// ─── Mock API ─────────────────────────────────────────────────────────────────
// Replace this with your real endpoint. Expected shape:
// GET /api/campaigns → { data: [{ id, name, brand, status, data: { ...campaignMetrics } }] }

const fetchCampaigns = async () => {
  // TODO: replace with your real API call, e.g:
  // const res = await fetch('/api/campaigns');
  // return res.json();
  await new Promise((r) => setTimeout(r, 800));
  const res = await axiosInstance.get('/api/ai/campaigns');
  return res.data;

  return {
    data: [
      {
        id: '1',
        name: 'Summer Glow 2024',
        brand: 'Lumière Beauty',
        status: 'completed',
        data: {
          total_views: 180000,
          total_engagements: 19000,
          engagement_rate: 3.2,
          roas: 4.36,
          total_posts: 24,
          credits_utilised: 48,
          credits_allocated: 50,
          platforms: {
            tiktok: { posts: 14, engagements: 12000 },
            instagram: { posts: 10, engagements: 7000 },
          },
          top_creators: [
            { name: '@glowwithsara', engagement_rate: 6.1, followers: 82000 },
            { name: '@beautybykim', engagement_rate: 5.4, followers: 120000 },
            { name: '@lumiere.lovers', engagement_rate: 4.8, followers: 54000 },
          ],
          sentiment: { positive: 78, neutral: 14, negative: 8 },
          weekly_views: [22000, 31000, 48000, 45000, 34000],
        },
      },
      {
        id: '2',
        name: 'Fit Life Q1',
        brand: 'CorePulse',
        status: 'completed',
        data: {
          total_views: 95000,
          total_engagements: 8200,
          engagement_rate: 2.7,
          roas: 2.1,
          total_posts: 18,
          credits_utilised: 30,
          credits_allocated: 40,
          platforms: {
            tiktok: { posts: 10, engagements: 5500 },
            instagram: { posts: 8, engagements: 2700 },
          },
          top_creators: [
            { name: '@fitwithjay', engagement_rate: 4.2, followers: 200000 },
            { name: '@corewithmel', engagement_rate: 3.9, followers: 88000 },
          ],
          sentiment: { positive: 65, neutral: 22, negative: 13 },
          weekly_views: [14000, 18000, 22000, 25000, 16000],
        },
      },
      {
        id: '3',
        name: 'Holiday Spark',
        brand: 'Sparkle & Co.',
        status: 'completed',
        data: {
          total_views: 320000,
          total_engagements: 41000,
          engagement_rate: 4.1,
          roas: 6.8,
          total_posts: 36,
          credits_utilised: 60,
          credits_allocated: 60,
          platforms: {
            tiktok: { posts: 22, engagements: 29000 },
            instagram: { posts: 14, engagements: 12000 },
          },
          top_creators: [
            { name: '@sparklejess', engagement_rate: 7.2, followers: 310000 },
            { name: '@glitternights', engagement_rate: 6.5, followers: 145000 },
            { name: '@festivelooks', engagement_rate: 5.9, followers: 98000 },
          ],
          sentiment: { positive: 88, neutral: 9, negative: 3 },
          weekly_views: [40000, 62000, 95000, 88000, 35000],
        },
      },
    ],
  };
};

const runPromptAgainstCampaign = async (apiKey, prompt, campaignData) => {
  const userMessage = `Here is the campaign data:\n\n${JSON.stringify(campaignData, null, 2)}\n\nNow write the report section based on your instructions.`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${
      apiKey
    }`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: prompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || 'Gemini API error');
  }

  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

// ─── Test Drawer ──────────────────────────────────────────────────────────────

const TestPromptDrawer = ({ open, onClose, section, prompt, apiKey }) => {
  const meta = SECTION_META[section] || {};

  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadCampaigns = useCallback(async () => {
    if (campaigns.length) return;
    setLoadingCampaigns(true);
    try {
      const data = await fetchCampaigns();
      setCampaigns(data || []);
    } catch {
      setError('Failed to load campaigns.');
    } finally {
      setLoadingCampaigns(false);
    }
  }, [campaigns.length]);

  React.useEffect(() => {
    if (open) {
      setResult('');
      setError('');
      setSelectedCampaign(null);
      setCampaignSearch('');
      loadCampaigns();
    }
  }, [open]);

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
      c?.brand?.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
      c?.company?.name.toLowerCase().includes(campaignSearch.toLowerCase())
  );

  const handleRun = async () => {
    if (!selectedCampaign) return;
    setRunning(true);
    setResult('');
    setError('');
    try {
      const res = await axiosInstance.post(`/api/reports/generate/${selectedCampaign.id}`, {
        sections: [section],
      });

      const summary = res.data.report.sections[0]?.summary || '';

      // const output = await runPromptAgainstCampaign(apiKey, prompt, selectedCampaign.data);
      setResult(summary);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 480 }, p: 0, display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: '8px',
                bgcolor: `${meta.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Iconify icon={meta.icon || 'mdi:test-tube'} width={16} color={meta.color} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Test Prompt
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {meta.label}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onClose}>
            <Iconify icon="mdi:close" width={20} />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2.5 }}>
        <Stack spacing={3}>
          {/* Step 1 — Pick Campaign */}
          <Box>
            <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: '#2735F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>1</Typography>
              </Box>
              <Typography variant="subtitle2" fontWeight={700}>
                Select a Campaign
              </Typography>
            </Stack>

            {/* Search */}
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1.5,
                px: 1.5,
                py: 0.8,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1,
              }}
            >
              <Iconify icon="mdi:magnify" width={18} color="text.disabled" />
              <InputBase
                fullWidth
                placeholder="Search campaigns..."
                value={campaignSearch}
                onChange={(e) => setCampaignSearch(e.target.value)}
                sx={{ fontSize: 14 }}
              />
            </Box>

            {loadingCampaigns ? (
              <Stack alignItems="center" py={3}>
                <CircularProgress size={24} sx={{ color: '#2735F5' }} />
                <Typography variant="caption" color="text.secondary" mt={1}>
                  Loading campaigns...
                </Typography>
              </Stack>
            ) : (
              <List
                disablePadding
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {filteredCampaigns.length === 0 ? (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.disabled">
                      No campaigns found
                    </Typography>
                  </Box>
                ) : (
                  filteredCampaigns.map((campaign, idx) => (
                    <React.Fragment key={campaign.id}>
                      {idx > 0 && <Divider />}
                      <ListItemButton
                        selected={selectedCampaign?.id === campaign.id}
                        onClick={() => {
                          setSelectedCampaign(campaign);
                          setResult('');
                          setError('');
                        }}
                        sx={{
                          py: 1.2,
                          '&.Mui-selected': { bgcolor: '#EEF0FF' },
                          '&.Mui-selected:hover': { bgcolor: '#E4E6FF' },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Iconify
                            icon={
                              selectedCampaign?.id === campaign.id
                                ? 'mdi:check-circle'
                                : 'mdi:circle-outline'
                            }
                            color={
                              selectedCampaign?.id === campaign.id ? '#2735F5' : 'text.disabled'
                            }
                            width={20}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle2" fontWeight={600}>
                              {campaign.name}
                            </Typography>
                          }
                          secondary={
                            <Stack direction="row" alignItems="center" gap={0.8} mt={0.2}>
                              <Typography variant="caption" color="text.secondary">
                                {campaign?.brand?.name || campaign?.company?.name}
                              </Typography>
                              <Box
                                sx={{
                                  width: 3,
                                  height: 3,
                                  borderRadius: '50%',
                                  bgcolor: 'text.disabled',
                                }}
                              />
                              <Chip
                                label={campaign.status}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  bgcolor: '#E8F5E9',
                                  color: '#2E7D32',
                                }}
                              />
                            </Stack>
                          }
                        />
                      </ListItemButton>
                    </React.Fragment>
                  ))
                )}
              </List>
            )}
          </Box>

          {/* Step 2 — Selected Campaign Data Preview */}
          {/* {selectedCampaign && (
            <Box>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#2735F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>2</Typography>
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Campaign Data Preview
                </Typography>
              </Stack>

              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#FAFAFA' }}>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {[
                    { label: 'Views', value: selectedCampaign.data.total_views?.toLocaleString() },
                    {
                      label: 'Engagements',
                      value: selectedCampaign.data.total_engagements?.toLocaleString(),
                    },
                    { label: 'ER', value: `${selectedCampaign.data.engagement_rate}%` },
                    {
                      label: 'ROAS',
                      value: selectedCampaign.data.roas ? `${selectedCampaign.data.roas}x` : 'N/A',
                    },
                    { label: 'Posts', value: selectedCampaign.data.total_posts },
                    {
                      label: 'Sentiment +',
                      value: `${selectedCampaign.data.sentiment?.positive}%`,
                    },
                  ].map((stat) => (
                    <Box
                      key={stat.label}
                      sx={{
                        px: 1.5,
                        py: 0.8,
                        bgcolor: '#fff',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        minWidth: 80,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" display="block">
                        {stat.label}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {stat.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          )} */}

          {/* Step 3 — Run */}
          {selectedCampaign && (
            <Box>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#2735F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>3</Typography>
                </Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Run & Review Output
                </Typography>
              </Stack>

              <Button
                fullWidth
                variant="contained"
                onClick={handleRun}
                disabled={running || !apiKey}
                startIcon={
                  running ? (
                    <CircularProgress size={16} sx={{ color: '#fff' }} />
                  ) : (
                    <Iconify icon="mdi:play-circle-outline" width={20} />
                  )
                }
                sx={{
                  background: 'linear-gradient(to right, #2735F5, #636DF8)',
                  fontWeight: 700,
                  py: 1.2,
                  '&:hover': { background: 'linear-gradient(to right, #1e28d4, #4f58e0)' },
                  '&.Mui-disabled': { opacity: 0.6, color: '#fff' },
                }}
              >
                {running ? 'Generating...' : 'Run Prompt'}
              </Button>

              {!apiKey && (
                <Typography
                  variant="caption"
                  color="error"
                  display="block"
                  mt={0.5}
                  textAlign="center"
                >
                  Add an API key in the configuration above first.
                </Typography>
              )}
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert severity="error" icon={<Iconify icon="mdi:alert-circle-outline" width={18} />}>
              {error}
            </Alert>
          )}

          {/* Output */}
          {result && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Stack direction="row" alignItems="center" gap={0.8}>
                  <Iconify icon="logos:google-gemini" width={16} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    AI Output
                  </Typography>
                </Stack>
                <Tooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                  <IconButton size="small" onClick={handleCopy}>
                    <Iconify
                      icon={copied ? 'mdi:check' : 'mdi:content-copy'}
                      width={16}
                      color={copied ? '#2E7D32' : 'text.secondary'}
                    />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#F6F7FF',
                  borderColor: '#C7CBFC',
                  lineHeight: 1.8,
                }}
              >
                <Markdown>{result}</Markdown>
                {/* <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {result}
                </Typography> */}
              </Paper>
            </Box>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
};

TestPromptDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  section: PropTypes.any,
  prompt: PropTypes.string,
  apiKey: PropTypes.string,
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ReportAiConfigurations = () => {
  const { data, mutate } = useSWR('/api/ai', fetcher);

  const [config, setConfig] = useState({
    apiKey: '',
    temperature: 0.7,
    maxTokens: 1024,
    sectionPrompts: { ...DEFAULT_SECTION_PROMPTS },
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedSection, setExpandedSection] = useState(false);
  const [testDrawer, setTestDrawer] = useState({ open: false, section: null });

  const handleGlobalChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handlePromptChange = (section, value) => {
    setConfig((prev) => ({
      ...prev,
      sectionPrompts: { ...prev.sectionPrompts, [section]: value },
    }));
    setSaved(false);
  };

  const handleResetSection = (section) => {
    setConfig((prev) => ({
      ...prev,
      sectionPrompts: { ...prev.sectionPrompts, [section]: DEFAULT_SECTION_PROMPTS[section] },
    }));
    setSaved(false);
  };

  const handleResetAll = () => {
    setConfig({
      apiKey: '',
      temperature: 0.7,
      maxTokens: 1024,
      sectionPrompts: { ...DEFAULT_SECTION_PROMPTS },
    });
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const res = await axiosInstance.patch('/api/ai/configure', config);
      toast.success(res.data.message);
      setSaved(true);
      mutate();
    } catch (error) {
      toast.error(error?.message || 'Error saving');
    }
  };

  const isPromptModified = (section) =>
    config.sectionPrompts[section] !== DEFAULT_SECTION_PROMPTS[section];

  const modifiedCount = SECTIONS.filter(isPromptModified).length;

  const openTest = (e, section) => {
    e.stopPropagation();
    setTestDrawer({ open: true, section });
  };

  useEffect(() => {
    if (data) {
      setConfig((prev) => ({
        ...prev,
        apiKey: data.apiKey,
        temperature: data.temperature,
        maxTokens: data.maxOutputTokens,
        sectionPrompts: data.systemPrompt,
      }));
    }
  }, [data]);

  return (
    <Box sx={{ p: 2, px: 4, maxWidth: 800, mx: 'auto', width: 1 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" gap={1.3} mb={3} justifyContent="center">
        {/* {rotate} */}
        <Iconify icon="mage:robot" width={40} color="#2735F5" />

        <Typography
          variant="h4"
          sx={{
            background: 'linear-gradient(to right, #2735F5, #636DF8)',
            backgroundClip: 'text',
            color: 'transparent',
            fontWeight: '900',
            lineHeight: 1.2,
          }}
        >
          Report AI <br /> Configurations
        </Typography>
      </Stack>

      <Stack spacing={3}>
        {/* Provider */}
        <Stack direction="row" alignItems="center" gap={1}>
          <Iconify icon="logos:google-gemini" width={22} />
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Google Gemini
          </Typography>
          <Chip label="Active Provider" size="small" color="primary" variant="outlined" />
        </Stack>

        <Divider />

        {/* API Key */}
        <Box>
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>
            API Key
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Your Google AI Studio API key. Keep this secret.
          </Typography>
          <TextField
            fullWidth
            placeholder="AIzaSy..."
            type={showApiKey ? 'text' : 'password'}
            value={config.apiKey}
            onChange={(e) => handleGlobalChange('apiKey', e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="mdi:key-outline" width={18} color="text.secondary" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setShowApiKey((v) => !v)}>
                    <Iconify
                      icon={showApiKey ? 'mdi:eye-off-outline' : 'mdi:eye-outline'}
                      width={18}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Temperature */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="subtitle2" fontWeight={700}>
              Temperature
            </Typography>
            <Chip
              label={config.temperature.toFixed(1)}
              size="small"
              sx={{ fontWeight: 700, bgcolor: '#EEF0FF', color: '#2735F5' }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Controls randomness. Lower = focused & deterministic. Higher = creative & varied.
          </Typography>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="caption" color="text.disabled">
              0.0
            </Typography>
            <Slider
              value={config.temperature}
              min={0}
              max={2}
              step={0.1}
              onChange={(_, val) => handleGlobalChange('temperature', val)}
              sx={{ color: '#2735F5', '& .MuiSlider-thumb': { width: 16, height: 16 } }}
            />
            <Typography variant="caption" color="text.disabled">
              2.0
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.disabled">
              Precise
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Balanced
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Creative
            </Typography>
          </Stack>
        </Box>

        {/* Max Tokens */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="subtitle2" fontWeight={700}>
              Max Output Tokens
            </Typography>
            <Chip
              label={`${config.maxTokens.toLocaleString()} tokens`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: '#EEF0FF', color: '#2735F5' }}
            />
          </Stack>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Maximum number of tokens in the model&apos;s response per section.
          </Typography>
          <Stack direction="row" alignItems="center" gap={2}>
            <Typography variant="caption" color="text.disabled">
              256
            </Typography>
            <Slider
              value={config.maxTokens}
              min={256}
              max={8192}
              step={256}
              onChange={(_, val) => handleGlobalChange('maxTokens', val)}
              sx={{ color: '#2735F5', '& .MuiSlider-thumb': { width: 16, height: 16 } }}
            />
            <Typography variant="caption" color="text.disabled">
              8192
            </Typography>
          </Stack>
        </Box>

        <Divider />

        {/* Section Prompts */}
        <Box>
          <Stack direction="row" alignItems="center" gap={1} mb={0.3}>
            <Typography variant="subtitle1" fontWeight={700}>
              Section Prompts
            </Typography>
            {modifiedCount > 0 && (
              <Chip
                label={`${modifiedCount} modified`}
                size="small"
                sx={{ bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700, fontSize: 11 }}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Customise the AI instructions for each report section independently.
          </Typography>

          <Stack spacing={1} mt={1.5}>
            {SECTIONS.map((section) => {
              const meta = SECTION_META[section];
              const modified = isPromptModified(section);
              const charCount = config.sectionPrompts[section].length;
              const isExpanded = expandedSection === section;

              return (
                <Accordion
                  key={section}
                  expanded={isExpanded}
                  onChange={(_, isExp) => setExpandedSection(isExp ? section : false)}
                  disableGutters
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: isExpanded ? meta.color : 'divider',
                    borderRadius: '10px !important',
                    '&:before': { display: 'none' },
                    transition: 'border-color 0.2s',
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<Iconify icon="mdi:chevron-down" width={20} />}
                    sx={{
                      px: 2,
                      py: 0.5,
                      bgcolor: isExpanded ? `${meta.color}08` : 'transparent',
                      minHeight: 52,
                      '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
                    }}
                  >
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        bgcolor: `${meta.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Iconify icon={meta.icon} width={18} color={meta.color} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" gap={0.8}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {meta.label}
                        </Typography>
                        {modified && (
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              bgcolor: '#FF6F00',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {meta.description}
                      </Typography>
                    </Box>

                    {/* Test button — visible on hover or when expanded */}
                    <Tooltip title="Test this prompt against a campaign">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => openTest(e, section)}
                        startIcon={<Iconify icon="mdi:play-circle-outline" width={15} />}
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          px: 1.2,
                          py: 0.4,
                          minWidth: 0,
                          borderColor: meta.color,
                          color: meta.color,
                          flexShrink: 0,
                          mr: 0.5,
                          '&:hover': { bgcolor: `${meta.color}10` },
                        }}
                      >
                        Test
                      </Button>
                    </Tooltip>
                  </AccordionSummary>

                  <AccordionDetails sx={{ px: 2, pb: 2, pt: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={8}
                      value={config.sectionPrompts[section]}
                      onChange={(e) => handlePromptChange(section, e.target.value)}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          fontFamily: 'monospace',
                          fontSize: 12,
                          lineHeight: 1.6,
                        },
                      }}
                    />
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mt={1}
                    >
                      <Typography variant="caption" color="text.disabled">
                        {charCount.toLocaleString()} characters
                      </Typography>
                      {modified && (
                        <Tooltip title="Reset to default prompt">
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleResetSection(section)}
                            startIcon={<Iconify icon="mdi:restore" width={15} />}
                            sx={{ color: '#E65100', fontSize: 12, minWidth: 0, px: 1 }}
                          >
                            Reset section
                          </Button>
                        </Tooltip>
                      )}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        </Box>

        <Divider />

        {saved && (
          <Paper
            variant="outlined"
            sx={{ p: 1.5, bgcolor: '#F6F7FF', borderColor: '#C7CBFC', borderRadius: 2 }}
          >
            <Stack direction="row" alignItems="center" gap={1}>
              <Iconify icon="mdi:check-circle" color="#2735F5" width={18} />
              <Typography variant="caption" fontWeight={700} color="#2735F5">
                Configuration saved — {SECTIONS.length} section prompts + global settings stored in
                state.
              </Typography>
            </Stack>
          </Paper>
        )}

        <Stack direction="row" gap={1.5}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!config.apiKey}
            startIcon={<Iconify icon="mdi:content-save-outline" width={18} />}
            sx={{
              background: 'linear-gradient(to right, #2735F5, #636DF8)',
              fontWeight: 700,
              px: 3,
              '&:hover': { background: 'linear-gradient(to right, #1e28d4, #4f58e0)' },
            }}
          >
            Save Configuration
          </Button>
          <Button
            variant="outlined"
            onClick={handleResetAll}
            startIcon={<Iconify icon="mdi:refresh" width={18} />}
            sx={{ borderColor: '#C7CBFC', color: '#2735F5', fontWeight: 700 }}
          >
            Reset All
          </Button>
        </Stack>
      </Stack>

      {/* Test Drawer */}
      <TestPromptDrawer
        open={testDrawer.open}
        onClose={() => setTestDrawer({ open: false, section: null })}
        section={testDrawer.section}
        prompt={testDrawer.section ? config.sectionPrompts[testDrawer.section] : ''}
        apiKey={config.apiKey}
      />

      <Toaster />
    </Box>
  );
};

export default ReportAiConfigurations;
