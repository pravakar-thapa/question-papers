import { apiRequest } from "../utils/apiRequest";

export const loginUser = async (username, password) =>
  apiRequest("/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

export const signupUser = async (username, password) =>
  apiRequest("/signup", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
