"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SearchInput from "~/app/components/ui/search-input";

type LiveSearchInputProps = {
  defaultValue: string;
  placeholder: string;
  queryParam?: string;
  resetPageParam?: string;
  clearParamsOnChange?: string[];
  debounceMs?: number;
  className?: string;
};

export default function LiveSearchInput({
  defaultValue,
  placeholder,
  queryParam = "q",
  resetPageParam = "page",
  clearParamsOnChange = [],
  debounceMs = 300,
  className,
}: LiveSearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const changedByUser = useRef(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!changedByUser.current) return;

    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const nextQ = value.trim();

      if (nextQ) {
        params.set(queryParam, nextQ);
      } else {
        params.delete(queryParam);
      }

      if (resetPageParam) {
        params.delete(resetPageParam);
      }

      for (const key of clearParamsOnChange) {
        params.delete(key);
      }

      const current = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      const next = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      if (next !== current) {
        router.replace(next, { scroll: false });
      }
    }, debounceMs);

    return () => clearTimeout(handle);
  }, [
    clearParamsOnChange,
    debounceMs,
    pathname,
    queryParam,
    resetPageParam,
    router,
    searchParams,
    value,
  ]);

  return (
    <SearchInput
      name={queryParam}
      value={value}
      placeholder={placeholder}
      className={className}
      onChange={(event) => {
        changedByUser.current = true;
        setValue(event.target.value);
      }}
    />
  );
}
