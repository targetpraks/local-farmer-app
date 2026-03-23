// Zoho Inventory API helpers for TLF: Mushrooms

const ZOHO_TOKEN_URL = 'https://accounts.zoho.com/oauth/v2/token';
const ZOHO_INV_BASE = 'https://inventory.zoho.com/api/v1';

interface ZohoTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

let tokenCache: ZohoTokens | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires_at) return tokenCache.access_token;
  
  const rf = process.env.ZOHO_REFRESH_TOKEN!;
  const res = await fetch(ZOHO_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.ZOHO_CLIENT_ID!,
      client_secret: process.env.ZOHO_CLIENT_SECRET!,
      refresh_token: rf,
    }),
  });
  if (!res.ok) throw new Error(`Zoho token error: ${res.status}`);
  const d = await res.json();
  tokenCache = {
    access_token: d.access_token,
    refresh_token: d.refresh_token || tokenCache?.refresh_token || '',
    expires_at: Date.now() + (d.expires_in - 60) * 1000,
  };
  return tokenCache.access_token;
}

async function zfetch(path: string, opts: RequestInit = {}) {
  const token = await getToken();
  const r = await fetch(`${ZOHO_INV_BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });
  if (!r.ok) { const e = await r.text(); throw new Error(`Zoho ${r.status}: ${e}`); }
  return r.json();
}

export async function pushPriceToZoho(itemId: string, wholesalePrice: number, retailPrice: number) {
  return zfetch(`/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ list_price: wholesalePrice, mrp: retailPrice }),
  });
}

export async function pushStockToZoho(itemId: string, quantityKg: number, notes = 'TLF: Mushrooms harvest') {
  const data = await zfetch('/inventoryadjustments', {
    method: 'POST',
    body: JSON.stringify({
      adjustment_date: new Date().toISOString().split('T')[0],
      description: notes,
      inventory_adjustment_items: [{
        item_id: itemId,
        quantity_adjusted: quantityKg,
        adjustment_account: 'Inventory Asset',
      }],
    }),
  });
  return data;
}

export async function getStockFromZoho(itemId: string): Promise<number> {
  const d = await zfetch(`/items/${itemId}`) as any;
  return parseFloat(d.item?.stock_on_hand || '0');
}

export async function testZoho(): Promise<{ ok: boolean; message: string }> {
  try { await getToken(); return { ok: true, message: 'Zoho connection OK' }; }
  catch (e: any) { return { ok: false, message: e.message }; }
}
