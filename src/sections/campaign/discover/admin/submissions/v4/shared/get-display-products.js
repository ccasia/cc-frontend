// Product label shown next to a creator's name in the submissions list.
// Product seeding (from the creator's agreements) takes priority over logistics products.
export const getDisplayProducts = (campaign, userId) => {
  if (!userId) return '';

  const seedingNames = (campaign?.creatorAgreement ?? [])
    .filter((agreement) => agreement.userId === userId && agreement.isSeeding)
    .sort((a, b) => (a.round ?? 1) - (b.round ?? 1))
    .flatMap((agreement) => (agreement.productSeeding ?? []).map((product) => product.name))
    .filter(Boolean);

  if (seedingNames.length) return seedingNames.join(', ');

  const info = campaign?.logistics?.find((a) => a.creatorId === userId);
  const items = info?.deliveryDetails?.items ?? [];

  return items
    .map(({ product, quantity }) =>
      quantity > 1 ? `${product.productName} (${quantity})` : product.productName
    )
    .join(', ');
};
