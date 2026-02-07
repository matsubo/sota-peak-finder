/**
 * Country Flag Utilities
 * Maps SOTA associations to country codes and flag emojis
 */

// Map of association prefixes to ISO 3166-1 alpha-2 country codes
const ASSOCIATION_TO_COUNTRY: Record<string, string> = {
  // Americas
  'Alaska': 'US',
  'USA': 'US',
  'United States': 'US',
  'Canada': 'CA',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Argentina': 'AR',
  'Chile': 'CL',
  'Colombia': 'CO',
  'Peru': 'PE',
  'Venezuela': 'VE',
  'Costa Rica': 'CR',
  'Guatemala': 'GT',
  'Panama': 'PA',

  // Europe
  'Austria': 'AT',
  'Belgium': 'BE',
  'Croatia': 'HR',
  'Czech Republic': 'CZ',
  'Denmark': 'DK',
  'England': 'GB',
  'Estonia': 'EE',
  'Finland': 'FI',
  'France': 'FR',
  'Germany': 'DE',
  'Greece': 'GR',
  'Hungary': 'HU',
  'Iceland': 'IS',
  'Ireland': 'IE',
  'Italy': 'IT',
  'Latvia': 'LV',
  'Liechtenstein': 'LI',
  'Lithuania': 'LT',
  'Luxembourg': 'LU',
  'Netherlands': 'NL',
  'Norway': 'NO',
  'Poland': 'PL',
  'Portugal': 'PT',
  'Romania': 'RO',
  'Scotland': 'GB',
  'Serbia': 'RS',
  'Slovakia': 'SK',
  'Slovenia': 'SI',
  'Spain': 'ES',
  'Sweden': 'SE',
  'Switzerland': 'CH',
  'Ukraine': 'UA',
  'Wales': 'GB',

  // Asia
  'Japan': 'JP',
  'South Korea': 'KR',
  'China': 'CN',
  'India': 'IN',
  'Nepal': 'NP',
  'Taiwan': 'TW',
  'Thailand': 'TH',
  'Philippines': 'PH',
  'Indonesia': 'ID',
  'Malaysia': 'MY',
  'Vietnam': 'VN',

  // Oceania
  'Australia': 'AU',
  'New Zealand': 'NZ',
  'Papua New Guinea': 'PG',

  // Africa
  'South Africa': 'ZA',
  'Kenya': 'KE',
  'Tanzania': 'TZ',
  'Namibia': 'NA',
  'Zimbabwe': 'ZW',
  'Morocco': 'MA',
  'Reunion Island': 'RE',

  // Middle East
  'Israel': 'IL',
  'Turkey': 'TR',
  'United Arab Emirates': 'AE',
};

/**
 * Get country code from SOTA association name
 * Association format: "Country - Region" or just "Country"
 */
export function getCountryCode(association: string): string | null {
  if (!association) return null;

  // Extract country name (part before " - " if present)
  const countryName = association.split(' - ')[0].trim();

  // Look up country code
  return ASSOCIATION_TO_COUNTRY[countryName] || null;
}

/**
 * Convert country code to flag emoji
 * Uses Regional Indicator Symbols (U+1F1E6 - U+1F1FF)
 */
export function getFlagEmoji(countryCode: string | null): string {
  if (!countryCode || countryCode.length !== 2) return '🏔️'; // Mountain emoji as fallback

  // Convert country code to flag emoji
  // A = U+1F1E6, offset by character code
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 0x1F1E6 + char.charCodeAt(0) - 65);

  return String.fromCodePoint(...codePoints);
}

/**
 * Get flag emoji from SOTA association name
 */
export function getAssociationFlag(association: string): string {
  const countryCode = getCountryCode(association);
  return getFlagEmoji(countryCode);
}

/**
 * Get country name from association
 */
export function getCountryName(association: string): string {
  if (!association) return '';
  return association.split(' - ')[0].trim();
}
