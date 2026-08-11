import { SITE_COPY } from "./site-copy.mjs";

export const HOME_CONTENT = Object.freeze({
  ...SITE_COPY.home,
  searchPlaceholder: SITE_COPY.product.searchPlaceholder,
});

export const HOME_DESTINATIONS = SITE_COPY.home.destinations;
