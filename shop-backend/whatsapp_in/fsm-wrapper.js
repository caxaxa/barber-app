export function buildContext(shopId, configDoc, workers) {
  return {
    shop_id: shopId,
    accountType: (workers.length > 1 ? 'enterprise' : 'individual'),
    workers,
    config: configDoc,
    step: 0
  };
}
