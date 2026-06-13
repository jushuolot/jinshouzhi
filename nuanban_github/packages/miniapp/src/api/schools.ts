import { request } from '../utils/request';

export async function fetchSchoolCatalog() {
  const res = await request<{ list: string[] }>({
    url: '/nuanban/schools',
    method: 'GET',
  });
  return res.list ?? [];
}
