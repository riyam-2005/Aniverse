/**
 * A tiny neutral-gray SVG blur, inlined so there's no extra network
 * request for the placeholder itself — shown while a poster image loads
 * so grids/carousels never flash bare background color. Shared across
 * every poster-image component instead of redefined per-file.
 */
export const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIzNiI+PHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjM2IiBmaWxsPSIjMWExYTIyIi8+PC9zdmc+";
