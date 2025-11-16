const BASE = 'https://catalog-management-system-dev-ak3ogf6zea-uc.a.run.app/cms/product/v2/filter/product';

export async function fetchProducts({ page = 1, pageSize = 10, search = '' } = {}) {
  const body = { page: String(page), pageSize: String(pageSize), sort: { creationDateSortOption: 'DESC' } };
 
  if (search) body.searchTerm = search;
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-internal-call': 'true' },
    body: JSON.stringify(body)
  });
   console.log(body)
  console.log("dafbdaf",res)
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
