import { PERMISSIONS, TPermissionName } from "@/const/permissions";
import { ROLES, TRole } from "@/const/role";

export type TPermission = { _id?: string; name: string } | string;

const isPermitted = (
  permissions?: (TPermission | string)[],
  requiredPermission?: TPermissionName,
  role?: TRole | string
) => {
  if (role === ROLES.SUPER_ADMIN) {
    return true;
  }

  const neededPermission = requiredPermission
    ? requiredPermission
    : PERMISSIONS.SUPER_ADMIN;

  if (permissions?.length) {
    return (
      permissions.some((p) => {
        const name = typeof p === "string" ? p : p?.name;
        return name === PERMISSIONS.SUPER_ADMIN;
      }) ||
      permissions.some((p) => {
        const name = typeof p === "string" ? p : p?.name;
        return name === neededPermission;
      })
    );
  }
  return false;
};

export default isPermitted;
