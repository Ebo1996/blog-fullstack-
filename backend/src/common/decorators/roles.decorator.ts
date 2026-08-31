import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ATTENDEE = 'attendee',
  ORGANIZER = 'organizer',
  ADMIN = 'admin',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
