export type User = { name: string } | null;

const KEY = "av_user";

export function readUser(): User {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

export function writeUser(user: User) {
  localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(KEY);
}
