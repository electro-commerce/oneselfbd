"use client";

import { PERMISSIONS, TPermissionName } from "@/const/permissions";
import { ROLES } from "@/const/role";
import { useAppSelector } from "@/redux/hooks";
import isPermitted from "@/utilities/isPermitted";

export const useIsPermitted = (requiredPermission?: TPermissionName) => {
  const { profile, user, isProfileLoading } = useAppSelector(
    ({ auth }) => auth
  );
  const role = profile?.role || user?.role;
  const permissions = profile?.permissions || user?.permissions;
  const isSuperAdmin =
    role === ROLES.SUPER_ADMIN ||
    isPermitted(permissions, PERMISSIONS.SUPER_ADMIN, role);

  const permitted =
    isSuperAdmin || isPermitted(permissions, requiredPermission, role);
  return { isPermitted: permitted, isProfileLoading };
};
