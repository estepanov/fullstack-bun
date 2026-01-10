/**
 * Shared pagination configuration.
 * Update these values to configure pagination across admin pages.
 */
export type PaginationConfig = {
  /**
   * Available page size options for user selection
   */
  pageSizeOptions: readonly number[];
  /**
   * Default page size when not specified
   */
  defaultPageSize: number;
  /**
   * Maximum allowed page size (enforced on backend)
   */
  maxPageSize: number;
};

export const PAGINATION_CONFIG: PaginationConfig = {
  pageSizeOptions: [10, 25, 50, 100] as const,
  defaultPageSize: 10,
  maxPageSize: 100,
} as const;
