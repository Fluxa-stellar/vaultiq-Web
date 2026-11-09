export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}

export function generateMockTxHash(): string {
  const characters = "0123456789abcdef";
  let hash = "0x091c";
  for (let i = 0; i < 58; i++) {
    hash += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return hash;
}

