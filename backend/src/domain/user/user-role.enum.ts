/**
 * UserRole mirrors the PostgreSQL `user_role` ENUM defined in the database schema.
 * Values must stay in sync with: CREATE TYPE user_role AS ENUM ('CLIENT', 'FREELANCER', 'ADMIN')
 */
export enum UserRole {
  CLIENT = 'CLIENT',
  FREELANCER = 'FREELANCER',
  ADMIN = 'ADMIN',
}
