import { UserRoleEnum } from '@turon/shared';

type AppRole = UserRoleEnum | string | null | undefined;

function normalizePathname(pathname: string) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

export function normalizeRole(role: AppRole): UserRoleEnum | null {
  if (role === UserRoleEnum.CUSTOMER || role === 'CUSTOMER') {
    return UserRoleEnum.CUSTOMER;
  }

  if (role === UserRoleEnum.ADMIN || role === 'ADMIN') {
    return UserRoleEnum.ADMIN;
  }

  if (role === UserRoleEnum.COURIER || role === 'COURIER') {
    return UserRoleEnum.COURIER;
  }

  return null;
}

export function getRoleHomePath(role: AppRole) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === UserRoleEnum.ADMIN) {
    return '/admin/dashboard';
  }

  if (normalizedRole === UserRoleEnum.COURIER) {
    return '/courier/orders';
  }

  if (normalizedRole === UserRoleEnum.CUSTOMER) {
    return '/customer';
  }

  return null;
}

function getPathModule(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);

  if (normalizedPathname === '/') {
    return 'root';
  }

  if (normalizedPathname === '/admin' || normalizedPathname.startsWith('/admin/')) {
    return 'admin';
  }

  if (normalizedPathname === '/courier' || normalizedPathname.startsWith('/courier/')) {
    return 'courier';
  }

  if (normalizedPathname === '/customer' || normalizedPathname.startsWith('/customer/')) {
    return 'customer';
  }

  return null;
}

export function canRoleAccessPath(role: AppRole, pathname: string) {
  const normalizedRole = normalizeRole(role);
  const pathModule = getPathModule(pathname);

  if (!normalizedRole) {
    return false;
  }

  if (pathModule === 'root') {
    return false;
  }

  if (pathModule === null) {
    return true;
  }

  if (normalizedRole === UserRoleEnum.ADMIN) {
    return pathModule === 'admin' || pathModule === 'customer';
  }

  if (normalizedRole === UserRoleEnum.COURIER) {
    return pathModule === 'courier';
  }

  return pathModule === 'customer';
}

export function resolveRoleEntryRedirect(role: AppRole, pathname: string) {
  const normalizedRole = normalizeRole(role);
  const roleHomePath = getRoleHomePath(normalizedRole);

  if (!roleHomePath) {
    return '/';
  }

  if (!canRoleAccessPath(normalizedRole, pathname)) {
    return roleHomePath;
  }

  return null;
}
