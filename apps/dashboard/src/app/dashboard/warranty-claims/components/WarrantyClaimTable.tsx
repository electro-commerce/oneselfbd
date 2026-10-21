"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetWarrantyClaimRequestsQuery } from "@/redux/features/warrantyClaimRequests/warrantyClaimApi";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import columns from "./RequestsColumn";
const WarrantyClaimTable = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } =
    useGetWarrantyClaimRequestsQuery({ sort: "-createdAt", page, limit: 20 });
  const warrantyClaimRequests = data?.data || [];
  const table = useReactTable({
    data: warrantyClaimRequests,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="rounded-lg overflow-hidden">
      <Table className="min-w-[1100px]">
        <TableHeader className="bg-muted text-muted-foreground">
          {table?.getHeaderGroups()?.map((headerGroup) => (
            <TableRow key={headerGroup?.id} className="hover:bg-muted/0">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header?.id} className="text-center">
                    {header?.isPlaceholder
                      ? null
                      : flexRender(
                          header?.column?.columnDef?.header,
                          header?.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Loading warranty claims…
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Could not load warranty claims.{" "}
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try again
                </Button>
              </TableCell>
            </TableRow>
          ) : warrantyClaimRequests?.length ? (
            table?.getRowModel()?.rows?.map((row) => (
              <TableRow
                key={row?.id}
                data-state={row?.getIsSelected() && "selected"}
                className="border-b"
              >
                {row?.getVisibleCells()?.map((cell) => (
                  <TableCell key={cell?.id} className="text-center">
                    {flexRender(
                      cell?.column?.columnDef?.cell,
                      cell?.getContext()
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No claim requests found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground">
        <span>Page {page}</span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || isFetching}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching || page >= (data?.meta?.totalPage || 1)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WarrantyClaimTable;
