import { API_BASE_URL } from "../constants/api";

const getToken = () => localStorage.getItem("token");

export const apiRequest = async (path, options = {}) => {
  const { headers = {}, body, ...rest } = options;
  const token = getToken();
  const fetchHeaders = { ...headers };

  if (token && !fetchHeaders.Authorization) {
    fetchHeaders.Authorization = `Bearer ${token}`;
  }

  if (body && !(body instanceof FormData) && !fetchHeaders["Content-Type"]) {
    fetchHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: fetchHeaders,
    body,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: data?.message || response.statusText,
      data,
    };
  }

  return {
    ok: true,
    status: response.status,
    data,
  };
};
