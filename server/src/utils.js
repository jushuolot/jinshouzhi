import { v4 as uuid } from 'uuid';

export function genId(prefix = '') {
  return prefix + uuid().replace(/-/g, '').slice(0, 16);
}

export function parseAge(birthDate) {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function isMaleEligible(birthDate) {
  return parseAge(birthDate) >= 40;
}

export function isFemaleEligible(birthDate) {
  return parseAge(birthDate) >= 18;
}

export function todayShanghai() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

export function randomDisplayName(prefix) {
  const s = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}_${s}`;
}

export function genInviteCode() {
  return 'INV_' + Math.random().toString(36).slice(2, 8).toUpperCase();
}
