export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

export const isTokenValid = (token: string) => {
  try {
    // Basic JWT expiry check
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};
