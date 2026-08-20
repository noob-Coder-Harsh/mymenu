export type CustomerProfile = {
  name: string;
  phone: string;
};

const STORAGE_KEY = "foodbaba:customer:v1";

export function customerProfileKey() {
  return STORAGE_KEY;
}

export function parseCustomerProfile(raw: string | null): CustomerProfile {
  if (!raw) {
    return { name: "", phone: "" };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || !parsed) {
      return { name: "", phone: "" };
    }
    const record = parsed as Partial<CustomerProfile>;
    return {
      name: typeof record.name === "string" ? record.name.trim().slice(0, 80) : "",
      phone:
        typeof record.phone === "string"
          ? record.phone.replace(/\D/g, "").slice(0, 10)
          : "",
    };
  } catch {
    return { name: "", phone: "" };
  }
}

export function readCustomerProfile(): CustomerProfile {
  if (typeof window === "undefined") {
    return { name: "", phone: "" };
  }
  return parseCustomerProfile(window.localStorage.getItem(STORAGE_KEY));
}

export function writeCustomerProfile(profile: CustomerProfile) {
  if (typeof window === "undefined") {
    return;
  }
  const next: CustomerProfile = {
    name: profile.name.trim().slice(0, 80),
    phone: profile.phone.replace(/\D/g, "").slice(0, 10),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
