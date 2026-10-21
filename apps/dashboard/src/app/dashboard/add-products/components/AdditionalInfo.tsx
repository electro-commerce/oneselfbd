"use client";
import SectionContentWrapper from "@/components/section-content-wrapper/SectionContentWrapper";
import dynamic from "next/dynamic";
import { Controller, useFormContext } from "react-hook-form";
// Dynamically import JoditEditor without SSR
const JoditEditor = dynamic(() => import("jodit-react"), {
  ssr: false, // Disable SSR
});

const AdditionalInfo = () => {
  const { control } = useFormContext();

  return (
    <SectionContentWrapper heading={"Product Additional Info"}>
      <Controller
        name="additionalInfo"
        control={control}
        render={({ field }) => (
          <JoditEditor
            value={field.value}
            onChange={(newContent) => field.onChange(newContent)}
          />
        )}
      />
    </SectionContentWrapper>
  );
};

export default AdditionalInfo;
