"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cartStorageKey, parseCart, type CartLine, type StoredCart } from "@/lib/cart/types";

type CartContextValue = {
  slug: string;
  lines: CartLine[];
  notes: string;
  ready: boolean;
  quantityFor: (variantId: string) => number;
  itemCount: number;
  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const emptyCart: StoredCart = { lines: [], notes: "" };

function subscribe() {
  return () => {};
}

function clientTrue() {
  return true;
}

function serverFalse() {
  return false;
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const isClient = useSyncExternalStore(subscribe, clientTrue, serverFalse);
  const [cart, setCart] = useState<StoredCart>(emptyCart);
  const [loadedSlug, setLoadedSlug] = useState<string | null>(null);

  if (isClient && loadedSlug !== slug) {
    setLoadedSlug(slug);
    setCart(parseCart(window.localStorage.getItem(cartStorageKey(slug))));
  }

  const ready = isClient && loadedSlug === slug;

  useEffect(() => {
    if (!ready) {
      return;
    }
    window.localStorage.setItem(cartStorageKey(slug), JSON.stringify(cart));
  }, [cart, ready, slug]);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setCart((current) => {
      const nextQty = Math.min(20, Math.max(0, Math.floor(quantity)));
      const without = current.lines.filter((line) => line.variantId !== variantId);
      return {
        ...current,
        lines: nextQty < 1 ? without : [...without, { variantId, quantity: nextQty }],
      };
    });
  }, []);

  const add = useCallback((variantId: string, quantity = 1) => {
    setCart((current) => {
      const existing = current.lines.find((line) => line.variantId === variantId);
      const nextQty = Math.min(20, (existing?.quantity ?? 0) + quantity);
      const without = current.lines.filter((line) => line.variantId !== variantId);
      return {
        ...current,
        lines: [...without, { variantId, quantity: nextQty }],
      };
    });
  }, []);

  const setNotes = useCallback((value: string) => {
    setCart((current) => ({ ...current, notes: value.slice(0, 300) }));
  }, []);

  const clear = useCallback(() => {
    setCart(emptyCart);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      slug,
      lines: cart.lines,
      notes: cart.notes,
      ready,
      quantityFor: (variantId: string) =>
        cart.lines.find((line) => line.variantId === variantId)?.quantity ?? 0,
      itemCount: cart.lines.reduce((sum, line) => sum + line.quantity, 0),
      add,
      setQuantity,
      setNotes,
      clear,
    }),
    [add, cart.lines, cart.notes, clear, ready, setNotes, setQuantity, slug],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return value;
}
