/**
 * Centralized API helper with timeout, error handling, and base URL.
 * All frontend API calls should use this instead of raw fetch().
 */

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const TIMEOUT_MS = 30000;

export const SHOP_ID = process.env.NEXT_PUBLIC_SHOP_ID || "shop_01";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${API_BASE}${path}`, {
            ...options,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
        });

        if (!res.ok) {
            const errorBody = await res.text().catch(() => "Unknown error");
            throw new Error(`API Error ${res.status}: ${errorBody}`);
        }

        return await res.json();
    } catch (err: any) {
        if (err.name === "AbortError") {
            throw new Error("Request timed out. Please try again.");
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}
