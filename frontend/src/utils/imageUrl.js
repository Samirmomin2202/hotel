const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4400/api/v1";
const assetBaseUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");

export function resolveImageUrl(imagePath) {
    if (!imagePath) return "";
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    return `${assetBaseUrl}/${String(imagePath).replace(/^\//, "")}`;
}
