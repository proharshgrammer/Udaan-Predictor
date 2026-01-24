const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  login: async (username, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  predict: async (params) => {
    const res = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  uploadCSV: async (file, counsellingTypeId, token) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('counselling_type_id', counsellingTypeId);

    const res = await fetch(`${API_URL}/data/upload`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}` 
        // Content-Type is set automatically for FormData
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  getHistory: async (token) => {
    const res = await fetch(`${API_URL}/data/history`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  deleteHistory: async (id, token) => {
    const res = await fetch(`${API_URL}/data/history/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  },

  getCounsellingTypes: async (token) => {
    const res = await fetch(`${API_URL}/data/counselling-types`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  }
};
