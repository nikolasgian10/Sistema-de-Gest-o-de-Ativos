import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAssetCode(
  assetType: string | undefined,
  sigla_local?: string | null,
  sector?: string | null,
  altura_option?: string | null,
  bem_patrimonial?: string | null
) {
  const map: Record<string, string> = {
    ar_condicionado: 'AC',
    chiller: 'CHI',
    split: 'SPT',
    mecalor: 'MEC',
    ar_maquina: 'AMQ',
    outro: 'OUT',
  };

  const prefix = map[assetType || ''] || 'OUT';

  // Usar o código do bem patrimonial quando fornecido (este será o identificador central solicitado)
  const idPart = bem_patrimonial && String(bem_patrimonial).trim() ? String(bem_patrimonial).trim() : String(Date.now()).slice(-6);

  const sig = sigla_local ? String(sigla_local).toUpperCase().replace(/\s+/g, '-') : 'NO-SIG';
  const sec = sector ? String(sector).toUpperCase().replace(/\s+/g, '-') : 'NO-SETOR';
  const alt = altura_option ? String(altura_option).toUpperCase() : '';

  return `${prefix}-${idPart}-${sig}-${sec}${alt ? '-' + alt : ''}`;
}

export function isUniqueViolation(err: any) {
  if (!err) return false;
  const code = err?.code || err?.status || err?.statusCode;
  if (String(code) === '23505') return true;
  const msg = String(err?.message || err?.error || err?.details || '').toLowerCase();
  if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('unique')) return true;
  return false;
}
