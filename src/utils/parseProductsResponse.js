export function parseProductsResponse(apiResponse) {
  if (!apiResponse || !apiResponse.data) return { products: [], meta: {} };
  const meta = apiResponse.data;
  const products = Array.isArray(meta.data) ? meta.data : [];
  return {
    products,
    meta: {
      totalRecords: Number(meta.totalRecords ?? 0),
      totalPages: Number(meta.totalPages ?? 0),
      currentPage: Number(meta.currentPage ?? 0),
      pageSize: Number(meta.pageSize ?? 0)
    }
  };
}
