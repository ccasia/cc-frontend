import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import DashboardLayout from 'src/layouts/dashboard';
import { AuthGuard, RoleBasedGuard } from 'src/auth/guard';

import { LoadingScreen } from 'src/components/loading-screen';

import { ChatView } from 'src/sections/chat/view';
import { CalendarView } from 'src/sections/calendar/view';
import ReportingView from 'src/sections/report/view/reporting-view';

// Import the client dashboard directly without lazy loading to avoid issues
import ClientDashboard from '../../sections/client/dashboard-client';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard/one'));
const ProfilePage = lazy(() => import('src/pages/dashboard/profile'));
const ManagersPage = lazy(() => import('src/pages/dashboard/admin'));
const CreatorList = lazy(() => import('src/pages/dashboard/creator/list'));
const CreatorMediaKit = lazy(() => import('src/pages/dashboard/creator/mediaKit'));
const MeditKitsCards = lazy(() => import('src/pages/dashboard/creator/mediaKitCards'));
const InvoiceCreator = lazy(() => import('src/pages/dashboard/creator/invoice'));
const CreatorInbox = lazy(() => import('src/pages/dashboard/creator/inbox'));

// APP
const KanbanPage = lazy(() => import('src/pages/dashboard/kanban'));

// Analytics
const AnalyticsView = lazy(() => import('src/sections/analytics/view/analytic-view'));

// Campaign
const ManageCampaign = lazy(() => import('src/pages/dashboard/campaign/manageCampaign'));
const CreateCampaign = lazy(() => import('src/pages/dashboard/campaign/createCampaign'));
const CampaignSetting = lazy(() => import('src/pages/dashboard/campaign/setting'));
const CampaignDetails = lazy(() => import('src/pages/dashboard/campaign/details'));
const ViewCampaign = lazy(() => import('src/pages/dashboard/campaign/campaign-view'));
const AdminCampaignDetail = lazy(
  () => import('src/pages/dashboard/campaign/admin/campaign-details')
);
const AdminCamapaignView = lazy(
  () => import('src/pages/dashboard/campaign/admin/campaign-detail-manage')
);
const AdminEditCampaignView = lazy(
  () => import('src/pages/dashboard/campaign/admin/campaign-edit-view')
);
const CampaignPitchDetail = lazy(
  () => import('src/pages/dashboard/campaign/admin/pitch/campaign-pitch-detail')
);
const CreatorManageCampaign = lazy(
  () => import('src/pages/dashboard/campaign/creator/manage-campaign')
);
const CampaignManageCreatorView = lazy(
  () => import('src/pages/dashboard/campaign/admin/creator/campaign-manage-creator')
);
const CampaignDetailPitchSmall = lazy(
  () => import('src/pages/dashboard/campaign/admin/pitch/campaign-pitch-content-small')
);
const ManageCampaignDetailView = lazy(
  () => import('src/pages/dashboard/campaign/creator/manage-campaign-detail')
);

// Brand & Company
const BrandManage = lazy(() => import('src/pages/dashboard/brand/manageBrand'));
const BrandCreate = lazy(() => import('src/pages/dashboard/brand/createBrand'));
const BrandDiscover = lazy(() => import('src/pages/dashboard/brand/discoverBrand'));
const CompanyDetails = lazy(() => import('src/pages/dashboard/brand/company-details'));
const CompanyEdit = lazy(() => import('src/pages/dashboard/brand/company-edit'));
const BrandDetails = lazy(() => import('src/pages/dashboard/brand/brand-details'));
const BrandEdit = lazy(() => import('src/pages/dashboard/brand/brand-edit'));

// Landing Page temporary
const CreatorLists = lazy(() => import('src/pages/dashboard/landing/creator'));
const BrandLists = lazy(() => import('src/pages/dashboard/landing/brand'));

// Finance
const CampaignPage = lazy(() => import('src/pages/dashboard/finance/invoice'));
const FinanceDiscover = lazy(() => import('src/pages/dashboard/finance/discover'));
const CreatorSelection = lazy(() => import('src/pages/dashboard/finance/creatorList'));
const InvoicePage = lazy(() => import('src/pages/dashboard/finance/invoiceDetails'));
const CreateInvoice = lazy(() => import('src/pages/dashboard/finance/createInvoice'));

const AdminTaskPage = lazy(() => import('src/pages/dashboard/admin/tasks'));

// Performance report
const Report = lazy(() => import('src/pages/dashboard/report/report'));
const ReportView = lazy(() => import('src/sections/report/view/reporting-view'));

// Roles
const Roles = lazy(() => import('src/pages/dashboard/roles/roles'));
const ManageRole = lazy(() => import('src/pages/dashboard/roles/manage-role'));

// Template Temp
const Template = lazy(() => import('src/pages/dashboard/template/view'));

const Overview = lazy(() => import('src/pages/dashboard/creator/overview'));

const InvoiceDetail = lazy(() => import('src/pages/dashboard/creator/invoice-details'));

// import the packages pages
const Packages = lazy(() => import('src/pages/dashboard/packages/packages'));

// Mobile View
const MobileModalView = lazy(
  () => import('src/sections/campaign/discover/creator/mobile-modal-view')
);

// Creator Profile
const CreatorProfile = lazy(() => import('src/pages/dashboard/creator/profile'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      {
        path: 'client',
        element: (
          <RoleBasedGuard roles={['admin', 'client']} hasContent>
            <ClientDashboard />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'admins',
        element: (
          <RoleBasedGuard roles={['superadmin', 'admin']} hasContent>
            <ManagersPage />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'user',
        children: [
          { element: <ProfilePage />, index: true },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'profile/:section', element: <ProfilePage /> },
        ],
      },
      // For admin/superadmin
      // dashboard/creator
      {
        path: 'creator',
        children: [
          {
            element: (
              <RoleBasedGuard roles={['superadmin', 'admin']} hasContent>
                <CreatorList />
              </RoleBasedGuard>
            ),
            index: true,
          },
          {
            path: 'lists',
            element: (
              <RoleBasedGuard roles={['superadmin', 'admin']} hasContent>
                <CreatorList />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'media-kits',
            children: [
              {
                element: (
                  <RoleBasedGuard roles={['superadmin', 'admin']} hasContent>
                    <MeditKitsCards />
                  </RoleBasedGuard>
                ),
                index: true,
              },
              {
                path: ':id',
                element: (
                  <RoleBasedGuard roles={['superadmin', 'admin']} hasContent>
                    <CreatorMediaKit />
                  </RoleBasedGuard>
                ),
              },
            ],
          },
          {
            path: 'profile/:id',
            element: (
              <RoleBasedGuard roles={['superadmin', 'admin']} hasContent>
                <CreatorProfile />
              </RoleBasedGuard>
            ),
          },
        ],
      },
      {
        path: 'tasks',
        element: (
          <RoleBasedGuard roles={['superadmin', 'admin']} hasContent>
            <AdminTaskPage />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'report',
        children: [
          {
            element: <Report />,
            index: true,
          },
          {
            path: 'view',
            element: <ReportingView />,
          },
        ],
      },
      // For Finance
      {
        path: 'finance',
        element: (
          <RoleBasedGuard roles={['admin']} hasContent>
            <FinanceDiscover />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'invoice',
        children: [
          {
            element: (
              <RoleBasedGuard roles={['admin', 'superadmin', 'god', 'advanced']} hasContent>
                <CampaignPage />
              </RoleBasedGuard>
            ),
            index: true,
          },
          {
            path: 'create/:id',
            element: (
              <RoleBasedGuard roles={['admin']} hasContent>
                <CreateInvoice />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'creator-list/:id',
            element: (
              <RoleBasedGuard roles={['admin']} hasContent>
                <CreatorSelection />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'detail/:id',
            element: (
              <RoleBasedGuard roles={['admin', 'superadmin', 'creator']} hasContent>
                <InvoicePage />
              </RoleBasedGuard>
            ),
          },
        ],
      },
      {
        path: 'mediakit',
        element: (
          <RoleBasedGuard roles={['creator']} hasContent>
            <CreatorMediaKit />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'landing',
        children: [
          {
            path: 'creator',
            element: <CreatorLists />,
          },
          {
            path: 'brand',
            element: <BrandLists />,
          },
        ],
      },
      {
        path: 'company',
        children: [
          {
            element: <BrandDiscover />,
            index: true,
          },
          {
            path: 'discover',
            element: (
              <RoleBasedGuard hasContent roles={['superadmin', 'admin']}>
                <BrandDiscover />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'create',
            element: (
              <RoleBasedGuard hasContent roles={['superadmin', 'admin']}>
                <BrandCreate />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'manage',
            element: (
              <RoleBasedGuard hasContent roles={['superadmin', 'admin']}>
                <BrandManage />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'edit/:id',
            element: (
              <RoleBasedGuard hasContent roles={['superadmin', 'admin']}>
                <CompanyEdit />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'details/:id',
            element: <CompanyDetails />,
          },
          {
            path: 'brand',
            children: [
              {
                index: true,
                element: <BrandDetails />,
              },
              {
                path: ':id',
                element: <BrandDetails />,
              },
              {
                path: 'edit/:id',
                element: <BrandEdit />,
              },
            ],
          },
        ],
      },
      {
        path: 'campaign',
        children: [
          {
            index: true,
            element: (
              <RoleBasedGuard hasContent roles={['admin', 'superadmin', 'creator', 'Client', 'client']}>
                <ViewCampaign />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'manage',
            children: [
              {
                index: true,
                element: (
                  <RoleBasedGuard hasContent roles={['admin', 'superadmin']}>
                    <ManageCampaign />
                  </RoleBasedGuard>
                ),
              },
              {
                path: ':id',
                element: (
                  <RoleBasedGuard hasContent roles={['admin', 'superadmin']}>
                    <AdminCamapaignView />
                  </RoleBasedGuard>
                ),
              },
              {
                path: 'edit/:id',
                element: (
                  <RoleBasedGuard hasContent roles={['admin', 'superadmin']}>
                    <AdminEditCampaignView />
                  </RoleBasedGuard>
                ),
              },
            ],
          },
          {
            path: 'create',
            element: (
              <RoleBasedGuard hasContent roles={['admin', 'superadmin', 'Client', 'client']}>
                <CreateCampaign />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'discover',
            children: [
              {
                index: true,
                element: (
                  <RoleBasedGuard hasContent roles={['admin', 'superadmin', 'creator', 'Client', 'client']}>
                    <ViewCampaign />
                  </RoleBasedGuard>
                ),
              },
              {
                path: 'detail/:id',
                children: [
                  {
                    index: true,
                    element: (
                      <RoleBasedGuard hasContent roles={['superadmin', 'admin']}>
                        <AdminCampaignDetail />
                      </RoleBasedGuard>
                    ),
                  },
                  {
                    path: 'creator/:creatorId',
                    element: (
                      <RoleBasedGuard hasContent roles={['superadmin', 'admin']}>
                        <CampaignManageCreatorView />
                      </RoleBasedGuard>
                    ),
                  },
                  {
                    path: 'pitch/:pitchId',
                    element: (
                      <RoleBasedGuard hasContent roles={['superadmin', 'admin']}>
                        <CampaignDetailPitchSmall />
                      </RoleBasedGuard>
                    ),
                  },
                ],
              },
            ],
          },
          {
            path: 'settings',
            element: (
              <RoleBasedGuard hasContent roles={['superadmin', 'CSL']}>
                <CampaignSetting />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'details/:id',
            element: (
              <RoleBasedGuard hasContent roles={['superadmin', 'admin', 'Client', 'client']}>
                <CampaignDetails />
              </RoleBasedGuard>
            ),
          },
          {
            path: 'pitch/:id',
            element: (
              <RoleBasedGuard hasContent roles={['superadmin', 'Client', 'client']}>
                <CampaignPitchDetail />
              </RoleBasedGuard>
            ),
          },
          // For creator path
          {
            path: 'VUquQR/HJUboKDBwJi71KQ==/manage',
            children: [
              {
                index: true,
                element: (
                  <RoleBasedGuard hasContent roles={['creator']}>
                    <CreatorManageCampaign />
                  </RoleBasedGuard>
                ),
              },
              {
                path: 'detail/:id',
                element: (
                  <RoleBasedGuard hasContent roles={['creator']}>
                    <ManageCampaignDetailView />
                  </RoleBasedGuard>
                ),
              },
            ],
          },
          {
            path: 'VUquQR/HJUboKDBwJi71KQ==/discover/:id',
            element: (
              <RoleBasedGuard hasContent roles={['creator']}>
                <MobileModalView />
              </RoleBasedGuard>
            ),
          },
        ],
      },
      {
        path: 'calendar',
        element: <CalendarView />,
      },
      {
        path: 'analytics',
        element: (
          <RoleBasedGuard hasContent roles={['superadmin', 'god', 'CSL']}>
            <AnalyticsView />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'chat',
        children: [
          {
            path: '',
            element: <ChatView />,
          },
          {
            path: 'thread/:id',
            element: <ChatView />,
          },
        ],
      },
      {
        path: 'inbox',
        element: (
          <RoleBasedGuard roles={['creator']} hasContent>
            <CreatorInbox />
          </RoleBasedGuard>
        ),
      },
      {
        path: 'invoiceCreator',
        children: [
          {
            index: true,
            element: (
              <RoleBasedGuard roles={['creator', 'admin']} hasContent>
                <InvoiceCreator />
              </RoleBasedGuard>
            ),
          },
          {
            path: ':invoiceId',
            element: (
              <RoleBasedGuard roles={['creator', 'admin']} hasContent>
                <InvoiceDetail />
              </RoleBasedGuard>
            ),
          },
        ],
      },
      { path: 'kanban', element: <KanbanPage /> },
      {
        path: 'roles',
        children: [
          {
            element: <Roles />,
            index: true,
          },
          {
            path: 'manage/:id',
            element: <ManageRole />,
          },
        ],
      },
      {
        path: 'packages',
        element: <Packages />,
      },
      {
        path: 'template',
        element: <Template />,
      },
      {
        path: 'overview',
        element: <Overview />,
      },
    ],
  },
];
