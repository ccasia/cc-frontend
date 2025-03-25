/* eslint-disable */
// import useSound from 'use-sound';
import { enqueueSnackbar } from 'notistack';
import { useMemo, useState, useEffect } from 'react';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';
// import { useTotalUnreadCount } from 'src/api/chat';
import useSocketContext from 'src/socket/hooks/useSocketContext';
import { useUnreadMessageCount } from 'src/context/UnreadMessageCountContext';

import Iconify from 'src/components/iconify';
import SvgColor from 'src/components/svg-color';

// import sound from '../../../public/sounds/noti.mp3';

// ----------------------------------------------------------------------

// add finance user here as well

const icon = (name) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 24, height: 24 }} />
  // OR
  // <Iconify icon="fluent:mail-24-filled" />
  // https://icon-sets.iconify.design/solar/
  // https://www.streamlinehq.com/icons
);

const ICONS = {
  job: icon('ic_job'),
  blog: icon('ic_blog'),
  chat: icon('ic_chat_new'),
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
  invoice: icon('ic_invoice_new'),
  product: icon('ic_product'),
  calendar: icon('ic_calendar_new'),
  disabled: icon('ic_disabled'),
  external: icon('ic_external'),
  menuItem: icon('ic_menu_item'),
  ecommerce: icon('ic_ecommerce'),
  analytics: icon('ic_analytics'),
  dashboard: icon('ic_dashboard'),
  overview: icon('ic_overview'),
  discover: icon('ic_discover'),
  mycampaigns: icon('ic_mycampaigns'),
  mytasks: icon('ic_mytasks'),
  mediakit: icon('ic_mediakit'),
  // calendar: icon('lets-icons:calendar-duotone'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { user } = useAuthContext();
  // const [play] = useSound(sound, {
  //   interrupt: true,
  // });

  const { socket } = useSocketContext();
  const unreadMessageCount = useUnreadMessageCount();

  useEffect(() => {
    socket?.on('messageCount', (data) => {
      //  play();
      enqueueSnackbar(`${data.count + 1} new messages from ${data.name}.`, {
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'left',
        },
      });
      // setUnreadMessageCount(data.count);
    });

    return () => {
      socket?.off('messageCount');
    };
  }, [socket]);

  const adminNavigations = useMemo(
    () => [
      {
        items: [
          {
            title: 'Overview',
            path: paths.dashboard.root,
            icon: <Iconify icon="icon-park-outline:grid-four" width={25} />,
          },
        ],
      },
      {
        items: [
          {
            title: 'Analytics',
            path: paths.dashboard.analytics,
            icon: <Iconify icon="icon-park-outline:chart-histogram" width={25} />,
          },
        ],
      },
      {
        // subheader: 'Management',
        items: [
          {
            roles: ['superadmin', 'CSM', 'Growth', 'BD'],
            title: 'Campaign',
            path: paths.dashboard.campaign.root,
            icon: <Iconify icon="material-symbols:explore-outline" width={25} />,
            children: [
              // {
              //   roles: ['superadmin', 'CSM'],
              //   title: 'Create',
              //   path: paths.dashboard.campaign.create,
              // },
              {
                roles: ['superadmin', 'CSM'],
                title: 'Edit',
                path: paths.dashboard.campaign.manage,
              },
              {
                // title: 'Manage Campaign',
                title: 'Lists',
                path: paths.dashboard.campaign.view,
              },
              {
                roles: ['superadmin'],
                title: 'Settings',
                path: paths.dashboard.campaign.settings,
              },
            ],
          },
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
          // {
          //   roles: ['superadmin'],
          //   title: 'Landing pages',
          //   path: paths.dashboard.landing.creator,
          //   icon: <Iconify icon="fluent:people-team-28-regular" width={25} />,
          //   children: [
          //     {
          //       title: 'Creator list',
          //       path: paths.dashboard.landing.creator,
          //     },
          //     {
          //       title: 'Client list',
          //       path: paths.dashboard.landing.brand,
          //     },
          //   ],
          // },
          {
            roles: ['superadmin', 'CSM', 'god'],
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
            title: 'My Tasks',
            path: paths.dashboard.kanban,
            icon: ICONS.kanban,
          },
          {
            roles: ['superadmin'],
            title: 'Roles',
            path: paths.dashboard.roles.root,
            icon: <Iconify icon="oui:app-users-roles" width={25} />,
          },
          {
            roles: ['superadmin'],
            title: 'Packages',
            path: paths.dashboard.packages.root,
            icon: <Iconify icon="carbon:package" width={25} />,
          },
          // {
          //   title: 'Template',
          //   path: paths.dashboard.template.root,
          //   icon: <Iconify icon="hugeicons:task-01" width={25} />,
          // },
          // {
          //   roles: ['superadmin', 'CSM'],
          //   title: 'My Tasks',
          //   path: paths.dashboard.user.myTasks,
          //   icon: <Iconify icon="hugeicons:task-01" width={25} />,
          // },
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
            title: (
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                Overview
              </span>
            ),
            path: paths.dashboard.overview.root,
            icon: ICONS.overview,
          },
        ],
      },
      {
        items: [
          {
            title: (
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                Discover
              </span>
            ),
            path: paths.dashboard.campaign.view,
            icon: ICONS.discover,
          },
          {
            title: (
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                My Campaigns
              </span>
            ),
            path: paths.dashboard.campaign.creator.manage,
            icon: ICONS.mycampaigns,
          },
          {
            title: (
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                My Tasks
              </span>
            ),
            path: paths.dashboard.kanban,
            icon: ICONS.mytasks,
          },
          {
            title: (
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                Media Kit
              </span>
            ),
            path: paths.dashboard.creator.mediaKitCreator,
            icon: ICONS.mediakit,
          },
          {
            title: (
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                Invoice
              </span>
            ),
            path: paths.dashboard.creator.invoiceCreator,
            icon: ICONS.invoice,
          },
          // {
          //   title: 'Inbox',
          //   path: paths.dashboard.creator.inbox,
          //   icon: <Iconify icon="material-symbols:inbox" width={25} />,
          // },
        ],
      },
    ],
    []
  );

  const financeNavigations = useMemo(
    () => [
      {
        items: [
          {
            title: 'Overview',
            path: paths.dashboard.finance.root,
            icon: <Iconify icon="icon-park-outline:grid-four" width={25} />,
          },
        ],
      },
      {
        items: [
          {
            title: 'Campaign',
            path: paths.dashboard.campaign.view,
            icon: <Iconify icon="iconamoon:discover" width={25} />,
          },
          {
            title: 'Invoices',
            path: paths.dashboard.finance.invoice,
            icon: <Iconify icon="iconamoon:invoice" width={25} />,
          },
        ],
      },
    ],
    []
  );

  // add finance naviagation
  const navigations = useMemo(
    // roles => "god" , "normal", "designation", "admin", "creator"
    // user?.role === 'creator' ? creatorNavigations : adminNavigations,
    // eslint-disable-next-line no-nested-ternary
    () => {
      if (user?.role === 'creator') {
        return creatorNavigations;
      }
      if (user?.role === 'admin' && user?.admin?.role?.name === 'Finance') {
        return financeNavigations;
      }
      if (user?.admin?.role?.name === 'CSM') {
        return adminNavigations;
      }

      if (user?.role === 'superadmin') {
        return [
          ...adminNavigations,
          {
            items: [
              {
                title: 'Invoices',
                path: paths.dashboard.finance.invoice,
                icon: <Iconify icon="iconamoon:invoice" width={25} />,
              },
            ],
          },
        ];
      }

      return [];
    },
    // user?.role === 'creator' || user?.role === 'finance'
    //   ? user?.role === 'finance'
    //     ? financeNavigations
    //     : creatorNavigations
    //   : adminNavigations,
    // () => (user?.role === 'creator' ? creatorNavigations : adminNavigations),
    [adminNavigations, creatorNavigations, user, financeNavigations]
  );

  const data = useMemo(
    () => [
      // {
      //   items: [
      //     {
      //       title: 'Overview',
      //       path: paths.dashboard.overview.root,
      //       icon: <Iconify icon="icon-park-outline:grid-four" width={25} />,
      //     },
      //   ],
      // },

      ...navigations,
      {
        items: [
          {
            title: (
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>Chats</span>
            ),
            path: paths.dashboard.chat.root,
            icon: ICONS.chat,
            msgcounter: unreadMessageCount > 0 ? unreadMessageCount : null,
          },
          {
            title: (
              <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                Calendar
              </span>
            ),
            path: paths.dashboard.calendar.root,
            icon: ICONS.calendar,
          },
        ],
      },
    ],
    [navigations, unreadMessageCount]
  );

  return data;
}
