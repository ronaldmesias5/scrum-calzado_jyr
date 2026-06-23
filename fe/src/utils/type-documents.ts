export const DOC_ABBREVIATIONS: Record<string, string> = {
  "Cédula de Ciudadanía": "CC",
  "Cédula de Extranjería": "CE",
  "Tarjeta de Identidad": "TI",
  "Pasaporte": "PA",
  "Permiso de Permanencia": "PPT",
  "NIT (Empresa)": "NIT",
  "Cédula de Ciudadanía (CC)": "CC",
  "Tarjeta de Identidad (TI)": "TI",
  "Cédula de Extranjería (CE)": "CE",
  "Permiso por Protección Temporal (PPT)": "PPT",
  "Documento de Identificación Personal (DIPS)": "DIPS",
};

export function getDocAbbreviation(name: string): string {
  if (DOC_ABBREVIATIONS[name]) return DOC_ABBREVIATIONS[name];
  const match = name.match(/\(([^)]+)\)/);
  if (match && match[1]) return match[1];
  return name.substring(0, 3).toUpperCase();
}
