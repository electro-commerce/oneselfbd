"use client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useFormContext } from "react-hook-form";

const Advanced = () => {
  const {
    register,
    watch,
    control,
    formState: { errors },
  } = useFormContext();
  const warranty = watch("warranty");

  const getError = (path: string) => {
    const parts = path.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = errors;
    for (const p of parts) {
      if (current?.[p]) current = current[p];
      else return undefined;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (current as any)?.message as string | undefined;
  };

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Enable warranty coverage and set its duration and terms. Add one
        warranty or serial code per unit when processing an order.
      </p>
      <div className="flex items-center gap-3 mb-5">
        <Label
          className="w-40 cursor-help"
          htmlFor="warranty"
          title="Enable warranty information for this product."
        >
          Warranty
        </Label>
        <Controller
          name="warranty"
          control={control}
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              id="warranty"
            />
          )}
        />
      </div>
      {warranty && (
        <>
          <div className="flex flex-col items-start gap-3 mb-3 sm:flex-row sm:items-center">
            <Label
              className="w-40 cursor-help"
              htmlFor="warrantyDuration"
              title="Specify the duration of the warranty."
            >
              Warranty duration
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  id="warrantyDuration"
                  min={1}
                  step={1}
                  {...register("warrantyInfo.duration.quantity")}
                  placeholder="12"
                  className="w-24 px-2 text-center"
                />
                <Controller
                  name="warrantyInfo.duration.unit"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="w-[120px] border-border focus:border-muted-foreground/40 focus:ring-1 focus:ring-muted-foreground/20">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                          <SelectItem value="years">Years</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex gap-4">
                {getError("warrantyInfo.duration.quantity") && (
                  <p className="text-red-500 text-sm">
                    {getError("warrantyInfo.duration.quantity")}
                  </p>
                )}
                {getError("warrantyInfo.duration.unit") && (
                  <p className="text-red-500 text-sm">
                    {getError("warrantyInfo.duration.unit")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 pt-3">
            <Label
              className="w-40 mt-2 cursor-help"
              htmlFor="terms"
              title="Enter the terms and conditions of the warranty."
            >
              Terms
            </Label>
            <div className="w-full space-y-1">
              <Textarea
                placeholder="Type warranty terms here."
                {...register("warrantyInfo.terms")}
                id="terms"
                className="min-h-10 w-full border-border focus-visible:border-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-muted-foreground/20"
              />
              {getError("warrantyInfo.terms") && (
                <p className="text-red-500 text-sm">
                  {getError("warrantyInfo.terms")}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Advanced;
