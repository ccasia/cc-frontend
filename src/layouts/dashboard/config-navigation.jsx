import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';
import { useTotalUnreadCount } from 'src/api/chat';

import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat'),
  mail: icon('ic_mail'),
  user: icon('ic_user'),
  file: icon('ic_file'),
  lock: icon('ic_lock'),
  tour: icon('ic_tour'),
  order: icon('ic_order'),
  label: icon('ic_label'),
  blank: icon('ic_blank'),
  kanban: icon('ic_kanban'),
  folder: icon('ic_folder'),
  banking: icon('ic_banking'),
  booking: icon('ic_booking'),
  invoice: icon('ic_invoice'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
  // calendar: icon('lets-icons:calendar-duotone'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { user } = useAuthContext();
  const { unreadCount } = useTotalUnreadCount();

  console.log("Unread count from useNavData:", unreadCount);
  //  console.log("Message counter in NavItem:", msgcounter);
  
  const adminNavigations = useMemo(
    () => [
      {
        items: [
          {
            title: 'Dashboard',
            path: paths.dashboard.root,
            icon: ICONS.dashboard,
          },
        ],
      },
      {
        subheader: 'Management',
        items: [
          {
            roles: ['superadmin', 'CSM'],
            title: 'Admin',
            path: paths.dashboard.admins,
            icon: ICONS.user,
            children: [
              {
                title: 'Lists',
                path: paths.dashboard.admins,
              },
            ],
          },
          {
            roles: ['superadmin', 'CSM'],
            title: 'Creator',
            path: paths.dashboard.creator.root,
            icon: <Iconify icon="solar:users-group-rounded-bold" width={25} />,
            children: [
              {
                title: 'List',
                path: paths.dashboard.creator.list,
              },
              {
                title: 'Media Kits',
                path: paths.dashboard.creator.mediaKitLists,
              },
            ],
          },
          {
            roles: ['superadmin'],
            title: 'Landing pages',
            path: paths.dashboard.landing.creator,
            icon: <Iconify icon="fluent:people-team-28-regular" width={25} />,
            children: [
              {
                title: 'Creator list',
                path: paths.dashboard.landing.creator,
              },
              {
                title: 'Client list',
                path: paths.dashboard.landing.brand,
              },
            ],
          },
          {
            roles: ['superadmin', 'CSM'],
            title: 'Clients',
            path: paths.dashboard.company.root,
            icon: <Iconify icon="mdi:company" width={25} />,
            children: [
              {
                title: 'List',
                path: paths.dashboard.company.discover,
              },
              {
                title: 'Create',
                path: paths.dashboard.company.create,
              },
            ],
          },
          {
            roles: ['superadmin', 'CSM', 'Growth', 'BD'],
            title: 'Campaign',
            path: paths.dashboard.campaign.root,
            icon: <Iconify icon="material-symbols:explore-outline" width={25} />,
            children: [
              {
                title: 'Manage Campaign',
                path: paths.dashboard.campaign.view,
              },
              {
                roles: ['superadmin', 'CSM'],
                title: 'Create Campaign',
                path: paths.dashboard.campaign.create,
              },
              {
                roles: ['superadmin', 'CSM'],
                title: 'Edit Campaign',
                path: paths.dashboard.campaign.manage,
              },
              {
                roles: ['superadmin'],
                title: 'Settings',
                path: paths.dashboard.campaign.settings,
              },
            ],
          },
          // {
          //   roles: ['creator'],
          //   title: 'Media Kit',
          //   path: paths.dashboard.creator.mediaKitCreator,
          //   icon: <Iconify icon="flowbite:profile-card-outline" width={25} />,
          // },
          {
            roles: ['superadmin', 'CSM'],
            title: 'My Tasks',
            path: paths.dashboard.creator.mediaKitCreator,
            icon: <Iconify icon="hugeicons:task-01" width={25} />,
          },
        ],
      },
    ],
    []
  );

  const creatorNavigations = useMemo(
    () => [
      {
        items: [
          {
            title: 'Discover',
            path: paths.dashboard.campaign.view,
            icon: <Iconify icon="iconamoon:discover" width={25} />,
          },
          {
            title: 'My Campaigns',
            path: paths.dashboard.campaign.creator.manage,
            icon: <Iconify icon="material-symbols:assignment" width={25} />,
          },
          {
            title: 'Media Kit',
            path: paths.dashboard.creator.mediaKitCreator,
            icon: <Iconify icon="flowbite:profile-card-outline" width={25} />,
          },
        ],
      },
    ],
    []
  );

  const navigations = useMemo(
    () => (user?.role === 'creator' ? creatorNavigations : adminNavigations),

    [adminNavigations, creatorNavigations, user]
  );

  const data = useMemo(
    () => [
      {
        subheader: 'Cult Creative',
      },
      ...navigations,
      {
        items: [
          {
            title: 'Calendar',
            path: paths.dashboard.calendar.root,
            icon: ICONS.calendar,
          },
          {
            title: 'Chat',
            path: paths.dashboard.chat.root,
            icon: ICONS.chat,
            msgcounter: unreadCount > 0 ? unreadCount : undefined,
          },
        ],
      },
    ],

    [navigations, unreadCount]
  );

  return data;
}
