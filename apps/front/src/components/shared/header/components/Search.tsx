"use client";

import { Button } from "@/components/ui/button";
import eventHandler from "@/tracking/eventHandler";
import { useDebounce } from "@/hooks/useDebounce";
import { getImageSrc } from "@/lib/utils";
import { ApiResponse } from "@/redux/features/searchProduct/interface";
import { useFindSearchProductQuery } from "@/redux/features/searchProduct/searchProuctApi";
import { TProduct } from "@/types/products/product";
import { TVariableProduct } from "@/types/products/variableProduct";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

/* -------------------- type guards -------------------- */
const isVariableProduct = (
  product: TProduct | TVariableProduct
): product is TVariableProduct => product.type === "variable";

const isApiResponse = (response: unknown): response is ApiResponse => {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    "data" in response
  );
};

const Search = ({
  autoFocus = false,
  onNavigate,
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
}) => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebounce(searchValue, 400);

  const [showSuggestions, setShowSuggestions] = useState(true);

  const { data, isLoading, isError } = useFindSearchProductQuery<ApiResponse>(
    debouncedSearchValue,
    {
      skip: !debouncedSearchValue.trim(),
    }
  );

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchValue.trim()) {
      eventHandler({
        event_name: "search",
        search_string: searchValue.trim(),
      });
    }
    router.push(`/shop?search=${encodeURIComponent(searchValue)}`);
    setShowSuggestions(false);
    onNavigate?.();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleProductClick = (slug: string) => {
    router.push(`/product/${slug}`);
    setShowSuggestions(false);
    onNavigate?.();
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setShowSuggestions(false);
  };

  const products: (TProduct | TVariableProduct)[] = isApiResponse(data)
    ? data.data
    : [];

  return (
    <form
      onSubmit={handleSearchSubmit}
      role="search"
      className="relative text-foreground"
    >
      <div className="flex items-center w-full relative group">
        <input
          autoFocus={autoFocus}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          placeholder="পছন্দের পণ্য খুঁজুন..."
          className="w-full h-9 md:h-12 pl-3 md:pl-4 pr-20 md:pr-24 text-xs md:text-sm outline-none border border-border bg-muted/60 text-foreground rounded-lg md:rounded-xl focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors placeholder:text-muted-foreground"
          aria-label="পণ্য সার্চ করুন"
        />

        {searchValue && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-9 md:right-12 flex size-8 md:size-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="সার্চ ক্লিয়ার করুন"
          >
            <FaTimes className="size-3" />
          </button>
        )}

        <Button
          type="submit"
          variant="ghost"
          className="absolute right-1 top-1/2 -translate-y-1/2 size-7 md:size-10 rounded-md md:rounded-lg flex items-center justify-center bg-[#092143] text-white hover:bg-[#163c69] transition-colors p-0"
          aria-label="সার্চ করুন"
        >
          <FaSearch className="text-[11px] md:text-[13px]" />
        </Button>
      </div>

      {showSuggestions && debouncedSearchValue.trim() !== "" && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-lg shadow-lg z-[100] max-h-[400px] overflow-y-auto">
          {isLoading && <p className="p-3 text-sm">লোড হচ্ছে...</p>}

          {!isLoading && !isError && products.length > 0
            ? products.map((product) => {
                const isVariable = isVariableProduct(product);

                const regularPrice = isVariable
                  ? product.minRegularPrice
                  : product.regularPrice;

                const salePrice = isVariable
                  ? product.minSalePrice || null
                  : product.salePrice || null;

                return (
                  <div
                    key={product._id}
                    className="flex items-center gap-2 p-2 border-b last:border-0 cursor-pointer hover:bg-muted"
                    onClick={() => handleProductClick(product.slug)}
                  >
                    <Image
                      width={55}
                      height={55}
                      src={getImageSrc(
                        product?.thumbnail?.src || product?.image?.src
                      )}
                      alt={
                        product?.thumbnail?.alt ||
                        product?.image?.alt ||
                        product?.title ||
                        ""
                      }
                      className="rounded"
                    />

                    <div className="flex-1">
                      <p className="text-sm font-semibold line-clamp-1">
                        {product.title}
                      </p>

                      <div className="text-sm">
                        {salePrice ? (
                          <>
                            {!isVariable && (
                              <span className="text-xs text-primary/60 line-through mr-1">
                                &#2547;{regularPrice}
                              </span>
                            )}
                            <span className="font-bold">
                              &#2547;{salePrice}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold">
                            &#2547;{regularPrice}
                          </span>
                        )}

                        {isVariable && (
                          <span className="ml-1 font-bold">
                            – &#2547;{product.maxRegularPrice}
                          </span>
                        )}
                      </div>

                      {isVariable && (
                        <p className="text-[11px] text-primary">
                          একাধিক অপশন রয়েছে
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            : !isLoading && (
                <p className="p-3 text-sm text-primary/70">
                  কোনো পণ্য খুঁজে পাওয়া যায়নি
                </p>
              )}
        </div>
      )}
    </form>
  );
};

export default Search;
