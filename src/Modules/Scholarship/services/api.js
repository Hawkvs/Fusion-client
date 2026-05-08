import axios from "axios";

const API_BASE_URL = "http://localhost:8000/spacs";

// Using Option A (JWT): Add Bearer token, remove withCredentials to prevent CORS Origin * conflicts

// Add a response interceptor to handle 401 Unauthorized errors (e.g., token expiry)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Token expired or unauthorized. Redirecting to login.");
      // Optional: Clear tokens if you want to force logout
      localStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Interceptor or simple helper to attach token if needed
const getAuthHeaders = (isMultipart = false) => {
  const token =
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");
  console.log("Token:", token);
  
  const headers = {
    Authorization: `Token ${token}`,
  };
  
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  
  return { headers };
};

export const fetchMcmApplication = async () => {
  const response = await axios.post(
    `${API_BASE_URL}/mcm_show/`,
    {},
    getAuthHeaders(),
  );
  return response.data;
};

export const submitMcmApplication = async (data) => {
  const response = await axios.post(
    `${API_BASE_URL}/mcm_update/`,
    data,
    getAuthHeaders(true),
  );
  return response.data;
};

export const fetchSingleParentApplication = async () => {
  const response = await axios.post(
    `${API_BASE_URL}/single_parent_show/`,
    {},
    getAuthHeaders(),
  );
  return response.data;
};

export const submitSingleParentApplication = async (data) => {
  const response = await axios.post(
    `${API_BASE_URL}/single_parent_update/`,
    data,
    getAuthHeaders(true),
  );
  return response.data;
};

export const fetchAllMcmApplications = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/scholarship-details/?_t=${new Date().getTime()}`,
    getAuthHeaders(),
  );
  return response.data;
};

export const updateScholarshipStatus = async (id, status, remarks, scholarshipType) => {
  const isSP = String(scholarshipType || "").includes("Single");
  const endpoint = isSP ? `/single_parent/status-update/` : `/mcm/status-update/`;
  const response = await axios.post(
    `${API_BASE_URL}${endpoint}`,
    { id, status, remarks },
    getAuthHeaders(),
  );
  return response.data;
};

// Backward compatibility or other components
export const updateMcmStatus = async (id, status, remarks) => {
  return updateScholarshipStatus(id, status, remarks, "Merit Cum Means (MCM)");
};


export const fetchCatalog = async () => {
  const { headers } = getAuthHeaders();
  const response = await axios.get(`${API_BASE_URL}/create-award/?_t=${new Date().getTime()}`, { headers });
  // backend may return an array of awards
  return response.data;
};

export const updateCatalogData = async (data) => {
  const { headers } = getAuthHeaders();
  const response = await axios.post(`${API_BASE_URL}/award/`, data, { headers });
  return response.data;
};


export const fetchFrontendCatalog = async () => {
  const { headers } = getAuthHeaders();
  const response = await axios.get(
    `${API_BASE_URL}/frontend_catalog/?_t=${new Date().getTime()}`,
    { headers }
  );
  return response.data;
};

export const updateFrontendCatalog = async (data) => {
  const { headers } = getAuthHeaders(true);
  const response = await axios.post(
    `${API_BASE_URL}/frontend_catalog/`,
    data,
    { headers }
  );
  return response.data;
};

export const withdrawApplication = async (id, scholarship_type) => {
  const token = localStorage.getItem('authToken');
  const response = await axios.patch(
    `${API_BASE_URL}/applications/${id}/withdraw/`, 
    { scholarship_type }, 
    { headers: { Authorization: `Token ${token}` } }
  );
  return response.data;
};

export const fetchAwardsCatalog = async () => {
  const { headers } = getAuthHeaders();
  const response = await axios.get(`${API_BASE_URL}/awards_catalog/?_t=${new Date().getTime()}`, { headers });
  return response.data;
};


export const fetchMeritList = async () => {
  const { headers } = getAuthHeaders();
  const response = await axios.get(`${API_BASE_URL}/merit_list/?_t=${new Date().getTime()}`, { headers });
  return response.data;
};

export const updateMeritList = async (data) => {
  const { headers } = getAuthHeaders(true);
  const response = await axios.post(`${API_BASE_URL}/merit_list/`, data, { headers });
  return response.data;
};

