// Shared types describing data returned by interval-ash-server.
//
// The backend's Resort schema is deliberately permissive (`strict: false`
// in Mongoose) because it holds a bulk-imported dataset of 1,700+ resorts
// with an inconsistent shape — only `name` is guaranteed to exist on every
// document. Everything else here is optional, and any extra fields the
// dataset happens to carry are still allowed through via the index
// signature at the bottom, so the UI never crashes on an unexpected field.

export interface Resort {
  _id: string;
  name?: string;
  resortName?: string;
  country?: string;
  region?: string | string[];
  symbol?: string;
  location?: string;
  description?: string;
  pricePerNight?: number;
  img?: string;
  img2?: string;
  img3?: string;
  img4?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  // Allows any additional, undeclared fields present on individual
  // documents in the imported dataset to pass through untouched.
  [key: string]: unknown;
}

export interface ResortPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResortSearchResult {
  resorts: Resort[];
  pagination: ResortPagination;
}

// Standard success/error envelope every interval-ash-server response uses.
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export const getResortName = (resort: Resort): string =>
  resort.resortName || resort.name || "Unnamed resort";

export const getResortImages = (resort: Resort): string[] => {
  const legacyImages = [resort.img, resort.img2, resort.img3, resort.img4];
  const images = Array.isArray(resort.images) ? resort.images : legacyImages;
  return images.filter((image): image is string => Boolean(image));
};
