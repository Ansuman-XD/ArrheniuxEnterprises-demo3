import { useQuery } from "@tanstack/react-query";
import { fetchProducts, type ProductFilters } from "@/lib/api";
import { filterProductsForSubcategory, filterBulkProducts } from "@/lib/productMappers";
import { queryKeys } from "./queryKeys";

export function useProducts(filters: ProductFilters = { status: "Active" }) {
  return useQuery({
    queryKey: queryKeys.products(filters),
    queryFn: () => fetchProducts(filters),
  });
}

export function useCatalogProducts(
  catSlug: string | undefined,
  tier: string | undefined,
  subSlug: string | undefined,
) {
  const query = useProducts({ status: "Active" });

  const products =
    catSlug && subSlug
      ? filterProductsForSubcategory(query.data ?? [], catSlug, tier, subSlug)
      : [];

  return { ...query, products };
}

export function useBulkCatalogProducts() {
  const query = useProducts({ status: "Active" });
  const products = filterBulkProducts(query.data ?? []);
  return { ...query, products };
}
