/**
 * Badminton Ranking API Client
 *
 * This file provides a clean interface to communicate with the backend API.
 * Include this file in your HTML before app.js:
 * <script src="api-client.js"></script>
 * <script src="app.js"></script>
 */

// API Configuration
const API_CONFIG = {
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
};

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'badminton_token',
  USER: 'badminton_user'
};

/**
 * API Client class
 */
class APIClient {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.token = this.getToken();
  }

  // ========== Auth Methods ==========

  /**
   * Register a new user
   */
  async register(username, password, nickname, email) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname, email })
    });
    return response;
  }

  /**
   * Login
   */
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (response.success) {
      this.setToken(response.data.token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
    }
    return response;
  }

  /**
   * Logout
   */
  logout() {
    this.removeToken();
    localStorage.removeItem(STORAGE_KEYS.USER);
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    return await this.request('/auth/me');
  }

  /**
   * Update profile
   */
  async updateProfile(nickname, email) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ nickname, email })
    });
  }

  /**
   * Upload avatar
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    return await this.request('/auth/avatar', {
      method: 'POST',
      body: formData,
      useAuthHeader: false // Don't set Content-Type for FormData
    });
  }

  // ========== Player Methods ==========

  /**
   * Get all players
   */
  async getPlayers(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.play_type) queryParams.append('play_type', filters.play_type);
    if (filters.user_id) queryParams.append('user_id', filters.user_id);

    const query = queryParams.toString();
    return await this.request(`/players${query ? '?' + query : ''}`);
  }

  /**
   * Get player by ID
   */
  async getPlayer(id) {
    return await this.request(`/players/${id}`);
  }

  /**
   * Create player
   */
  async createPlayer(player) {
    return await this.request('/players', {
      method: 'POST',
      body: JSON.stringify(player)
    });
  }

  /**
   * Update player
   */
  async updatePlayer(id, player) {
    return await this.request(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(player)
    });
  }

  /**
   * Delete player
   */
  async deletePlayer(id) {
    return await this.request(`/players/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get player stats
   */
  async getPlayerStats(id) {
    return await this.request(`/players/${id}/stats`);
  }

  /**
   * Get player matches
   */
  async getPlayerMatches(id, limit = 20) {
    return await this.request(`/players/${id}/matches?limit=${limit}`);
  }

  // ========== Match Methods ==========

  /**
   * Get all matches
   */
  async getMatches(filters = {}) {
    const queryParams = new URLSearchParams();
    if (filters.type) queryParams.append('type', filters.type);
    if (filters.start_date) queryParams.append('start_date', filters.start_date);
    if (filters.end_date) queryParams.append('end_date', filters.end_date);
    if (filters.player_id) queryParams.append('player_id', filters.player_id);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const query = queryParams.toString();
    return await this.request(`/matches${query ? '?' + query : ''}`);
  }

  /**
   * Get match by ID
   */
  async getMatch(id) {
    return await this.request(`/matches/${id}`);
  }

  /**
   * Get matches by date
   */
  async getMatchesByDate(date) {
    return await this.request(`/matches/date/${date}`);
  }

  /**
   * Create match
   */
  async createMatch(match) {
    return await this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(match)
    });
  }

  /**
   * Delete match
   */
  async deleteMatch(id) {
    return await this.request(`/matches/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Batch delete matches
   */
  async batchDeleteMatches(ids) {
    return await this.request('/matches/batch', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    });
  }

  // ========== Leaderboard Methods ==========

  /**
   * Get singles leaderboard
   */
  async getSinglesLeaderboard(limit, play_type) {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit);
    if (play_type) queryParams.append('play_type', play_type);

    const query = queryParams.toString();
    return await this.request(`/leaderboard/singles${query ? '?' + query : ''}`);
  }

  /**
   * Get doubles leaderboard
   */
  async getDoublesLeaderboard(limit) {
    const query = limit ? `?limit=${limit}` : '';
    return await this.request(`/leaderboard/doubles${query}`);
  }

  /**
   * Get best partners
   */
  async getBestPartners(limit = 10) {
    return await this.request(`/leaderboard/best-partners?limit=${limit}`);
  }

  /**
   * Get rivals
   */
  async getRivals(limit = 10) {
    return await this.request(`/leaderboard/rivals?limit=${limit}`);
  }

  /**
   * Get hot hands
   */
  async getHotHands(limit = 10) {
    return await this.request(`/leaderboard/hot-hands?limit=${limit}`);
  }

  // ========== Export Methods ==========

  /**
   * Export to Excel
   */
  async exportToExcel() {
    const token = this.getToken();
    const url = `${this.baseURL}/export/excel`;

    const link = document.createElement('a');
    link.href = url;
    link.download = `badminton_ranking_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (token) {
      // Create a temporary link with auth header
      // Note: This is a simplified approach - for production, use a server-side endpoint
      window.open(url, '_blank');
    }

    return { success: true, message: 'Download started' };
  }

  /**
   * Export to image
   */
  async exportToImage() {
    return await this.request('/export/image');
  }

  // ========== Helper Methods ==========

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...options.headers
    };

    // Add auth token
    if (token && options.useAuthHeader !== false) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Get current user from local storage
   */
  getCurrentUserFromStorage() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Set auth token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  /**
   * Get auth token
   */
  getToken() {
    return this.token || localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Remove auth token
   */
  removeToken() {
    this.token = null;
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }
}

// Create global instance
const api = new APIClient();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { APIClient, api, API_CONFIG };
}
