"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import Select, { components } from "react-select";
import Image from "next/image";
import { formatImageSrc } from "@/lib/utils";

type RelatedPostOption = {
  _id: string;
  label: string;
  thumb?: string;
};

type RelatedPostValue = { value: string; label: string; thumb?: string };

export default function RelatedBlogs({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: Array<string | RelatedPostValue>;
  onChange: (val: string[]) => void;
  options: RelatedPostOption[];
}) {
  const [selected, setSelected] = useState<RelatedPostValue[]>([]);

  const keepIds = useMemo(
    () =>
      (value || []).filter((item): item is string => typeof item === "string"),
    [value]
  );
  const keepObjects = useMemo(
    () =>
      (value || []).filter(
        (item): item is RelatedPostValue =>
          typeof item === "object" && item !== null
      ),
    [value]
  );

  const blogOptions = useMemo(
    () =>
      options.map((opt) => ({
        value: opt._id,
        label: opt.label,
        thumb: opt.thumb,
      })),
    [options]
  );

  useEffect(() => {
    const hydratedFromStrings = keepIds
      .map((id) => {
        const found = blogOptions.find((o) => o.value === id);
        return found
          ? { value: found.value, label: found.label, thumb: found.thumb }
          : undefined;
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item): item is any => !!item) as RelatedPostValue[];

    const uniqueSelected = [...keepObjects, ...hydratedFromStrings].reduce<
      RelatedPostValue[]
    >((acc, item) => {
      if (!acc.some((existing) => existing.value === item.value)) {
        acc.push(item);
      }
      return acc;
    }, []);

    setSelected(uniqueSelected);
  }, [keepIds, keepObjects, blogOptions]);

  const updateSelected = (next: RelatedPostValue[]) => {
    setSelected(next);
    onChange(next.map((item) => item.value));
  };

  const remove = (valueToRemove: string) => {
    updateSelected(selected.filter((s) => s.value !== valueToRemove));
  };

  /** Custom option with image */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Option = (props: any) => (
    <components.Option {...props}>
      <div className="flex items-center gap-2 cursor-pointer">
        <Image
          src={formatImageSrc(props.data.thumb) || "/placeholder.png"}
          alt={props.data.label}
          width={32}
          height={32}
          className="h-8 w-8 rounded object-cover border"
        />
        <span>{props.data.label}</span>
      </div>
    </components.Option>
  );

  /** Custom selected value pill */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MultiValueLabel = (props: any) => (
    <components.MultiValueLabel {...props}>
      <div className="flex items-center gap-1">
        <Image
          src={formatImageSrc(props.data.thumb) || "/placeholder.png"}
          alt={props.data.label}
          width={20}
          height={20}
          className="h-5 w-5 rounded object-cover border"
        />
        <span className="truncate max-w-[150px]">{props.data.label}</span>
      </div>
    </components.MultiValueLabel>
  );

  return (
    <div className="space-y-2 text-sm font-medium w-full">
      <span>{label}</span>

      <Select<RelatedPostValue, true>
        value={selected}
        isMulti
        isSearchable
        options={blogOptions}
        placeholder="Search blogs..."
        className="react-select-container"
        classNamePrefix="react-select"
        components={{ Option, MultiValueLabel }}
        getOptionValue={(opt) => opt.value}
        getOptionLabel={(opt) => opt.label}
        onChange={(newValue) => updateSelected(Array.from(newValue))}
      />

      {selected.length > 0 && (
        <div className="space-y-3 mt-4">
          <p className="font-semibold text-sm">Selected blogs</p>
          {selected.map((p) => (
            <div
              key={p.value}
              className="flex items-center justify-between gap-3 border-b pb-2"
            >
              <div className="flex items-center gap-3">
                <Image
                  src={formatImageSrc(p.thumb) || "/placeholder.png"}
                  alt={p.label}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded object-cover border"
                />
                <span className="text-sm text-gray-400 dark:text-white">
                  {p.label}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  remove(p.value);
                }}
                type="button"
                className="cursor-pointer text-red-500 hover:text-red-600 text-lg"
              >
                <X />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
