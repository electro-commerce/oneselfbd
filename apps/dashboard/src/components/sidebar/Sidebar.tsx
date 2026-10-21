"use client";

import { PERMISSIONS, TPermissionName } from "@/const/permissions";
import { ROLES } from "@/const/role";
import { useAppSelector } from "@/redux/hooks";
import isPermitted from "@/utilities/isPermitted";
import { SidebarClient } from "./SidebarClient";

export function Sidebar() {
  const profile = useAppSelector((state) => state.auth.profile);
  const user = useAppSelector((state) => state.auth.user);
  const role = profile?.role || user?.role;
  const isSuperAdminRole = role === ROLES.SUPER_ADMIN;
  const permissions = profile?.permissions || user?.permissions || [];

  const checkPerm = (perm: TPermissionName) =>
    isSuperAdminRole || isPermitted(permissions, perm, role);

  const isSuperAdmin =
    isSuperAdminRole || isPermitted(permissions, PERMISSIONS.SUPER_ADMIN, role);
  const manageProduct = checkPerm(PERMISSIONS.MANAGE_PRODUCT);
  const manageBlog = checkPerm(PERMISSIONS.MANAGE_BLOG);
  const manageOrder = checkPerm(PERMISSIONS.MANAGE_ORDER);
  const manageImgToOrder = checkPerm(PERMISSIONS.MANAGE_IMAGE_TO_ORDER);
  const manageProcessingOrder = checkPerm(PERMISSIONS.MANAGE_PROCESSING_ORDER);
  const manageShipmentOrder = checkPerm(PERMISSIONS.MANAGE_SHIPMENT_ORDER);
  const manageAdminOrStaff = checkPerm(PERMISSIONS.MANAGE_ADMIN_OR_STAFF);
  const manageWarrantyClaim = checkPerm(PERMISSIONS.MANAGE_WARRANTY_CLAIM);
  const manageCoupon = checkPerm(PERMISSIONS.MANAGE_COUPON);
  const manageShippingCharge = checkPerm(PERMISSIONS.MANAGE_SHIPPING_CHARGE);
  const manageCustomer = checkPerm(PERMISSIONS.MANAGE_CUSTOMER);
  const managePaymentMethod = checkPerm(PERMISSIONS.MANAGE_PAYMENT_METHOD);
  const manageCourier = checkPerm(PERMISSIONS.MANAGE_COURIER);
  const sendSMS = checkPerm(PERMISSIONS.MANAGE_SMS);

  const permissionsObj = {
    isSuperAdmin,
    manageProduct,
    manageBlog,
    manageOrder,
    manageImgToOrder,
    manageProcessingOrder,
    manageShipmentOrder,
    manageAdminOrStaff,
    manageWarrantyClaim,
    manageCoupon,
    manageShippingCharge,
    manageCustomer,
    managePaymentMethod,
    manageCourier,
    sendSMS,
  };

  return <SidebarClient permissions={permissionsObj} />;
}
