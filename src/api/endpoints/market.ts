import { api } from "../client";
import type { MarketPriceResponse } from "../types";

export const marketApi = {
  prices: () =>
    api.get<MarketPriceResponse[]>("/api/market-prices").then((r) => r.data),
};
