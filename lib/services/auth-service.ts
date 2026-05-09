import { apiClient } from "../api-client";

export const authService = {
  async login(credentials: any) {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },
  
  async googleLogin() {
    // Redirect to backend google auth endpoint
    window.location.href = "http://localhost:8080/api/v1/auth/google";
  },
  
  async logout() {
    await apiClient.post("/auth/logout");
    localStorage.removeItem("access_token");
  },
  
  async me() {
    const response = await apiClient.get("/auth/me");
    return response.data;
  }
};
