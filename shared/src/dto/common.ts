export type ISODate = string; // new Date().toISOString()

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
