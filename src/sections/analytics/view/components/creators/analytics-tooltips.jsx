import PropTypes from 'prop-types';

import { Box, Tooltip, Typography } from '@mui/material';

// Comprehensive Tooltips content
export const analyticsTooltips = {
  // KPI Tooltips
  totalCreators: {
    title: "Total Creators",
    content: "The total number of registered creators on the platform. This includes all creators regardless of their activity status or campaign participation."
  },
  activeCreators: {
    title: "Active Creators", 
    content: "Creators who have participated in at least one campaign (either pitched or been shortlisted). This metric indicates platform engagement and creator adoption."
  },
  pitchAcceptance: {
    title: "Pitch Acceptance Rate",
    content: "Percentage of creator pitches that result in being shortlisted for campaigns. Higher rates indicate better creator-campaign matching and quality submissions."
  },
  avgResponseTime: {
    title: "Average Response Time",
    content: "Average time taken to process and respond to creator submissions across all workflow stages. Lower times indicate more efficient operations."
  },
  
  // Revenue Analysis Tooltips
  clientRevenue: {
    title: "Client Revenue",
    content: "Total revenue generated from all client package purchases. This includes active, expired, and cancelled subscriptions across all package types (Basic, Essential, Pro, Custom)."
  },
  activeSubscriptions: {
    title: "Active Subscriptions",
    content: "Number of currently active client packages. These are subscriptions that haven't expired or been cancelled and still have available credits."
  },
  avgPackageValue: {
    title: "Average Package Value",
    content: "The average price paid per package across all subscription types. Calculated by dividing total revenue by number of packages sold."
  },
  monthlyRecurring: {
    title: "Monthly Recurring Revenue (MRR)",
    content: "Estimated monthly recurring revenue based on current subscription patterns. This helps predict future revenue streams and business growth."
  },
  creatorPayments: {
    title: "Creator Payments",
    content: "Total amount paid to creators for completed work. This includes all approved and paid invoices for campaign deliverables, content creation, and posting activities."
  },
  paidInvoices: {
    title: "Paid Invoices",
    content: "Number of creator invoices that have been approved and paid. This indicates completed work and successful payment processing."
  },
  pendingInvoices: {
    title: "Pending Invoices",
    content: "Number of creator invoices awaiting approval or payment. High numbers may indicate payment processing delays or approval bottlenecks."
  },
  avgPayment: {
    title: "Average Payment per Creator",
    content: "Average amount paid per creator invoice. This helps understand typical creator compensation rates and budget planning."
  },
  platformMargin: {
    title: "Platform Margin",
    content: "Revenue remaining after creator payments (Client Revenue - Creator Payments). This represents the platform's gross profit before operational expenses."
  },
  marginRate: {
    title: "Margin Rate",
    content: "Percentage of revenue retained as platform margin. Higher rates indicate better profitability but should be balanced with competitive creator compensation."
  },
  revenueGrowth: {
    title: "Revenue Growth",
    content: "Month-over-month revenue growth rate. Positive growth indicates business expansion and successful client acquisition/retention."
  },
  clientRetention: {
    title: "Client Retention Rate",
    content: "Percentage of clients who renew their packages or purchase additional packages. High retention indicates client satisfaction and product-market fit."
  },
  
  // Package Analytics Tooltips
  packageDistribution: {
    title: "Package Distribution",
    content: "Breakdown of how many clients have purchased each package type. This shows which packages are most popular and helps with pricing strategy."
  },
  revenueByPackage: {
    title: "Revenue by Package Type",
    content: "Total revenue generated from each package type. This helps identify which packages are most profitable and drive business growth."
  },
  avgCreditsPerPackage: {
    title: "Average Credits per Package",
    content: "Average number of UGC credits included in packages. This metric helps understand package sizing and client needs."
  },
  creditUtilization: {
    title: "Credit Utilization Rate",
    content: "Percentage of purchased credits that have been used by clients. Low utilization may indicate over-purchasing or underutilization of services."
  },
  avgRevenuePerClient: {
    title: "Average Revenue per Client",
    content: "Average revenue generated per active client. This metric helps with customer lifetime value calculations and pricing optimization."
  },
  expiredPackages: {
    title: "Expired Packages",
    content: "Number of packages that have reached their expiration date. High numbers may indicate clients not fully utilizing their purchases."
  },
  totalPackagesSold: {
    title: "Total Packages Sold",
    content: "Total number of packages sold across all time periods and package types. This shows overall business volume and growth."
  },
  totalCreditsSold: {
    title: "Total Credits Sold",
    content: "Total number of UGC credits sold across all packages. This represents the total capacity for content creation sold to clients."
  },
  creditsUsed: {
    title: "Credits Used",
    content: "Total number of credits that have been consumed by clients for campaigns and content creation. This shows actual platform utilization."
  },
  creditsRemaining: {
    title: "Credits Remaining",
    content: "Total unused credits across all active packages. High numbers may indicate clients need support in utilizing their packages or over-purchasing."
  }
};

// Reusable Tooltip Component
export function AnalyticsTooltip({ tooltipKey, children, placement = "top" }) {
  const tooltip = analyticsTooltips[tooltipKey];
  
  if (!tooltip) return children;
  
  return (
    <Tooltip 
      title={
        <Box sx={{ p: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {tooltip.title}
          </Typography>
          <Typography variant="body2">
            {tooltip.content}
          </Typography>
        </Box>
      }
      arrow
      placement={placement}
      sx={{
        '& .MuiTooltip-tooltip': {
          maxWidth: 300,
          fontSize: '0.875rem',
        }
      }}
    >
      {children}
    </Tooltip>
  );
}

AnalyticsTooltip.propTypes = {
  tooltipKey: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  placement: PropTypes.string,
}; 