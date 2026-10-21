import { PERMISSIONS } from "../const/permission.const";
import { ROLES } from "../modules/userManagement/user/user.const";

const isPermitted = (
  permissions?: ({ _id?: string; name: string } | string)[],
  requiredPermission?: string,
  role?: string
) => {
  if (role === ROLES.SUPER_ADMIN) {
    return true;
  }
  const neededPermission = requiredPermission
    ? requiredPermission
    : PERMISSIONS.SUPER_ADMIN;
  if (permissions?.length) {
    return permissions.some((p) => {
      const name = typeof p === "string" ? p : p?.name;
      return name === PERMISSIONS.SUPER_ADMIN || name === neededPermission;
    });
  }
  return false;
};

export default isPermitted;
