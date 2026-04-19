import PropTypes from 'prop-types';
import { m, AnimatePresence } from 'framer-motion';
import { Geography, Geographies, ComposableMap } from 'react-simple-maps';
import { memo, useRef, useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';

import { alpha } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined';
import { Box, Stack, Paper, MenuItem, TextField, Typography } from '@mui/material';

import useGetCreatorGrowth from 'src/hooks/use-get-creator-growth';
import useGetCreatorsByCountry from 'src/hooks/use-get-creators-by-country';

import { countries as countryList } from 'src/assets/data/countries';

import Iconify from 'src/components/iconify';

import ChartCard from '../components/chart-card';
import { useDateFilter } from '../date-filter-context';
import CreatorDrilldownDrawer from './creator-drilldown-drawer';

// Country name → ISO code lookup

const countryCodeMap = new Map(
  countryList.filter((c) => c.code).map((c) => [c.label.toLowerCase(), c.code.toLowerCase()])
);
const getCountryCode = (name) => countryCodeMap.get(name.toLowerCase()) || '';

// ISO alpha-2 → numeric (for TopoJSON geo.id matching)

const ALPHA2_TO_NUMERIC = {
  af:'004',al:'008',dz:'012',as:'016',ad:'020',ao:'024',ag:'028',ar:'032',am:'051',au:'036',
  at:'040',az:'031',bs:'044',bh:'048',bd:'050',bb:'052',by:'112',be:'056',bz:'084',bj:'204',
  bt:'064',bo:'068',ba:'070',bw:'072',br:'076',bn:'096',bg:'100',bf:'854',bi:'108',kh:'116',
  cm:'120',ca:'124',cv:'132',cf:'140',td:'148',cl:'152',cn:'156',co:'170',km:'174',cg:'178',
  cd:'180',cr:'188',ci:'384',hr:'191',cu:'192',cy:'196',cz:'203',dk:'208',dj:'262',dm:'212',
  do:'214',ec:'218',eg:'818',sv:'222',gq:'226',er:'232',ee:'233',et:'231',fj:'242',fi:'246',
  fr:'250',ga:'266',gm:'270',ge:'268',de:'276',gh:'288',gr:'300',gd:'308',gt:'320',gn:'324',
  gw:'624',gy:'328',ht:'332',hn:'340',hu:'348',is:'352',in:'356',id:'360',ir:'364',iq:'368',
  ie:'372',il:'376',it:'380',jm:'388',jp:'392',jo:'400',kz:'398',ke:'404',ki:'296',kp:'408',
  kr:'410',kw:'414',kg:'417',la:'418',lv:'428',lb:'422',ls:'426',lr:'430',ly:'434',li:'438',
  lt:'440',lu:'442',mk:'807',mg:'450',mw:'454',my:'458',mv:'462',ml:'466',mt:'470',mh:'584',
  mr:'478',mu:'480',mx:'484',fm:'583',md:'498',mc:'492',mn:'496',me:'499',ma:'504',mz:'508',
  mm:'104',na:'516',nr:'520',np:'524',nl:'528',nz:'554',ni:'558',ne:'562',ng:'566',no:'578',
  om:'512',pk:'586',pw:'585',pa:'591',pg:'598',py:'600',pe:'604',ph:'608',pl:'616',pt:'620',
  qa:'634',ro:'642',ru:'643',rw:'646',kn:'659',lc:'662',vc:'670',ws:'882',sm:'674',st:'678',
  sa:'682',sn:'686',rs:'688',sc:'690',sl:'694',sg:'702',sk:'703',si:'705',sb:'090',so:'706',
  za:'710',ss:'728',es:'724',lk:'144',sd:'729',sr:'740',sz:'748',se:'752',ch:'756',sy:'760',
  tw:'158',tj:'762',tz:'834',th:'764',tl:'626',tg:'768',to:'776',tt:'780',tn:'788',tr:'792',
  tm:'795',tv:'798',ug:'800',ua:'804',ae:'784',gb:'826',us:'840',uy:'858',uz:'860',vu:'548',
  ve:'862',vn:'704',ye:'887',zm:'894',zw:'716',xk:'983',hk:'344',mo:'446',
};

// Map constants

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const MAP_COLORS = ['#E8F5E9', '#A5D6A7', '#66BB6A', '#43A047', '#2E7D32', '#1B5E20'];

const REGIONS = [
  { label: 'World Map', scale: 120, center: [0, 30] },
  { label: 'South East Asia', scale: 600, center: [115, 5] },
  { label: 'East Asia', scale: 400, center: [115, 35] },
  { label: 'South Asia', scale: 500, center: [78, 22] },
  { label: 'Europe', scale: 500, center: [15, 52] },
  { label: 'North America', scale: 300, center: [-100, 45] },
  { label: 'South America', scale: 300, center: [-60, -15] },
  { label: 'Africa', scale: 300, center: [20, 5] },
  { label: 'Middle East', scale: 500, center: [45, 28] },
  { label: 'Oceania', scale: 400, center: [140, -25] },
];

// Countries per region (ISO alpha-2 codes)
const REGION_COUNTRIES = {
  'South East Asia': new Set(['bn','kh','id','la','my','mm','ph','sg','th','tl','vn']),
  'East Asia': new Set(['cn','jp','kr','kp','mn','tw','hk','mo']),
  'South Asia': new Set(['in','pk','bd','lk','np','bt','mv','af']),
  'Europe': new Set(['al','ad','at','by','be','ba','bg','hr','cy','cz','dk','ee','fi','fr','de','gr','hu','is','ie','it','xk','lv','li','lt','lu','mk','mt','md','mc','me','nl','no','pl','pt','ro','ru','sm','rs','sk','si','es','se','ch','ua','gb']),
  'North America': new Set(['us','ca','mx','gt','bz','hn','sv','ni','cr','pa','cu','jm','ht','do','bs','bb','tt','ag','dm','gd','kn','lc','vc']),
  'South America': new Set(['br','ar','co','pe','ve','cl','ec','bo','py','uy','gy','sr']),
  'Africa': new Set(['dz','ao','bj','bw','bf','bi','cm','cv','cf','td','km','cg','cd','ci','dj','eg','gq','er','et','ga','gm','gh','gn','gw','ke','ls','lr','ly','mg','mw','ml','mr','mu','ma','mz','na','ne','ng','rw','st','sn','sc','sl','so','za','ss','sd','sz','tz','tg','tn','ug','zm','zw']),
  'Middle East': new Set(['ae','bh','iq','ir','il','jo','kw','lb','om','qa','sa','sy','tr','ye']),
  'Oceania': new Set(['au','nz','fj','pg','sb','vu','ws','ki','mh','fm','nr','pw','to','tv']),
};

function buildNumericLookup(countriesData) {
  return countriesData.reduce((map, d) => {
    const alpha2 = getCountryCode(d.label);
    const numeric = alpha2 ? ALPHA2_TO_NUMERIC[alpha2] : null;
    if (numeric) map[numeric] = d;
    return map;
  }, {});
}

function getMapColor(value, maxVal) {
  if (!value || !maxVal) return '#F4F6F8';
  const ratio = value / maxVal;
  const idx = Math.min(Math.floor(ratio * MAP_COLORS.length), MAP_COLORS.length - 1);
  return MAP_COLORS[idx];
}

// Pie chart constants

const PIE_SIZE = 200;

const COUNTRY_LIST_SCROLL_EPS = 4;
// Height of top/bottom gradient hint on the country list
const COUNTRY_LIST_EDGE_FADE_PX = 26;

// Drawer config

function HeroStats({ genderBreakdown, count }) {
  const total = count || 0;
  const items = [
    { label: 'Total', value: total, color: '#1A1A2E' },
    { label: 'Female', value: genderBreakdown?.female || 0, color: '#E45DBF' },
    { label: 'Male', value: genderBreakdown?.male || 0, color: '#1340FF' },
    { label: 'Other', value: genderBreakdown?.nonBinary || 0, color: '#919EAB' },
  ];

  return (
    <Stack
      direction="row"
      spacing={0}
      sx={{ mt: 1.5, mx: 2.5, mb: 2, borderRadius: '10px', border: '1px solid #E8ECEE', overflow: 'hidden' }}
    >
      {items.map((item, idx) => (
        <Box key={item.label} sx={{ display: 'contents' }}>
          {idx > 0 && <Box sx={{ width: '1px', bgcolor: '#E8ECEE', my: 1 }} />}
          <Stack alignItems="center" sx={{ flex: 1, py: 1.5 }}>
            <Typography sx={{ fontSize: '1.375rem', fontWeight: 700, color: item.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {item.value}
            </Typography>
            <Typography sx={{ fontSize: '0.625rem', fontWeight: 600, color: '#919EAB', textTransform: 'uppercase', letterSpacing: '0.05em', mt: 0.5 }}>
              {item.label}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}

HeroStats.propTypes = { genderBreakdown: PropTypes.object, count: PropTypes.number };

const DRAWER_CONFIG = {
  useCreatorsHook: useGetCreatorsByCountry,
  variant: 'simple',
  subtitle: (
    <>
      Creators registered from this <Typography component="span" sx={{ fontWeight: 700, color: '#637381', fontSize: 'inherit' }}>country</Typography>
    </>
  ),
  renderHeroStats: (hookData) => <HeroStats genderBreakdown={hookData.genderBreakdown} count={hookData.count} />,
  emptyTitle: 'No creators found',
  emptySubtitle: 'No creators registered from this country',
  deriveHookOptions: (selectedPoint, _points, _data, _isDaily, creditTiers) => {
    const opts = { country: selectedPoint };
    if (creditTiers.length > 0) opts.creditTiers = creditTiers;
    return { hookOptions: opts, displayTitle: selectedPoint };
  },
  renderTitle: (title) => {
    const code = getCountryCode(title);
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        {code && <Iconify icon={`circle-flags:${code}`} width={24} />}
        <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{title}</Typography>
      </Stack>
    );
  },
};

// Main component

function CreatorCountryMapChart() {
  const { creditTiers } = useDateFilter();

  const hookOptions = useMemo(() => {
    const opts = {};
    if (creditTiers.length > 0) opts.creditTiers = creditTiers;
    return opts;
  }, [creditTiers]);

  const { demographics } = useGetCreatorGrowth(hookOptions);
  const countries = useMemo(() => demographics.countries || [], [demographics.countries]);
  const total = useMemo(() => countries.reduce((sum, d) => sum + d.value, 0) || 1, [countries]);

  const [region, setRegion] = useState(REGIONS[0]);

  // Filter countries for pie chart + legend based on selected region
  const filteredCountries = useMemo(() => {
    const regionSet = REGION_COUNTRIES[region.label];
    if (!regionSet) return countries; // "World Map" — show all
    return countries.filter((d) => {
      const code = getCountryCode(d.label);
      return code && regionSet.has(code);
    });
  }, [countries, region.label]);
  const filteredTotal = useMemo(() => filteredCountries.reduce((sum, d) => sum + d.value, 0) || 1, [filteredCountries]);
  const [tooltip, setTooltip] = useState(null);
  const [pieTooltip, setPieTooltip] = useState(null);
  const [highlightedItem, setHighlightedItem] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const countryListScrollRef = useRef(null);
  const [countryListEdgeFade, setCountryListEdgeFade] = useState({ top: false, bottom: false });

  const updateCountryListEdgeFade = useCallback(() => {
    const el = countryListScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const eps = COUNTRY_LIST_SCROLL_EPS;
    const bottom = scrollTop + clientHeight < scrollHeight - eps;
    const top = scrollTop > eps;
    setCountryListEdgeFade((prev) => {
      if (prev.top === top && prev.bottom === bottom) return prev;
      return { top, bottom };
    });
  }, []);

  useLayoutEffect(() => {
    updateCountryListEdgeFade();
  }, [filteredCountries, updateCountryListEdgeFade]);

  useEffect(() => {
    const el = countryListScrollRef.current;
    const onResize = () => updateCountryListEdgeFade();
    window.addEventListener('resize', onResize);

    let ro;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onResize);
      ro.observe(el);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (ro) ro.disconnect();
    };
  }, [updateCountryListEdgeFade]);

  const handleHighlightChange = useCallback((highlighted) => {
    if (!highlighted || highlighted.dataIndex == null) {
      setPieTooltip(null);
      return;
    }
    const d = filteredCountries[highlighted.dataIndex];
    if (!d) { setPieTooltip(null); return; }
    const code = getCountryCode(d.label);
    const pct = ((d.value / filteredTotal) * 100).toFixed(1);
    setPieTooltip({ name: d.label, code, value: d.value, pct });
  }, [filteredCountries, filteredTotal]);

  const numericLookup = useMemo(() => buildNumericLookup(countries), [countries]);
  const maxVal = useMemo(() => Math.max(...countries.map((d) => d.value), 1), [countries]);

  const numericToName = useMemo(
    () => countries.reduce((map, d) => {
      const alpha2 = getCountryCode(d.label);
      const numeric = alpha2 ? ALPHA2_TO_NUMERIC[alpha2] : null;
      if (numeric) map[numeric] = d.label;
      return map;
    }, {}),
    [countries]
  );

  const handleMapClick = useCallback((geo) => {
    const name = numericToName[geo.id] || geo.properties.name;
    const match = countries.find((d) => d.label === name || d.label === geo.properties.name);
    if (match) setSelectedCountry(match.label);
  }, [countries, numericToName]);

  const handlePieClick = useCallback((_event, d) => {
    if (!d || d.dataIndex == null) return;
    const country = filteredCountries[d.dataIndex];
    if (country) setSelectedCountry(country.label);
  }, [filteredCountries]);

  return (
    <>
      <ChartCard
        title="Creator Distribution"
        icon={PublicOutlinedIcon}
        subtitle="Creator count by country"
        headerRight={
          <TextField
            select
            size="small"
            value={region.label}
            onChange={(e) => {
              setRegion(REGIONS.find((r) => r.label === e.target.value) || REGIONS[0]);
              setTooltip(null);
              setPieTooltip(null);
              setHighlightedItem(null);
            }}
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': { fontSize: '0.8125rem', height: 32, borderRadius: 1 },
              '& .MuiSelect-select': { py: 0.5 },
            }}
          >
            {REGIONS.map((r) => (
              <MenuItem key={r.label} value={r.label} sx={{ fontSize: '0.8125rem' }}>
                {r.label}
              </MenuItem>
            ))}
          </TextField>
        }
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          sx={{
            flex: { xs: '0 0 auto', md: 1 },
            minHeight: 0,
            width: '100%',
            height: { md: '100%' },
            alignItems: 'stretch',
          }}
        >
          {/* Left: World Map */}
          <Box
            sx={{
              flex: { xs: '0 0 auto', md: '8 1 0%' },
              position: 'relative',
              px: 2,
              pb: 1,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              height: { xs: 'auto', md: '100%' },
            }}
          >
            <Box sx={{ flexShrink: 0, width: '100%' }}>
              <AnimatePresence mode="wait">
                <m.div
                  key={region.label}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ scale: region.scale, center: region.center }}
                    width={800}
                    height={400}
                    style={{ width: '100%', height: 'auto' }}
                  >
                    <Geographies geography={GEO_URL}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const d = numericLookup[geo.id];
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              fill={d ? getMapColor(d.value, maxVal) : '#F4F6F8'}
                              stroke="#D6D6DA"
                              strokeWidth={0.4}
                              onClick={() => handleMapClick(geo)}
                              onMouseMove={(evt) => {
                                const code = getCountryCode(d?.label || geo.properties.name);
                                const pct = d ? ((d.value / filteredTotal) * 100).toFixed(1) : null;
                                setTooltip({
                                  x: evt.clientX,
                                  y: evt.clientY,
                                  name: d?.label || geo.properties.name,
                                  code,
                                  value: d?.value || 0,
                                  pct,
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                              style={{
                                default: { outline: 'none' },
                                hover: { fill: d ? '#FFAB00' : '#E8ECEE', outline: 'none', cursor: d ? 'pointer' : 'default' },
                                pressed: { outline: 'none' },
                              }}
                            />
                          );
                        })
                      }
                    </Geographies>
                  </ComposableMap>
                </m.div>
              </AnimatePresence>
            </Box>

            {/* Tooltip */}
            {tooltip && (
              <Paper
                elevation={0}
                sx={{
                  position: 'fixed',
                  left: tooltip.x + 12,
                  top: tooltip.y - 40,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  border: '1px solid #E8ECEE',
                  pointerEvents: 'none',
                  zIndex: 9999,
                }}
              >
                {tooltip.code ? (
                  <Iconify icon={`circle-flags:${tooltip.code}`} width={20} sx={{ flexShrink: 0 }} />
                ) : (
                  <PublicOutlinedIcon sx={{ fontSize: 20, color: '#919EAB', flexShrink: 0 }} />
                )}
                <Stack spacing={0}>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1A1A2E', lineHeight: 1.2 }}>
                    {tooltip.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#637381', lineHeight: 1.2 }}>
                    {tooltip.value > 0 ? `${tooltip.value.toLocaleString()} creators (${tooltip.pct}%)` : 'No creators'}
                  </Typography>
                </Stack>
              </Paper>
            )}

            {/* Legend */}
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              sx={{
                justifyContent: 'center',
                flexShrink: 0,
                mt: { xs: 1.5, md: 'auto' },
                pt: { md: 1 },
              }}
            >
              <Typography sx={{ fontSize: '0.625rem', color: '#919EAB' }}>Low</Typography>
              {MAP_COLORS.map((color) => (
                <Box key={color} sx={{ width: 28, height: 10, bgcolor: color, borderRadius: 0.5 }} />
              ))}
              <Typography sx={{ fontSize: '0.625rem', color: '#919EAB' }}>High</Typography>
            </Stack>
          </Box>

          {/* Right: Pie chart + legend (20%) */}
          <Stack
            sx={{
              flex: { xs: '0 0 auto', md: '2 1 0%' },
              minWidth: 0,
              minHeight: 0,
              width: { xs: '100%', md: 'auto' },
              height: { xs: 'auto', md: '100%' },
              borderLeft: { md: '1px solid #E8ECEE' },
              borderTop: { xs: '1px solid #E8ECEE', md: 'none' },
              py: 2,
              px: 2,
              alignItems: 'center',
            }}
          >
            <Box
              sx={{ width: PIE_SIZE, height: PIE_SIZE }}
              onMouseMove={(e) => {
                mouseRef.current = { x: e.clientX, y: e.clientY };
                if (pieTooltip) setPieTooltip((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
              }}
              onMouseLeave={() => setPieTooltip(null)}
            >
              <PieChart
                series={[{
                  id: 'country-pie',
                  data: filteredCountries.map((d, i) => ({ id: i, value: d.value, label: d.label, color: d.color })),
                  innerRadius: 0,
                  outerRadius: '90%',
                  paddingAngle: 0.5,
                  cornerRadius: 0,
                  arcLabel: (item) => {
                    const pct = (item.value / filteredTotal) * 100;
                    return pct >= 10 ? `${pct.toFixed(0)}%` : '';
                  },
                  arcLabelMinAngle: 35,
                  valueFormatter: (item) => {
                    const pct = ((item.value / filteredTotal) * 100).toFixed(1);
                    return `${item.value.toLocaleString()} creators (${pct}%)`;
                  },
                  highlightScope: { highlight: 'item', fade: 'global' },
                }]}
                height={PIE_SIZE}
                width={PIE_SIZE}
                margin={{ top: 4, bottom: 4, left: 4, right: 4 }}
                hideLegend
                tooltip={{ trigger: 'none' }}
                slots={{ tooltip: () => null }}
                highlightedItem={highlightedItem}
                onHighlightChange={(item) => {
                  setHighlightedItem(item);
                  handleHighlightChange(item);
                }}
                onItemClick={handlePieClick}
                sx={{
                  '& .MuiPieArc-root': { cursor: 'pointer', stroke: '#fff', strokeWidth: 1 },
                  '& .MuiPieArcLabel-root': { fill: '#fff', fontSize: 11, fontWeight: 700 },
                }}
              />
            </Box>

            {/* Pie tooltip (cursor-following) */}
            {pieTooltip && (
              <Paper
                elevation={0}
                sx={{
                  position: 'fixed',
                  left: (pieTooltip.x || mouseRef.current.x) + 12,
                  top: (pieTooltip.y || mouseRef.current.y) - 40,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  border: '1px solid #E8ECEE',
                  pointerEvents: 'none',
                  zIndex: 9999,
                }}
              >
                {pieTooltip.code ? (
                  <Iconify icon={`circle-flags:${pieTooltip.code}`} width={20} sx={{ flexShrink: 0 }} />
                ) : (
                  <PublicOutlinedIcon sx={{ fontSize: 20, color: '#919EAB', flexShrink: 0 }} />
                )}
                <Stack spacing={0}>
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, color: '#1A1A2E', lineHeight: 1.2 }}>
                    {pieTooltip.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#637381', lineHeight: 1.2 }}>
                    {pieTooltip.value > 0 ? `${pieTooltip.value.toLocaleString()} creators (${pieTooltip.pct}%)` : 'No creators'}
                  </Typography>
                </Stack>
              </Paper>
            )}
            <Box sx={{ position: 'relative', width: '100%', mt: 1.5 }}>
              <Box
                ref={countryListScrollRef}
                onScroll={updateCountryListEdgeFade}
                sx={{
                  width: '100%',
                  maxHeight: { xs: 'min(240px, 42vh)', md: 'min(360px, 50vh)' },
                  minHeight: 0,
                  overflowY: 'auto',
                  scrollbarGutter: 'stable',
                  pr: 1,
                  boxSizing: 'border-box',
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-track': { background: 'transparent' },
                  '&::-webkit-scrollbar-thumb': { background: 'rgba(145, 158, 171, 0.35)', borderRadius: 3 },
                  '&:hover::-webkit-scrollbar-thumb': { background: 'rgba(145, 158, 171, 0.55)' },
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${alpha('#919EAB', 0.45)} transparent`,
                }}
              >
                <Stack spacing={0.75}>
                  {filteredCountries.map((d, i) => {
                    const code = getCountryCode(d.label);
                    const pct = ((d.value / filteredTotal) * 100).toFixed(1);
                    const isHighlighted = highlightedItem?.dataIndex === i;
                    return (
                      <Stack
                        key={d.label}
                        direction="row"
                        alignItems="center"
                        spacing={0.75}
                        onMouseEnter={() => setHighlightedItem({ seriesId: 'country-pie', dataIndex: i })}
                        onMouseLeave={() => setHighlightedItem(null)}
                        onClick={() => setSelectedCountry(d.label)}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 0.75,
                          px: 0.5,
                          mx: -0.5,
                          transition: 'background-color 0.15s',
                          bgcolor: isHighlighted ? '#F4F6F8' : 'transparent',
                          '&:hover': { bgcolor: '#F4F6F8' },
                        }}
                      >
                        {code ? (
                          <Iconify icon={`circle-flags:${code}`} width={16} sx={{ flexShrink: 0 }} />
                        ) : (
                          <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                        )}
                        <Typography sx={{ fontSize: '0.875rem', fontWeight: 500, color: '#333', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                          {d.label}
                        </Typography>
                        <Typography sx={{ fontSize: '0.8125rem', fontWeight: 500, color: '#637381', flexShrink: 0 }}>
                          {d.value} creators ({pct}%)
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>
              <Box
                aria-hidden
                sx={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  left: 0,
                  right: '6px',
                  top: 0,
                  height: COUNTRY_LIST_EDGE_FADE_PX,
                  zIndex: 1,
                  opacity: countryListEdgeFade.top ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  background: (theme) =>
                    `linear-gradient(to bottom, ${theme.palette.background.paper}, ${alpha(theme.palette.background.paper, 0)})`,
                }}
              />
              <Box
                aria-hidden
                sx={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  left: 0,
                  right: '6px',
                  bottom: 0,
                  height: COUNTRY_LIST_EDGE_FADE_PX,
                  zIndex: 1,
                  opacity: countryListEdgeFade.bottom ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  background: (theme) =>
                    `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0)}, ${theme.palette.background.paper})`,
                }}
              />
            </Box>
          </Stack>
        </Stack>
      </ChartCard>

      <CreatorDrilldownDrawer
        selectedPoint={selectedCountry}
        points={filteredCountries.map((c) => c.label)}
        data={filteredCountries}
        isDaily={false}
        onClose={() => setSelectedCountry(null)}
        onNavigate={setSelectedCountry}
        config={DRAWER_CONFIG}
      />
    </>
  );
}

export default memo(CreatorCountryMapChart);
