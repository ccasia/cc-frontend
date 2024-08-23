export const adminRolePermission = {
  role: 'Finance',
  permissions: [
    {
      module: 'invoice',
      permissions: ['view_invoice', 'create_invoice', 'update_invoice', 'delete_invoice'],
    },
    {
      module: 'campaign',
      permissions: ['view_agreement'],
    },
  ],
};
