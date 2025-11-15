import { SAMPLE_API_RESPONSE } from '../mock/sampleProductResponse';
const useMock = true;
const BASE = 'https://catalog-management-system-dev-ak3ogf6zea.uc.a.run.app';

export async function fetchProducts({ page = 1, pageSize = 10, search = '' } = {}) {
  if (useMock) {
    await new Promise(r => setTimeout(r, 200));
    return SAMPLE_API_RESPONSE;
  }
  const body = { page: String(page), pageSize: String(pageSize), sort: { creationDateSortOption: 'DESC' } };
  if (search) body.searchTerm = search;
  const res = await fetch(`${BASE}/cms/product/v2/filter/product`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'x-internal-call': 'true' },
    body: JSON.stringify(body)
  });
  console.log("dafbdaf",res)
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
