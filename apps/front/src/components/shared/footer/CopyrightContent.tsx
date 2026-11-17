import ContainerMax from "@/components/shared/containerMax/ContainerMax";
import { SITE } from "@/const/site.const";

const CopyrightContent = () => {
  return (
    <div className="py-4 border-t border-border">
      <ContainerMax>
        <div className="flex justify-center items-center">
          <div>
            <p className="text-foreground transition-colors text-sm font-medium text-center md:text-left">
              &copy; {new Date().getFullYear()}{" "}
              <span className="text-foreground font-bold">{SITE.nameEn}</span>। সর্বস্বত্ব সংরক্ষিত।
            </p>
          </div>
        </div>
      </ContainerMax>
    </div>
  );
};

export default CopyrightContent;
