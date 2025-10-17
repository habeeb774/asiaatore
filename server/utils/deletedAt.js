import { HAS_DELETED_AT } from '../db/features.js';

// applyDeletedAt adds a deletedAt: null filter to a `where` object if the DB supports it.
export function applyDeletedAt(where) {
  if (!where || typeof where !== 'object') return where;
  // If the DB supports deletedAt, return an augmented where clause that
  // filters out soft-deleted rows by requiring deletedAt: null.
  if (HAS_DELETED_AT) return { ...where, deletedAt: null };
  // DB does not have deletedAt field; return where unchanged.
  return where;
}

// For convenience, a function that returns `where` augmented with deletedAt: null
// only when the feature flag is true.
export function whereWithDeletedAt(where = {}) {
  if (HAS_DELETED_AT) return { ...where, deletedAt: null };
  return where;
}
