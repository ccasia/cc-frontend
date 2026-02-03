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
  <SvgColor
    src={`/assets/icons/navbar/${name}.svg`}
    sx={{
      width: name === 'ic_overview' ? 20 : 24,
      height: name === 'ic_overview' ? 20 : 24,
      position: name === 'ic_overview' ? 'relative' : 'static',
      top: name === 'ic_overview' ? '2px' : 0,
    }}
  />
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
  settings: icon('ic_settings'),
  report: icon('ic_fund'),
  admin: icon('ic_admins'),
  creator: icon('ic_creators'),
  clients: icon('ic_clients'),
  roles: icon('ic_roles'),
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
            roles: ['superadmin', 'CSM', 'Growth', 'BD', 'CSL'],
          },
          {
            title: 'Dashboard',
            path: paths.dashboard.client,
            icon: ICONS.mycampaigns,
            roles: ['client'],
          },
        ],
      },
      {
        items: [
          {
            roles: ['superadmin', 'CSL'],
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
            roles: ['superadmin', 'CSM', 'Growth', 'BD', 'CSL'],
            title: 'Campaigns',
            path: paths.dashboard.campaign.view,
            icon: ICONS.mycampaigns,
          },
          {
            roles: ['superadmin', 'CSM'],
            title: 'Admin',
            path: paths.dashboard.admins,
            icon: ICONS.admin,
          },
          {
            roles: ['superadmin', 'CSM'],
            title: 'Creator',
            path: paths.dashboard.creator.list,
            icon: ICONS.creator,
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
            roles: ['superadmin', 'CSM', 'god', 'CSL'],
            title: 'Clients',
            path: paths.dashboard.company.discover,
            icon: ICONS.clients,
          },
          // {
          //   title: 'My Tasks',
          //   path: paths.dashboard.kanban,
          //   icon: ICONS.mytasks,
          //   roles: ['superadmin', 'CSM', 'Growth', 'BD'], // Exclude Client role
          // },
          {
            roles: ['superadmin', 'client'],
            title: 'Content Performance Report',
            path: paths.dashboard.report.root,
            icon: ICONS.report,
          },
          {
            roles: ['superadmin', 'god'],
            title: 'Roles',
            path: paths.dashboard.roles.root,
            icon: ICONS.roles,
          },
          {
            roles: ['superadmin', 'god'],
            title: 'Packages',
            path: paths.dashboard.packages.root,
            icon: <Iconify icon="carbon:package" width={25} />,
          },
          {
            roles: ['superadmin', 'god'],
            title: 'Credit Tier',
            path: paths.dashboard.creditTier.root,
            icon: <Iconify icon="mdi:account-star-outline" width={25} />,
          },
        ],
      },

      {
        items: [
          {
            roles: ['superadmin', 'god'],
            title: 'Invoices',
            path: paths.dashboard.finance.invoice,
            icon: <Iconify icon="iconamoon:invoice" width={25} />,
          },
        ],
      },
    ],
    [unreadMessageCount]
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

          ,
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

  // CS Lead navigations - adminNavigations without calendar and chats
  const csLeadNavigations = useMemo(() => adminNavigations, [adminNavigations]);

  // // add finance naviagation
  const navigations = useMemo(
    // roles => "god" , "normal", "designation", "admin", "creator"
    // user?.role === 'creator' ? creatorNavigations : adminNavigations,
    // eslint-disable-next-line no-nested-ternary
    () => {
      if (user?.role === 'creator') {
        return creatorNavigations;
      }
      if (user?.role === 'client') {
        return adminNavigations;
      }
      if (user?.role === 'admin' && user?.admin?.role?.name === 'Finance') {
        return financeNavigations;
      }
      if (user?.admin?.role?.name === 'CSM') {
        return adminNavigations;
      }
      if (user?.admin?.role?.name === 'CSL') {
        return csLeadNavigations;
      }

      if (user?.role === 'superadmin') {
        return [
          ...adminNavigations,
          // {
          //   items: [
          //     {
          //       title: 'Invoices',
          //       path: paths.dashboard.finance.invoice,
          //       icon: <Iconify icon="iconamoon:invoice" width={25} />,
          //     },
          //   ],
          // },
        ];
      }

      return [];
    },

    [adminNavigations, creatorNavigations, user, financeNavigations, csLeadNavigations]
  );

  const data = useMemo(() => {
    const baseData = [...navigations];

    // CS Lead should not have access to calendar and chats
    if (user?.admin?.role?.name !== 'CSL') {
      baseData.push({
        items:
          user?.role === 'client'
            ? [
                {
                  title: (
                    <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                      Calendar
                    </span>
                  ),
                  path: paths.dashboard.calendar.root,
                  icon: ICONS.calendar,
                },
              ]
            : [
                // {
                //   title: (
                //     <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                //       Chats
                //     </span>
                //   ),
                //   path: paths.dashboard.chat.root,
                //   icon: ICONS.chat,
                //   msgcounter: unreadMessageCount > 0 ? unreadMessageCount : null,
                // },
                // {
                //   title: (
                //     <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
                //       Calendar
                //     </span>
                //   ),
                //   path: paths.dashboard.calendar.root,
                //   icon: ICONS.calendar,
                // },
              ],
      });
    }

    baseData.push({
      items: [
        {
          title: (
            <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
              FAQ
            </span>
          ),
          path: paths.dashboard.faq,
          icon: <Iconify icon="material-symbols:help-outline" width={25} />,
        },
        {
          title: (
            <span style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '0px' }}>
              Settings
            </span>
          ),
          path: paths.dashboard.user.profile,
          icon: ICONS.settings,
        },
      ],
    });

    return baseData;
  }, [navigations, unreadMessageCount, user?.admin?.role?.name, user?.role]);

  return data;
}
