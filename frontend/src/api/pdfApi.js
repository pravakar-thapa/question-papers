import { apiRequest } from "../utils/apiRequest";

export const fetchPDFsApi = async (filters = {}, page = 1) => {
  const params = new URLSearchParams();

  if (filters.title) params.set("title", filters.title);
  if (filters.college) params.set("college", filters.college);
  if (filters.course) params.set("course", filters.course);
  if (filters.semester) params.set("semester", filters.semester);
  if (filters.year) params.set("year", filters.year);
  if (filters.sort) params.set("sort", filters.sort);
  params.set("page", page);

  const queryString = params.toString();
  return apiRequest(`/pdfs?${queryString}`);
};

export const fetchSavedPdfsApi = async () => apiRequest("/saved-pdfs");
export const fetchMyUploadsApi = async () => apiRequest("/my-uploads");
export const fetchStatsApi = async () => apiRequest("/admin/stats");
