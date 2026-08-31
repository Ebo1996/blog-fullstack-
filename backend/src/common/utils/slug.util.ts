import { v4 as uuidv4 } from 'uuid';

export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  // Append short unique suffix to avoid collisions
  const suffix = uuidv4().split('-')[0];
  return `${base}-${suffix}`;
}

export function generateTicketCode(): string {
  const prefix = 'EVT';
  const num = Math.floor(10000 + Math.random() * 90000);
  const uuid = uuidv4().split('-')[0].toUpperCase();
  return `${prefix}-${num}-${uuid}`;
}

export function generateOrderReference(): string {
  const prefix = 'ORD';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
