import { Suspense } from "react";
import CategoryMenuBarFetcher from "./components/CategoryMenuBarFetcher";

const BottomHeader = () => (
  <div className="sticky top-0 z-50 hidden border-b border-border bg-card shadow-[0_4px_24px_-16px_rgba(9,33,67,0.3)] md:block">
    <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 lg:px-8">
      <div className="min-w-0 flex-1">
        <Suspense
          fallback={
            <div
              className="flex h-12 items-center gap-6 animate-pulse"
              aria-label="ক্যাটাগরি লোড হচ্ছে"
            >
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-3 w-16 rounded bg-muted" />
              ))}
            </div>
          }
        >
          <CategoryMenuBarFetcher />
        </Suspense>
      </div>
    </div>
  </div>
);

export default BottomHeader;
