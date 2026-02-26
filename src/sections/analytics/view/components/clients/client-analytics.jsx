// // import { useState, useMemo } from 'react';
// // import {
// //   Box,
// //   Card,
// //   CardHeader,
// //   CardContent,
// //   Typography,
// //   Grid,
// //   Stack,
// //   Select,
// //   MenuItem,
// //   FormControl,
// //   TextField,
// //   Chip,
// //   Avatar,
// //   Divider,
// //   Button,
// //   Drawer,
// //   IconButton,
// //   List,
// //   ListItem,
// //   ListItemText,
// //   ListItemAvatar,
// //   Tooltip as MuiTooltip,
// // } from '@mui/material';
// // import {
// //   ScatterChart,
// //   Scatter,
// //   XAxis,
// //   YAxis,
// //   CartesianGrid,
// //   Tooltip,
// //   ResponsiveContainer,
// //   ReferenceLine,
// //   Label,
// //   BarChart,
// //   Bar,
// //   Legend,
// //   Cell,
// //   PieChart,
// //   Pie,
// // } from 'recharts';

// // import Iconify from 'src/components/iconify'; // Assuming you have this standard component

// // // --- CONFIG & STYLES (Matching your team's design system) ---
// // const UI_COLORS = {
// //   text: '#212B36',
// //   textSecondary: '#637381',
// //   textMuted: '#919EAB',
// //   backgroundHover: 'rgba(145, 158, 171, 0.08)',
// //   barBg: '#F4F6F8',
// //   border: '#E8ECEE',
// // };

// // const CHART_COLORS = {
// //   primary: '#1340FF', // Blue
// //   success: '#026D54', // Green
// //   warning: '#FFB547', // Orange/Yellow
// //   error: '#FF3500', // Red
// //   purple: '#8A5AFE', // Purple
// // };

// // // --- MOCK DATA ---
// // const KPI_DATA = {
// //   activation: { rate: 85, total: 142, avgTime: 24, trend: '+5%' },
// //   campaigns: { completion: 92, total: 450, avgPerBrand: 3.2, trend: '+12%' },
// //   reviews: { approval: 68, rounds: 1.2, time: 48, trend: '-2h' },
// //   retention: { rate: 82, upsells: 15, tickets: 3, trend: '+2%' },
// // };

// // const FUNNEL_DATA = [
// //   { label: 'General Info', value: 450, drop: 0 },
// //   { label: 'Objectives', value: 420, drop: 7 },
// //   { label: 'Target Audience', value: 380, drop: 10 },
// //   { label: 'Logistics', value: 310, drop: 18, isRisk: true },
// //   { label: 'Next Steps', value: 290, drop: 6 },
// // ];

// // const SKIPPED_FIELDS = [
// //   { name: 'Secondary Objectives', count: 124 },
// //   { name: 'Logistic Remarks', count: 98 },
// //   { name: 'Website Link', count: 45 },
// //   { name: 'Brand About', count: 32 },
// //   { name: 'Promo Code', count: 15 },
// // ];

// // const SCATTER_DATA = [
// //   { x: 2, y: 1, name: 'Nike', status: 'Healthy', company: 'Nike Inc.', email: 'contact@nike.com' },
// //   { x: 5, y: 2, name: 'Adidas', status: 'Healthy', company: 'Adidas AG', email: 'team@adidas.com' },
// //   { x: 14, y: 1, name: 'Puma', status: 'Slow Client', company: 'Puma SE', email: 'hello@puma.com' },
// //   {
// //     x: 3,
// //     y: 5,
// //     name: 'Sony',
// //     status: 'High Friction',
// //     company: 'Sony Corp.',
// //     email: 'marketing@sony.com',
// //   },
// //   {
// //     x: 20,
// //     y: 8,
// //     name: 'Samsung',
// //     status: 'Churn Risk',
// //     company: 'Samsung',
// //     email: 'help@samsung.com',
// //   },
// //   { x: 4, y: 1, name: 'Apple', status: 'Healthy', company: 'Apple Inc.', email: 'ads@apple.com' },
// // ];

// // const RENEWAL_MIX = [
// //   { month: 'Jan', upsell: 15, flat: 55, down: 5, churn: 25 },
// //   { month: 'Feb', upsell: 18, flat: 52, down: 5, churn: 25 },
// //   { month: 'Mar', upsell: 22, flat: 50, down: 3, churn: 25 },
// //   { month: 'Apr', upsell: 25, flat: 50, down: 5, churn: 20 },
// //   { month: 'May', upsell: 30, flat: 45, down: 5, churn: 20 },
// //   { month: 'Jun', upsell: 35, flat: 45, down: 2, churn: 18 },
// // ];

// // const REJECTION_REASONS = [
// //   { name: 'Budget Mismatch', value: 45, color: CHART_COLORS.primary },
// //   { name: 'Creative Direction', value: 30, color: CHART_COLORS.purple },
// //   { name: 'Audience Fit', value: 15, color: CHART_COLORS.warning },
// //   { name: 'Other', value: 10, color: CHART_COLORS.textMuted },
// // ];

// // // ----------------------------------------------------------------------

// // export default function ClientAnalytics() {
// //   // --- FILTERS STATE ---
// //   const [dateFilter, setDateFilter] = useState('30D');
// //   const [packageFilter, setPackageFilter] = useState('ALL');

// //   // --- ACTIONABLE DRAWER STATE ---
// //   const [drawerConfig, setDrawerConfig] = useState({
// //     open: false,
// //     title: '',
// //     type: '',
// //     data: null,
// //   });

// //   const handleOpenDrawer = (title, type, data) => {
// //     setDrawerConfig({ open: true, title, type, data });
// //   };

// //   const handleCloseDrawer = () => {
// //     setDrawerConfig({ ...drawerConfig, open: false });
// //   };

// //   return (
// //     <Box sx={{ mt: 3, pb: 10, px: { xs: 2, md: 3 } }}>
// //       {/* 1. HEADER & FILTERS */}
// //       <Stack
// //         direction={{ xs: 'column', lg: 'row' }}
// //         justifyContent="space-between"
// //         alignItems={{ xs: 'flex-start', lg: 'center' }}
// //         mb={4}
// //         spacing={2}
// //       >
// //         <Box>
// //           <Typography variant="h4" sx={{ fontWeight: 700 }}>
// //             Client Analytics
// //           </Typography>
// //           <Typography variant="body2" sx={{ color: UI_COLORS.textSecondary }}>
// //             Analyze client activation, platform usage, and retention metrics.
// //           </Typography>
// //         </Box>

// //         <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
// //           {/* PACKAGE FILTER */}
// //           <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'background.paper' }}>
// //             <Select
// //               value={packageFilter}
// //               onChange={(e) => setPackageFilter(e.target.value)}
// //               displayEmpty
// //             >
// //               <MenuItem value="ALL">All Packages</MenuItem>
// //               <Divider sx={{ my: 0.5 }} />
// //               <MenuItem value="Trial">Trial</MenuItem>
// //               <MenuItem value="Basic">Basic</MenuItem>
// //               <MenuItem value="Essential">Essential</MenuItem>
// //               <MenuItem value="Pro">Pro</MenuItem>
// //               <MenuItem value="Ultra">Ultra</MenuItem>
// //               <MenuItem value="Custom">Custom / Enterprise</MenuItem>
// //             </Select>
// //           </FormControl>

// //           {/* DATE FILTER */}
// //           {dateFilter === 'CUSTOM' && (
// //             <Stack direction="row" spacing={1}>
// //               <TextField
// //                 type="date"
// //                 size="small"
// //                 sx={{ bgcolor: 'background.paper' }}
// //                 InputLabelProps={{ shrink: true }}
// //               />
// //               <TextField
// //                 type="date"
// //                 size="small"
// //                 sx={{ bgcolor: 'background.paper' }}
// //                 InputLabelProps={{ shrink: true }}
// //               />
// //             </Stack>
// //           )}
// //           <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'background.paper' }}>
// //             <Select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
// //               <MenuItem value="7D">Last 7 Days</MenuItem>
// //               <MenuItem value="30D">Last 30 Days</MenuItem>
// //               <MenuItem value="90D">Last 3 Months</MenuItem>
// //               <MenuItem value="1Y">Last 1 Year</MenuItem>
// //               <MenuItem value="CUSTOM">Custom Range</MenuItem>
// //             </Select>
// //           </FormControl>

// //           <Button variant="contained" startIcon={<Iconify icon="eva:download-fill" />}>
// //             Export
// //           </Button>
// //         </Stack>
// //       </Stack>

// //       {/* 2. KPI CARDS */}
// //       <Grid container spacing={3} mb={4}>
// //         <Grid item xs={12} sm={6} md={3}>
// //           <KpiCard
// //             title="Activation Rate"
// //             value={`${KPI_DATA.activation.rate}%`}
// //             subvalue={`${KPI_DATA.activation.total} Activated`}
// //             trend={KPI_DATA.activation.trend}
// //             color={CHART_COLORS.primary}
// //             icon="eva:flash-fill"
// //           />
// //         </Grid>
// //         <Grid item xs={12} sm={6} md={3}>
// //           <KpiCard
// //             title="Campaign Completion"
// //             value={`${KPI_DATA.campaigns.completion}%`}
// //             subvalue={`${KPI_DATA.campaigns.total} Created`}
// //             trend={KPI_DATA.campaigns.trend}
// //             color={CHART_COLORS.success}
// //             icon="eva:briefcase-fill"
// //           />
// //         </Grid>
// //         <Grid item xs={12} sm={6} md={3}>
// //           <KpiCard
// //             title="1st Draft Approval"
// //             value={`${KPI_DATA.reviews.approval}%`}
// //             subvalue={`${KPI_DATA.reviews.rounds} Rounds Avg`}
// //             trend={KPI_DATA.reviews.trend}
// //             color={CHART_COLORS.warning}
// //             icon="eva:checkmark-circle-2-fill"
// //           />
// //         </Grid>
// //         <Grid item xs={12} sm={6} md={3}>
// //           <KpiCard
// //             title="Retention Rate"
// //             value={`${KPI_DATA.retention.rate}%`}
// //             subvalue={`${KPI_DATA.retention.upsells} Upsells`}
// //             trend={KPI_DATA.retention.trend}
// //             color={CHART_COLORS.purple}
// //             icon="eva:trending-up-fill"
// //           />
// //         </Grid>
// //       </Grid>

// //       {/* 3. ROW 1: USAGE & FRICTION (Funnel & Skipped Fields) */}
// //       <Grid container spacing={3} mb={4}>
// //         <Grid item xs={12} md={7}>
// //           <ChartCard
// //             title="Campaign Creation Funnel"
// //             subtitle="Identify where clients abandon the setup process"
// //           >
// //             <Stack spacing={2.5} sx={{ mt: 2 }}>
// //               {FUNNEL_DATA.map((step, index) => (
// //                 <Box
// //                   key={index}
// //                   onClick={() =>
// //                     step.drop > 0 && handleOpenDrawer(`${step.label} Drop-offs`, 'dropoff', step)
// //                   }
// //                   sx={{
// //                     position: 'relative',
// //                     cursor: step.drop > 0 ? 'pointer' : 'default',
// //                     p: 1.5,
// //                     borderRadius: 1,
// //                     border: '1px solid transparent',
// //                     transition: 'all 0.2s',
// //                     '&:hover':
// //                       step.drop > 0
// //                         ? { bgcolor: UI_COLORS.backgroundHover, borderColor: UI_COLORS.border }
// //                         : {},
// //                   }}
// //                 >
// //                   <Stack direction="row" justifyContent="space-between" mb={1}>
// //                     <Typography variant="subtitle2" sx={{ color: UI_COLORS.text }}>
// //                       {step.label}
// //                     </Typography>
// //                     <Stack direction="row" spacing={1.5} alignItems="center">
// //                       <Typography variant="body2" sx={{ fontWeight: 700 }}>
// //                         {step.value}
// //                       </Typography>
// //                       {step.drop > 0 && (
// //                         <Chip
// //                           label={`-${step.drop}% drop`}
// //                           size="small"
// //                           sx={{
// //                             height: 20,
// //                             fontSize: '0.7rem',
// //                             fontWeight: 600,
// //                             bgcolor: step.isRisk ? 'error.lighter' : 'grey.200',
// //                             color: step.isRisk ? 'error.dark' : 'text.secondary',
// //                           }}
// //                         />
// //                       )}
// //                     </Stack>
// //                   </Stack>

// //                   {/* Custom Proportional Bar matching your colleague's style */}
// //                   <Box
// //                     sx={{
// //                       height: 12,
// //                       bgcolor: UI_COLORS.barBg,
// //                       borderRadius: 1,
// //                       overflow: 'hidden',
// //                     }}
// //                   >
// //                     <Box
// //                       sx={{
// //                         height: '100%',
// //                         width: `${(step.value / 450) * 100}%`,
// //                         bgcolor: step.isRisk ? CHART_COLORS.error : CHART_COLORS.primary,
// //                         borderRadius: 1,
// //                         transition: 'width 0.5s ease',
// //                       }}
// //                     />
// //                   </Box>
// //                 </Box>
// //               ))}
// //             </Stack>
// //           </ChartCard>
// //         </Grid>

// //         <Grid item xs={12} md={5}>
// //           <ChartCard
// //             title="Most Skipped Fields"
// //             subtitle="Optional fields frequently ignored by clients"
// //           >
// //             <Stack spacing={1} sx={{ mt: 1 }}>
// //               {SKIPPED_FIELDS.map((field, index) => {
// //                 const maxCount = SKIPPED_FIELDS[0].count;
// //                 return (
// //                   <Stack
// //                     key={field.name}
// //                     direction="row"
// //                     alignItems="center"
// //                     spacing={1.5}
// //                     sx={{ py: 1.2, px: 1 }}
// //                   >
// //                     <Typography
// //                       sx={{
// //                         width: 24,
// //                         fontSize: 12,
// //                         fontWeight: 600,
// //                         color: UI_COLORS.textMuted,
// //                         textAlign: 'right',
// //                       }}
// //                     >
// //                       #{index + 1}
// //                     </Typography>
// //                     <Typography
// //                       sx={{
// //                         width: 140,
// //                         fontSize: 13,
// //                         fontWeight: 500,
// //                         color: UI_COLORS.text,
// //                         whiteSpace: 'nowrap',
// //                         overflow: 'hidden',
// //                         textOverflow: 'ellipsis',
// //                       }}
// //                     >
// //                       {field.name}
// //                     </Typography>
// //                     <Box
// //                       sx={{
// //                         flex: 1,
// //                         height: 16,
// //                         bgcolor: UI_COLORS.barBg,
// //                         borderRadius: 0.5,
// //                         overflow: 'hidden',
// //                       }}
// //                     >
// //                       <Box
// //                         sx={{
// //                           height: '100%',
// //                           width: `${(field.count / maxCount) * 100}%`,
// //                           bgcolor: CHART_COLORS.purple,
// //                           borderRadius: 0.5,
// //                         }}
// //                       />
// //                     </Box>
// //                     <Typography
// //                       sx={{ width: 40, fontSize: 13, fontWeight: 700, textAlign: 'right' }}
// //                     >
// //                       {field.count}
// //                     </Typography>
// //                   </Stack>
// //                 );
// //               })}
// //             </Stack>
// //           </ChartCard>
// //         </Grid>
// //       </Grid>

// //       {/* 4. ROW 2: REVIEW EFFICIENCY & REJECTIONS */}
// //       <Grid container spacing={3} mb={4}>
// //         <Grid item xs={12} md={8}>
// //           <ChartCard
// //             title="Review Efficiency Matrix"
// //             subtitle="Identify clients stuck in high-revision cycles (Top Right = High Risk)"
// //           >
// //             <Box sx={{ height: 350, mt: 2 }}>
// //               <ResponsiveContainer width="100%" height="100%">
// //                 <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
// //                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={UI_COLORS.border} />
// //                   <XAxis
// //                     type="number"
// //                     dataKey="x"
// //                     name="Days"
// //                     unit="d"
// //                     axisLine={false}
// //                     tickLine={false}
// //                     tick={{ fontSize: 12, fill: UI_COLORS.textSecondary }}
// //                   >
// //                     <Label
// //                       value="Time to Approve (Days)"
// //                       offset={-10}
// //                       position="insideBottom"
// //                       style={{ fill: UI_COLORS.textSecondary, fontSize: 12 }}
// //                     />
// //                   </XAxis>
// //                   <YAxis
// //                     type="number"
// //                     dataKey="y"
// //                     name="Rounds"
// //                     axisLine={false}
// //                     tickLine={false}
// //                     tick={{ fontSize: 12, fill: UI_COLORS.textSecondary }}
// //                   >
// //                     <Label
// //                       value="Revision Rounds"
// //                       angle={-90}
// //                       position="insideLeft"
// //                       style={{ fill: UI_COLORS.textSecondary, fontSize: 12 }}
// //                     />
// //                   </YAxis>

// //                   {/* Danger Zone Lines */}
// //                   <ReferenceLine
// //                     x={10}
// //                     stroke={CHART_COLORS.error}
// //                     strokeDasharray="3 3"
// //                     opacity={0.5}
// //                   />
// //                   <ReferenceLine
// //                     y={4}
// //                     stroke={CHART_COLORS.error}
// //                     strokeDasharray="3 3"
// //                     opacity={0.5}
// //                   />

// //                   <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<MatrixTooltip />} />

// //                   <Scatter
// //                     name="Clients"
// //                     data={SCATTER_DATA}
// //                     onClick={(data) => handleOpenDrawer(data.name, 'client', data)}
// //                     style={{ cursor: 'pointer' }}
// //                   >
// //                     {SCATTER_DATA.map((entry, index) => (
// //                       <Cell
// //                         key={`cell-${index}`}
// //                         fill={
// //                           entry.y > 4 || entry.x > 10 ? CHART_COLORS.error : CHART_COLORS.primary
// //                         }
// //                       />
// //                     ))}
// //                   </Scatter>
// //                 </ScatterChart>
// //               </ResponsiveContainer>
// //             </Box>
// //           </ChartCard>
// //         </Grid>

// //         <Grid item xs={12} md={4}>
// //           <ChartCard title="Shortlist Rejection Reasons" subtitle="Why clients reject creators">
// //             <Box
// //               sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
// //             >
// //               <ResponsiveContainer width="100%" height="100%">
// //                 <PieChart>
// //                   <Pie
// //                     data={REJECTION_REASONS}
// //                     innerRadius={60}
// //                     outerRadius={100}
// //                     paddingAngle={5}
// //                     dataKey="value"
// //                     stroke="none"
// //                   >
// //                     {REJECTION_REASONS.map((entry, index) => (
// //                       <Cell key={`cell-${index}`} fill={entry.color} />
// //                     ))}
// //                   </Pie>
// //                   <Tooltip content={<DarkTooltip />} />
// //                   <Legend
// //                     verticalAlign="bottom"
// //                     iconType="circle"
// //                     wrapperStyle={{ fontSize: 12, paddingTop: 20 }}
// //                   />
// //                 </PieChart>
// //               </ResponsiveContainer>
// //             </Box>
// //           </ChartCard>
// //         </Grid>
// //       </Grid>

// //       {/* 5. ROW 3: REVENUE & RETENTION */}
// //       <Grid container spacing={3}>
// //         <Grid item xs={12}>
// //           <ChartCard
// //             title="Package Renewal Mix"
// //             subtitle="Breakdown of what happens when a client's package expires"
// //           >
// //             <Box sx={{ height: 350, mt: 2 }}>
// //               <ResponsiveContainer width="100%" height="100%">
// //                 <BarChart
// //                   data={RENEWAL_MIX}
// //                   stackOffset="expand"
// //                   margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
// //                 >
// //                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={UI_COLORS.border} />
// //                   <XAxis
// //                     dataKey="month"
// //                     axisLine={false}
// //                     tickLine={false}
// //                     tick={{ fontSize: 12, fill: UI_COLORS.textSecondary }}
// //                   />
// //                   <YAxis
// //                     tickFormatter={(tick) => `${tick * 100}%`}
// //                     axisLine={false}
// //                     tickLine={false}
// //                     tick={{ fontSize: 12, fill: UI_COLORS.textSecondary }}
// //                   />
// //                   <Tooltip content={<RenewalTooltip />} />
// //                   <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
// //                   <Bar
// //                     dataKey="upsell"
// //                     name="Upsell (Upgrade)"
// //                     stackId="a"
// //                     fill={CHART_COLORS.success}
// //                     radius={[4, 4, 0, 0]}
// //                     maxBarSize={60}
// //                   />
// //                   <Bar
// //                     dataKey="flat"
// //                     name="Renewed (Same)"
// //                     stackId="a"
// //                     fill={CHART_COLORS.primary}
// //                     maxBarSize={60}
// //                   />
// //                   <Bar
// //                     dataKey="down"
// //                     name="Downgraded"
// //                     stackId="a"
// //                     fill={CHART_COLORS.warning}
// //                     maxBarSize={60}
// //                   />
// //                   <Bar
// //                     dataKey="churn"
// //                     name="Churned (Lost)"
// //                     stackId="a"
// //                     fill={CHART_COLORS.error}
// //                     radius={[0, 0, 4, 4]}
// //                     maxBarSize={60}
// //                   />
// //                 </BarChart>
// //               </ResponsiveContainer>
// //             </Box>
// //           </ChartCard>
// //         </Grid>
// //       </Grid>

// //       {/* --- ACTIONABLE DRAWER --- */}
// //       <ActionDrawer open={drawerConfig.open} config={drawerConfig} onClose={handleCloseDrawer} />
// //     </Box>
// //   );
// // }

// // // ----------------------------------------------------------------------
// // // SUB-COMPONENTS & WRAPPERS
// // // ----------------------------------------------------------------------

// // // Standardized Card Wrapper based on your team's style
// // function ChartCard({ title, subtitle, children }) {
// //   return (
// //     <Card
// //       sx={{ height: '100%', borderRadius: 2, boxShadow: '0 4px 24px 0 rgba(145, 158, 171, 0.1)' }}
// //     >
// //       <CardHeader
// //         title={
// //           <Typography variant="h6" sx={{ fontWeight: 600 }}>
// //             {title}
// //           </Typography>
// //         }
// //         subheader={
// //           <Typography variant="body2" sx={{ color: UI_COLORS.textSecondary, mt: 0.5 }}>
// //             {subtitle}
// //           </Typography>
// //         }
// //         sx={{ pb: 1 }}
// //       />
// //       <CardContent>{children}</CardContent>
// //     </Card>
// //   );
// // }

// // // KPI Summary Card
// // function KpiCard({ title, value, subvalue, trend, color, icon }) {
// //   const isPositive = trend.includes('+');
// //   return (
// //     <Card
// //       sx={{
// //         borderRadius: 2,
// //         boxShadow: '0 4px 24px 0 rgba(145, 158, 171, 0.1)',
// //         position: 'relative',
// //         overflow: 'hidden',
// //       }}
// //     >
// //       <Box
// //         sx={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', bgcolor: color }}
// //       />
// //       <CardContent sx={{ p: 3 }}>
// //         <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
// //           <Typography variant="subtitle2" sx={{ color: UI_COLORS.textSecondary, fontWeight: 600 }}>
// //             {title}
// //           </Typography>
// //           <Box
// //             sx={{
// //               width: 40,
// //               height: 40,
// //               borderRadius: '50%',
// //               display: 'flex',
// //               alignItems: 'center',
// //               justifyContent: 'center',
// //               bgcolor: `${color}1A`,
// //               color: color,
// //             }}
// //           >
// //             <Iconify icon={icon} width={24} />
// //           </Box>
// //         </Stack>
// //         <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
// //           {value}
// //         </Typography>
// //         <Stack direction="row" alignItems="center" spacing={1}>
// //           <Chip
// //             size="small"
// //             label={trend}
// //             sx={{
// //               height: 20,
// //               fontSize: '0.7rem',
// //               fontWeight: 700,
// //               bgcolor: isPositive ? 'success.lighter' : 'error.lighter',
// //               color: isPositive ? 'success.dark' : 'error.dark',
// //             }}
// //           />
// //           <Typography variant="body2" sx={{ color: UI_COLORS.textSecondary }}>
// //             {subvalue}
// //           </Typography>
// //         </Stack>
// //       </CardContent>
// //     </Card>
// //   );
// // }

// // // --- TOOLTIPS ---

// // const DarkTooltip = ({ active, payload }) => {
// //   if (active && payload && payload.length) {
// //     return (
// //       <Box
// //         sx={{ bgcolor: '#1C252E', color: '#fff', px: 1.5, py: 1, borderRadius: 1, boxShadow: 3 }}
// //       >
// //         <Typography variant="body2" sx={{ fontWeight: 600 }}>
// //           {payload[0].name}
// //         </Typography>
// //         <Typography variant="caption" sx={{ color: 'grey.400' }}>
// //           {payload[0].value} occurrences
// //         </Typography>
// //       </Box>
// //     );
// //   }
// //   return null;
// // };

// // const MatrixTooltip = ({ active, payload }) => {
// //   if (active && payload && payload.length) {
// //     const data = payload[0].payload;
// //     return (
// //       <Box
// //         sx={{
// //           bgcolor: '#1C252E',
// //           color: '#fff',
// //           p: 1.5,
// //           borderRadius: 1,
// //           boxShadow: 3,
// //           minWidth: 160,
// //         }}
// //       >
// //         <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
// //           {data.name}
// //         </Typography>
// //         <Typography
// //           variant="caption"
// //           sx={{
// //             color: data.y > 4 ? CHART_COLORS.error : CHART_COLORS.success,
// //             fontWeight: 600,
// //             display: 'block',
// //             mb: 1,
// //           }}
// //         >
// //           {data.status}
// //         </Typography>
// //         <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
// //         <Stack direction="row" justifyContent="space-between">
// //           <Typography variant="caption" sx={{ color: 'grey.400' }}>
// //             Time to Approve:
// //           </Typography>
// //           <Typography variant="caption" sx={{ fontWeight: 600 }}>
// //             {data.x} days
// //           </Typography>
// //         </Stack>
// //         <Stack direction="row" justifyContent="space-between">
// //           <Typography variant="caption" sx={{ color: 'grey.400' }}>
// //             Revisions:
// //           </Typography>
// //           <Typography variant="caption" sx={{ fontWeight: 600 }}>
// //             {data.y} rounds
// //           </Typography>
// //         </Stack>
// //       </Box>
// //     );
// //   }
// //   return null;
// // };

// // const RenewalTooltip = ({ active, payload, label }) => {
// //   if (active && payload && payload.length) {
// //     const total = payload.reduce((sum, entry) => sum + entry.value, 0);
// //     const retentionRate = Math.round(
// //       ((payload[0].value + payload[1].value + payload[2].value) / total) * 100
// //     );

// //     return (
// //       <Box
// //         sx={{
// //           bgcolor: '#1C252E',
// //           color: '#fff',
// //           p: 1.5,
// //           borderRadius: 1,
// //           boxShadow: 3,
// //           minWidth: 200,
// //         }}
// //       >
// //         <Typography variant="subtitle2" sx={{ mb: 1 }}>
// //           {label} Renewals
// //         </Typography>
// //         <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
// //         {payload.reverse().map((entry, index) => (
// //           <Stack key={index} direction="row" justifyContent="space-between" mb={0.5}>
// //             <Stack direction="row" alignItems="center" spacing={1}>
// //               <Box sx={{ width: 8, height: 8, bgcolor: entry.color, borderRadius: '50%' }} />
// //               <Typography variant="caption" sx={{ color: 'grey.400' }}>
// //                 {entry.name}
// //               </Typography>
// //             </Stack>
// //             <Typography variant="caption" sx={{ fontWeight: 600 }}>
// //               {entry.value}
// //             </Typography>
// //           </Stack>
// //         ))}
// //         <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1 }} />
// //         <Stack direction="row" justifyContent="space-between">
// //           <Typography variant="caption" sx={{ color: 'grey.400' }}>
// //             Total Retention:
// //           </Typography>
// //           <Typography variant="caption" sx={{ fontWeight: 700, color: CHART_COLORS.success }}>
// //             {retentionRate}%
// //           </Typography>
// //         </Stack>
// //       </Box>
// //     );
// //   }
// //   return null;
// // };

// // // --- INTERACTIVE DRAWER ---

// // function ActionDrawer({ open, config, onClose }) {
// //   const isDropoff = config.type === 'dropoff';
// //   const isClient = config.type === 'client';

// //   return (
// //     <Drawer
// //       open={open}
// //       onClose={onClose}
// //       anchor="right"
// //       PaperProps={{
// //         sx: {
// //           width: { xs: 1, sm: 480 },
// //           borderTopLeftRadius: 12,
// //           display: 'flex',
// //           flexDirection: 'column',
// //         },
// //       }}
// //     >
// //       <Box
// //         sx={{
// //           p: 3,
// //           borderBottom: '1px solid',
// //           borderColor: UI_COLORS.border,
// //           position: 'sticky',
// //           top: 0,
// //           bgcolor: '#fff',
// //           zIndex: 1,
// //         }}
// //       >
// //         <Stack direction="row" alignItems="center" justifyContent="space-between">
// //           <Typography variant="h6" sx={{ fontWeight: 700 }}>
// //             {config.title}
// //           </Typography>
// //           <IconButton onClick={onClose} sx={{ bgcolor: UI_COLORS.backgroundHover }}>
// //             <Iconify icon="eva:close-fill" />
// //           </IconButton>
// //         </Stack>
// //         <Typography variant="body2" sx={{ color: UI_COLORS.textSecondary, mt: 1 }}>
// //           {isDropoff
// //             ? `Users who abandoned the form at this step. Reach out to offer assistance.`
// //             : `Client details and recent activity.`}
// //         </Typography>
// //       </Box>

// //       <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
// //         {isDropoff && (
// //           <List disablePadding>
// //             {/* Using mock array here, map actual data in production */}
// //             {['John Doe', 'Sarah Connor', 'Bruce Wayne'].map((name, i) => (
// //               <ListItem
// //                 key={i}
// //                 sx={{ px: 0, py: 2, borderBottom: '1px dashed', borderColor: UI_COLORS.border }}
// //               >
// //                 <ListItemAvatar>
// //                   <Avatar sx={{ bgcolor: CHART_COLORS.primary, color: '#fff' }}>{name[0]}</Avatar>
// //                 </ListItemAvatar>
// //                 <ListItemText
// //                   primary={<Typography variant="subtitle2">{name}</Typography>}
// //                   secondary={
// //                     <Stack spacing={1} mt={0.5}>
// //                       <Typography variant="caption" sx={{ color: UI_COLORS.textSecondary }}>
// //                         Company Inc. • Abandoned 2h ago
// //                       </Typography>
// //                       <Button
// //                         size="small"
// //                         variant="outlined"
// //                         startIcon={<Iconify icon="eva:email-fill" />}
// //                         sx={{ width: 'fit-content' }}
// //                       >
// //                         Send Reminder
// //                       </Button>
// //                     </Stack>
// //                   }
// //                 />
// //               </ListItem>
// //             ))}
// //           </List>
// //         )}

// //         {isClient && config.data && (
// //           <Stack spacing={3}>
// //             <Card sx={{ p: 3, bgcolor: UI_COLORS.barBg, boxShadow: 'none' }}>
// //               <Stack direction="row" spacing={2} alignItems="center" mb={2}>
// //                 <Avatar
// //                   sx={{
// //                     width: 56,
// //                     height: 56,
// //                     bgcolor: config.data.y > 4 ? CHART_COLORS.error : CHART_COLORS.success,
// //                   }}
// //                 >
// //                   {config.data.name[0]}
// //                 </Avatar>
// //                 <Box>
// //                   <Typography variant="h6">{config.data.name}</Typography>
// //                   <Chip
// //                     size="small"
// //                     label={config.data.status}
// //                     color={config.data.y > 4 ? 'error' : 'success'}
// //                     variant="outlined"
// //                     sx={{ mt: 0.5 }}
// //                   />
// //                 </Box>
// //               </Stack>
// //               <Divider sx={{ my: 2 }} />
// //               <Grid container spacing={2}>
// //                 <Grid item xs={6}>
// //                   <Typography variant="caption" sx={{ color: UI_COLORS.textSecondary }}>
// //                     Avg Review Time
// //                   </Typography>
// //                   <Typography variant="subtitle1">{config.data.x} Days</Typography>
// //                 </Grid>
// //                 <Grid item xs={6}>
// //                   <Typography variant="caption" sx={{ color: UI_COLORS.textSecondary }}>
// //                     Avg Revisions
// //                   </Typography>
// //                   <Typography variant="subtitle1">{config.data.y} Rounds</Typography>
// //                 </Grid>
// //               </Grid>
// //             </Card>

// //             <Button
// //               fullWidth
// //               variant="contained"
// //               size="large"
// //               startIcon={<Iconify icon="eva:message-circle-fill" />}
// //             >
// //               Contact CSM
// //             </Button>
// //           </Stack>
// //         )}
// //       </Box>
// //     </Drawer>
// //   );
// // }
// import React, { useState } from 'react';
// import { Container, Grid, Stack, Typography, Box } from '@mui/material';
// import useSWR from 'swr';
// import { fetcher, endpoints } from 'src/utils/axios';

// // Components
// import ClientKPICard from './client-kpi-cards';
// import ClientActionSpeed from './client-action-speed';
// import ClientRejectionPie from './client-rejection-pie';
// import CampaignBriefJourney from './campaign-brief-journey';
// import ClientReviewEfficiency from './client-review-efficiency';
// import ClientCampaignCreation from './client-campaign-creation';
// import ClientShortlistEfficiency from './client-shortlist-efficiency';
// import PackageRenewalStackedBar from './package-renewal-stackedbars';

// // const fetcher = (url) => axios.get(url).then((res) => res.data);

// export default function ClientAnalytics() {
//   const [filters] = useState({ packageType: 'ALL', range: '30D' });

//   // Data Fetching (Mapping to your Backend Endpoints)
//   const { data: activation } = useSWR(endpoints.analytics.client.activation, fetcher);
//   const { data: campaign } = useSWR(endpoints.analytics.client.campaigns, fetcher);
//   const { data: approval } = useSWR(endpoints.analytics.client.approve, fetcher);
//   const { data: support } = useSWR(endpoints.analytics.client.support, fetcher);
//   const { data: journey } = useSWR(endpoints.analytics.client.journey, fetcher);
//   const { data: shortlist } = useSWR(endpoints.analytics.client.shortlist, fetcher);

//   return (
//     <Container maxWidth="xl" sx={{ py: 5 }}>
//       <Typography variant="h4" mb={5} fontWeight="bold">
//         Client Analytics
//       </Typography>

//       {/* Row 1: Top KPIs (Spreadsheet Row 1, 7, 23, 30) */}
//       <Grid container spacing={3} mb={4}>
//         <Grid item xs={12} sm={6} md={3}>
//           <ClientKPICard
//             title="Activation"
//             value={`${activation?.activationRate || 0}%`}
//             subtitle="Row 1"
//             icon="solar:user-check-bold"
//             color="info"
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <ClientKPICard
//             title="Completion"
//             value={`${campaign?.campaignCompletionRate || 0}%`}
//             subtitle="Row 7"
//             icon="solar:flag-bold"
//             color="success"
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <ClientKPICard
//             title="1st Draft Approval"
//             value={`${approval?.firstDraftApprovalRate || 0}%`}
//             subtitle="Row 23"
//             icon="solar:magic-stick-bold"
//             color="secondary"
//           />
//         </Grid>
//         <Grid item xs={12} sm={6} md={3}>
//           <ClientKPICard
//             title="Retention"
//             value={`${support?.retentionRate || 0}%`}
//             subtitle="Row 30"
//             icon="solar:refresh-bold"
//             color="warning"
//           />
//         </Grid>
//       </Grid>

//       <Grid container spacing={3}>
//         {/* Row 2: Creation & Activation (Spreadsheet Row 4, 12, 8) */}
//         <Grid item xs={12} md={8}>
//           <CampaignBriefJourney data={journey?.dropoffs || []} />
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <Stack spacing={3}>
//             <ClientActionSpeed data={activation} /> {/* Row 4 */}
//             <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
//               <Typography variant="subtitle2" mb={1}>
//                 Most Skipped Fields (Row 8)
//               </Typography>
//               {journey?.skippedFields?.map((f) => (
//                 <Typography key={f.name} variant="caption" display="block">
//                   • {f.name}
//                 </Typography>
//               ))}
//             </Box>
//           </Stack>
//         </Grid>

//         {/* Row 3: Efficiency & Friction (Spreadsheet Row 16, 17, 20, 22) */}
//         <Grid item xs={12} md={7}>
//           <ClientReviewEfficiency data={approval} /> {/* Row 20 & 22 */}
//         </Grid>
//         <Grid item xs={12} md={5}>
//           <ClientRejectionPie data={shortlist?.rejectionReasons || []} /> {/* Row 16 & 17 */}
//         </Grid>

//         {/* Row 4: Strategy & Revenue (Spreadsheet Row 5, 11, 15, 19, 31, 32) */}
//         <Grid item xs={12} md={4}>
//           <ClientCampaignCreation data={campaign} /> {/* Row 5 & 11 */}
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <ClientShortlistEfficiency data={shortlist} /> {/* Row 15 & 19 */}
//         </Grid>
//         <Grid item xs={12} md={4}>
//           <PackageRenewalStackedBar data={support} /> {/* Row 31 & 32 */}
//         </Grid>
//       </Grid>
//     </Container>
//   );
// }

import React from 'react';
import { Container, Grid, Typography, Stack, Rating } from '@mui/material';
import useSWR from 'swr';
import { fetcher, endpoints } from 'src/utils/axios';

// Import all your meticulously crafted widgets
import {
  TopKPICard,
  TimeSpentChart,
  SkippedFieldsChart,
  DropOffChart,
  RenewalChart,
  ReviewEfficiencyScatter,
  TurnaroundChart,
  RejectionDonut,
  SimpleMetricCard,
} from './client-widgets';

export default function AnalyticsDashboard() {
  // Data Fetching based on your Backend
  const { data: activation } = useSWR(endpoints.analytics.client.activation, fetcher);
  const { data: campaign } = useSWR(endpoints.analytics.client.campaigns, fetcher);
  const { data: approval } = useSWR(endpoints.analytics.client.approve, fetcher);
  const { data: support } = useSWR(endpoints.analytics.client.support, fetcher);
  const { data: journey } = useSWR(endpoints.analytics.client.journey, fetcher);
  const { data: shortlist } = useSWR(endpoints.analytics.client.shortlist, fetcher);

  return (
    <>
      {/* ROW 1: Top KPI Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard title="Total Clients" mainValue={activation?.totalInvited || 0}>
            <Stack spacing={0.5}>
              <Typography variant="caption" color="success.main">
                ● active (v2) 1500
              </Typography>
              <Typography variant="caption" color="success.main">
                ● active (v4) {activation?.totalActivated || 0}
              </Typography>
              <Typography variant="caption" color="error.main">
                ● unlinked {activation?.totalInvited - activation?.totalActivated || 0}
              </Typography>
            </Stack>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard title="Activation Rate" mainValue={`${activation?.activationRate || '-'}%`}>
            <Typography variant="caption" color="success.main">
              ▲ {activation?.rateUnder24h || 0}% under 24h
            </Typography>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard title="Retention Rate" mainValue={`${support?.retentionRate || '-'}%`}>
            <Typography variant="caption" color="success.main">
              ▲ {support?.upgradeRate || 0}% upsell rate
            </Typography>
          </TopKPICard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TopKPICard title="NPS Feedback rating" mainValue={`${support?.npsScore || '-'}`}>
            <Typography variant="caption" display="block" color="text.secondary" mb={0.5}>
              From {support?.totalNpsReports || 0} reports{' '}
            </Typography>
            {/* MUI Rating component looks exactly like the stars in your drawing */}
            <Rating value={support?.npsScore || 0} precision={0.5} readOnly size="small" />
          </TopKPICard>
        </Grid>
      </Grid>

      {/* ROW 2: Time Spent vs Most Skipped Fields */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <TimeSpentChart data={journey?.avgTimes} />
        </Grid>
        <Grid item xs={12} md={6}>
          <SkippedFieldsChart
            journey={journey?.skippedFields}
            campaign={campaign?.totalCampaigns}
          />
        </Grid>
      </Grid>

      {/* ROW 3: Drop off Location vs Package Renewal */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <DropOffChart journey={journey?.dropoffs} />
        </Grid>
        <Grid item xs={12} md={6}>
          <RenewalChart data={support} />
        </Grid>
      </Grid>

      {/* ROW 4: Submission Review Efficiency (Full Width) */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={3}>
          <Grid direction="column" container spacing={2}>
            <Grid item xs={12} md={4}>
              <SimpleMetricCard
                title="Campaign creation rate"
                value={`${campaign?.campaignCreationRate || 0}%`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <SimpleMetricCard
                title="Average campaigns"
                value={`${campaign?.avgCampaignsPerBrand || 0} campaigns`}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <SimpleMetricCard
                title="Time to first campaign"
                value={`${campaign?.avgTimeToFirstCampaign || 0} days`}
              />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12} md={9}>
          <ReviewEfficiencyScatter data={approval} />
        </Grid>
      </Grid>

      {/* ROW 5: Shortlist Turnaround vs Shortlist Rejection */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={8}>
          <TurnaroundChart data={shortlist} />
        </Grid>
        <Grid item xs={12} md={4}>
          <RejectionDonut data={shortlist?.rejectionReasons} />
        </Grid>
      </Grid>

      {/* ROW 6: Bottom Metrics */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <SimpleMetricCard
            title="Campaign creation rate"
            value={`${campaign?.campaignCreationRate || 0}%`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SimpleMetricCard
            title="Average campaigns"
            value={`${campaign?.avgCampaignsPerBrand || 0} campaigns`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SimpleMetricCard
            title="Time to first campaign"
            value={`${campaign?.avgTimeToFirstCampaign || 0} days`}
          />
        </Grid>
      </Grid>
    </>
  );
}
