import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import config from "@/config/config";
import { PERMISSIONS } from "@/const/permissions";
import { getPermission } from "@/lib/getAccessToken";
import isPermitted from "@/utilities/isPermitted";
import Link from "next/link";
import { redirect } from "next/navigation";
import WarrantyClaimTable from "./components/WarrantyClaimTable";

const AllClaimRequestPage = async () => {
  const { permissions = [] } = await getPermission();

  const manageWarrantyClaim = isPermitted(
    permissions,
    PERMISSIONS.MANAGE_WARRANTY_CLAIM
  );

  if (!manageWarrantyClaim) {
    redirect("/error");
  }

  return (
    <>
      <Card className="m-4 p-4 sm:p-6">
        <h2 className="text-2xl font-bold">Warranty Claims</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Review open requests, contact customers, and approve warranty
          replacements.
        </p>
        <hr className="my-4" />
        <div className="flex justify-end">
          <Button asChild>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={`${config.client_base_url}/warranty/find-your-product`}
            >
              Create Claim
            </Link>
          </Button>
        </div>
        <div className="mt-4">
          <WarrantyClaimTable />
        </div>
      </Card>
    </>
  );
};

export default AllClaimRequestPage;
