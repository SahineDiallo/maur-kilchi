export interface Country {
  name: string;
  nameAr: string;
  code: string;    // ISO alpha-2
  dialCode: string; // e.g. "+222"
  flag: string;    // emoji
}

export const COUNTRIES: Country[] = [
  { name: 'Mauritanie', nameAr: 'موريتانيا', code: 'MR', dialCode: '+222', flag: '🇲🇷' },
  { name: 'Sénégal',    nameAr: 'السنغال',   code: 'SN', dialCode: '+221', flag: '🇸🇳' },
  { name: 'Mali',       nameAr: 'مالي',       code: 'ML', dialCode: '+223', flag: '🇲🇱' },
  { name: "Côte d'Ivoire", nameAr: 'ساحل العاج', code: 'CI', dialCode: '+225', flag: '🇨🇮' },
  { name: 'Guinée',     nameAr: 'غينيا',      code: 'GN', dialCode: '+224', flag: '🇬🇳' },
  { name: 'Maroc',      nameAr: 'المغرب',     code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { name: 'Algérie',    nameAr: 'الجزائر',    code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { name: 'Tunisie',    nameAr: 'تونس',       code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { name: 'Égypte',     nameAr: 'مصر',        code: 'EG', dialCode: '+20',  flag: '🇪🇬' },
  { name: 'Arabie Saoudite', nameAr: 'السعودية', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Émirats',    nameAr: 'الإمارات',   code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'France',     nameAr: 'فرنسا',      code: 'FR', dialCode: '+33',  flag: '🇫🇷' },
  { name: 'États-Unis', nameAr: 'الولايات المتحدة', code: 'US', dialCode: '+1', flag: '🇺🇸' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // Mauritanie +222

export const MAURITANIA_CITIES = [
  "Nouakchott",
  "Nouadhibou",
  "Kiffa",
  "Kaédi",
  "Rosso",
  "Zouerate",
  "Atar",
  "Tidjikja",
  "Aleg",
  "Boutilimit",
  "Néma",
  "Sélibaby",
  "Akjoujt",
  "Aïoun el-Atrouss",
  "Tichit",
  "Chinguetti",
  "Ouadane",
  "Bogué",
  "Mbout",
  "Kankossa",
  "Maghama",
  "Guerou",
  "Tamchakett",
  "Bassikounou",
  "Kobeni",
];
