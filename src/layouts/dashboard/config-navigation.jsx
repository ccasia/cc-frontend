import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';

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
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { user } = useAuthContext();

  let items;

  // Differentiate the list of sidebar for different user role
  if (user.admin) {
    switch (user?.admin?.mode) {
      case 'god':
        items = [
          {
            items: [
              { title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard },
              { title: 'Admin', path: paths.dashboard.admins, icon: ICONS.user },
            ],
          },
          {
            subheader: 'Creator',
            items: [
              {
                title: 'Creator',
                path: paths.dashboard.creator.root,
                icon: <Iconify icon="solar:users-group-rounded-bold" />,
              },
            ],
          },
        ];

        break;
      case 'normal':
        items = [{ title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard }];
        break;
      default:
        break;
    }
  } else {
    items = [
      {
        items: [
          { title: 'Dashboard', path: paths.dashboard.root, icon: ICONS.dashboard },
          {
            title: 'Media Kit',
            path: paths.dashboard.creator.mediaKit,
            icon: <Iconify icon="flowbite:profile-card-outline" />,
          },
        ],
      },
    ];
  }

  const data = useMemo(
    () => [
      {
        subheader: 'Cult Creative',
      },

      ...items,
    ],
    [items]
  );

  return data;
}
