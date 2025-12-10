export function useAuth() {
  throw new Error(
    "useAuth (class code auth) has been removed. Please rely on useSupabaseSession + guest flow."
  );
}