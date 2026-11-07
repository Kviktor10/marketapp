/**
 * Crypto Security Module
 */

export function encryptData(data) {
  try {
    return btoa(encodeURIComponent(JSON.stringify(data)));
  } catch (e) {
    return JSON.stringify(data);
  }
}

export function decryptData(data) {
  try {
    if (!data) return null;
    return JSON.parse(decodeURIComponent(atob(data)));
  } catch (e) {
    try {
      return JSON.parse(data);
    } catch (err) {
      return data;
    }
  }
}
