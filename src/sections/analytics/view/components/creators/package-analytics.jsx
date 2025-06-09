import PropTypes from 'prop-types';

import AssignmentIcon from '@mui/icons-material/Assignment';
import {
  Box,
  Grid,
  Card,
  Stack,
  Avatar,
  Typography,
  CardContent,
} from '@mui/material';

import { AnalyticsTooltip } from './analytics-tooltips';

// Clean color palette matching dashboard-superadmin
const colors = {
  primary: '#000000',
  secondary: '#666666',
  tertiary: '#999999',
  accent: '#1340FF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  background: '#FFFFFF',
  surface: '#FAFAFA',
  border: '#E8ECEE',
  light: '#F5F5F5',
};

// Section Header Component
function SectionHeader({ title, icon: Icon }) {
  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
      <Avatar sx={{ bgcolor: `${colors.accent}15`, color: colors.accent, width: 40, height: 40 }}>
        <Icon />
      </Avatar>
      <Typography variant="h6" sx={{ fontWeight: 600, color: colors.primary, fontSize: '1.1rem' }}>
        {title}
      </Typography>
    </Stack>
  );
}

SectionHeader.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
};

// Package Analytics Component
export default function PackageAnalytics({ subscriptions = [] }) {
  // Calculate package distribution based on actual created packages
  const packageDistribution = subscriptions.reduce((acc, subscription) => {
    let packageName = 'Custom';
    
    if (subscription.package?.name) {
      packageName = subscription.package.name;
    } else if (subscription.customPackage?.customName) {
      packageName = subscription.customPackage.customName;
    }
    
    acc[packageName] = (acc[packageName] || 0) + 1;
    return acc;
  }, {});

  // Calculate revenue by package type
  const revenueByPackage = subscriptions.reduce((acc, subscription) => {
    let packageName = 'Custom';
    
    if (subscription.package?.name) {
      packageName = subscription.package.name;
    } else if (subscription.customPackage?.customName) {
      packageName = subscription.customPackage.customName;
    }
    
    acc[packageName] = (acc[packageName] || 0) + (subscription.packagePrice || 0);
    return acc;
  }, {});

  // Get unique package names from actual data
  const packageTypes = Object.keys(packageDistribution);
  const packageColors = [colors.accent, colors.success, colors.warning, colors.error, colors.tertiary];

  // Calculate performance metrics
  const totalCredits = subscriptions.reduce((sum, s) => sum + (s.totalCredits || 0), 0);
  const usedCredits = subscriptions.reduce((sum, s) => sum + (s.creditsUsed || 0), 0);
  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
  const avgCreditsPerPackage = subscriptions.length > 0 ? Math.round(totalCredits / subscriptions.length) : 0;
  const creditUtilization = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;
  const avgRevenuePerClient = activeSubscriptions.length > 0 ? 
    Math.round(subscriptions.reduce((sum, s) => sum + (s.packagePrice || 0), 0) / activeSubscriptions.length) : 0;
  const expiredPackages = subscriptions.filter(s => s.status === 'EXPIRED').length;

  return (
    <Box sx={{ mb: 5 }}>
      <SectionHeader 
        title="Package Analytics"
        icon={AssignmentIcon}
      />
      
      <Grid container spacing={3}>
        {/* Package Distribution & Performance */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ 
            height: '100%', 
            border: `1px solid ${colors.border}`, 
            borderRadius: 1,
            bgcolor: colors.background
          }}>
            <CardContent sx={{ p: 3 }}>
              <AnalyticsTooltip tooltipKey="packageDistribution">
                <Typography variant="h6" sx={{ 
                  fontWeight: 600, 
                  mb: 3, 
                  color: colors.primary,
                  cursor: 'help',
                  fontSize: '1.1rem'
                }}>
                  Package Distribution & Performance
                </Typography>
              </AnalyticsTooltip>
              
              <Grid container spacing={3}>
                {/* Package Type Breakdown */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: colors.surface, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: colors.primary }}>
                      Packages by Type
                    </Typography>
                    <Stack spacing={2}>
                      {packageTypes.length > 0 ? packageTypes.map((packageType, index) => {
                        const count = packageDistribution[packageType];
                        const percentage = subscriptions.length > 0 ? (count / subscriptions.length) * 100 : 0;
                        const color = packageColors[index % packageColors.length];
                        
                        return (
                          <Stack key={packageType} direction="row" alignItems="center" spacing={2}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: color 
                            }} />
                            <Typography variant="body2" sx={{ flex: 1, color: colors.secondary, fontSize: '0.85rem' }}>
                              {packageType}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary, minWidth: 40, fontSize: '0.85rem' }}>
                              {count}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.secondary, minWidth: 45, fontSize: '0.75rem' }}>
                              ({percentage.toFixed(1)}%)
                            </Typography>
                          </Stack>
                        );
                      }) : (
                        <Typography variant="body2" sx={{ color: colors.secondary, textAlign: 'center', py: 2 }}>
                          No packages found
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Grid>
                
                {/* Revenue by Package */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ p: 2, bgcolor: colors.surface, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: colors.primary }}>
                      Revenue by Package Type
                    </Typography>
                    <Stack spacing={2}>
                      {packageTypes.length > 0 ? packageTypes.map((packageType, index) => {
                        const revenue = revenueByPackage[packageType] || 0;
                        const color = packageColors[index % packageColors.length];
                        
                        return (
                          <Stack key={packageType} direction="row" alignItems="center" spacing={2}>
                            <Box sx={{ 
                              width: 12, 
                              height: 12, 
                              borderRadius: '50%', 
                              bgcolor: color 
                            }} />
                            <Typography variant="body2" sx={{ flex: 1, color: colors.secondary, fontSize: '0.85rem' }}>
                              {packageType}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary, fontSize: '0.85rem' }}>
                              RM {revenue.toLocaleString()}
                            </Typography>
                          </Stack>
                        );
                      }) : (
                        <Typography variant="body2" sx={{ color: colors.secondary, textAlign: 'center', py: 2 }}>
                          No revenue data
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
              
              {/* Package Performance Metrics */}
              <Box sx={{ mt: 3, p: 2, bgcolor: colors.surface, borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: colors.primary }}>
                  Package Performance Insights
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <AnalyticsTooltip tooltipKey="avgCreditsPerPackage">
                      <Stack alignItems="center" spacing={1} sx={{ cursor: 'help' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.accent, fontSize: '1.75rem' }}>
                          {avgCreditsPerPackage}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.secondary, textAlign: 'center', fontSize: '0.75rem' }}>
                          Avg Credits per Package
                        </Typography>
                      </Stack>
                    </AnalyticsTooltip>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <AnalyticsTooltip tooltipKey="creditUtilization">
                      <Stack alignItems="center" spacing={1} sx={{ cursor: 'help' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.success, fontSize: '1.75rem' }}>
                          {creditUtilization}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.secondary, textAlign: 'center', fontSize: '0.75rem' }}>
                          Credit Utilization
                        </Typography>
                      </Stack>
                    </AnalyticsTooltip>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <AnalyticsTooltip tooltipKey="avgRevenuePerClient">
                      <Stack alignItems="center" spacing={1} sx={{ cursor: 'help' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.warning, fontSize: '1.75rem' }}>
                          RM {avgRevenuePerClient.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.secondary, textAlign: 'center', fontSize: '0.75rem' }}>
                          Avg Revenue per Client
                        </Typography>
                      </Stack>
                    </AnalyticsTooltip>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <AnalyticsTooltip tooltipKey="expiredPackages">
                      <Stack alignItems="center" spacing={1} sx={{ cursor: 'help' }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.error, fontSize: '1.75rem' }}>
                          {expiredPackages}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.secondary, textAlign: 'center', fontSize: '0.75rem' }}>
                          Expired Packages
                        </Typography>
                      </Stack>
                    </AnalyticsTooltip>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Package Summary */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ 
            height: '100%', 
            border: `1px solid ${colors.border}`, 
            borderRadius: 1,
            bgcolor: colors.background
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: colors.primary, fontSize: '1.1rem' }}>
                Package Summary
              </Typography>
              
              <Stack spacing={3}>
                {/* Total Packages */}
                <AnalyticsTooltip tooltipKey="totalPackagesSold">
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.surface, borderRadius: 1, cursor: 'help' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: colors.accent, mb: 1, fontSize: '2rem' }}>
                      {subscriptions.length}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.secondary, fontSize: '0.85rem' }}>
                      Total Packages Sold
                    </Typography>
                  </Box>
                </AnalyticsTooltip>
                
                {/* Active vs Expired */}
                <Stack spacing={2}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: colors.secondary, fontSize: '0.85rem' }}>
                      Active Packages
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.success, fontSize: '0.85rem' }}>
                        {subscriptions.filter(s => s.status === 'ACTIVE').length}
                      </Typography>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: colors.success 
                      }} />
                    </Stack>
                  </Stack>
                  
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: colors.secondary, fontSize: '0.85rem' }}>
                      Expired Packages
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.error, fontSize: '0.85rem' }}>
                        {subscriptions.filter(s => s.status === 'EXPIRED').length}
                      </Typography>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: colors.error 
                      }} />
                    </Stack>
                  </Stack>
                  
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ color: colors.secondary, fontSize: '0.85rem' }}>
                      Cancelled Packages
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.secondary, fontSize: '0.85rem' }}>
                        {subscriptions.filter(s => s.status === 'CANCELLED').length}
                      </Typography>
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        borderRadius: '50%', 
                        bgcolor: colors.secondary 
                      }} />
                    </Stack>
                  </Stack>
                </Stack>
                
                {/* Credits Overview */}
                <Box sx={{ p: 2, bgcolor: colors.surface, borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: colors.primary }}>
                    Credits Overview
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <AnalyticsTooltip tooltipKey="totalCreditsSold">
                        <Typography variant="body2" sx={{ color: colors.secondary, cursor: 'help', fontSize: '0.85rem' }}>
                          Total Credits Sold
                        </Typography>
                      </AnalyticsTooltip>
                      <AnalyticsTooltip tooltipKey="totalCreditsSold">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.primary, cursor: 'help', fontSize: '0.85rem' }}>
                          {totalCredits.toLocaleString()}
                        </Typography>
                      </AnalyticsTooltip>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <AnalyticsTooltip tooltipKey="creditsUsed">
                        <Typography variant="body2" sx={{ color: colors.secondary, cursor: 'help', fontSize: '0.85rem' }}>
                          Credits Used
                        </Typography>
                      </AnalyticsTooltip>
                      <AnalyticsTooltip tooltipKey="creditsUsed">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.warning, cursor: 'help', fontSize: '0.85rem' }}>
                          {usedCredits.toLocaleString()}
                        </Typography>
                      </AnalyticsTooltip>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <AnalyticsTooltip tooltipKey="creditsRemaining">
                        <Typography variant="body2" sx={{ color: colors.secondary, cursor: 'help', fontSize: '0.85rem' }}>
                          Credits Remaining
                        </Typography>
                      </AnalyticsTooltip>
                      <AnalyticsTooltip tooltipKey="creditsRemaining">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.success, cursor: 'help', fontSize: '0.85rem' }}>
                          {(totalCredits - usedCredits).toLocaleString()}
                        </Typography>
                      </AnalyticsTooltip>
                    </Stack>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

PackageAnalytics.propTypes = {
  subscriptions: PropTypes.array,
}; 