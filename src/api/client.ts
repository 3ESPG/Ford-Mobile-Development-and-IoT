import Constants from "expo-constants";
import { Platform } from "react-native";
import type { Dealer, Lead, OverviewResponse, Paginated, StrategyResponse } from "@/types";

const configuredUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const API_BASE_URL =
  configuredUrl || (Platform.OS === "android" ? "http://10.0.2.2:3333" : "http://localhost:3333");

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`API ${response.status}: ${path}`);
  }
  return response.json() as Promise<T>;
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function getOverview() {
  return request<OverviewResponse>("/api/overview");
}

export function getDealers(params: { q?: string; sort?: string }) {
  return request<Paginated<Dealer>>(`/api/dealers${query({ ...params, limit: 80 })}`);
}

export function getLeads(params: { q?: string; priority?: string }) {
  return request<Paginated<Lead>>(`/api/leads${query({ ...params, limit: 80 })}`);
}

export function getStrategy() {
  return request<StrategyResponse>("/api/strategy");
}
