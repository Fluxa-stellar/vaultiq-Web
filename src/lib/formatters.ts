export function formatCurrency(
  value: number | string | undefined | null,
  decimals: number = 2,
  symbol: string = "$"
): string {
  if (value === undefined || value === null) return `${symbol}0.00`;
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return `${symbol}0.00`;
  return `${symbol}${num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatAddress(address?: string | null, chars: number = 4): string {
  if (!address) return "—";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatTxHash(hash?: string | null, chars: number = 6): string {
  if (!hash) return "—";
  if (hash.length <= chars * 2 + 2) return hash;
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00h 00m";
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
}

export function formatTimeAgo(timestamp?: string | number | null): string {
  if (!timestamp) return "—";
  const date = typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
  if (isNaN(date)) return "—";
  const elapsed = Math.floor((Date.now() - date) / 1000);
  if (elapsed < 60) return "Just now";
  const minutes = Math.floor(elapsed / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}


