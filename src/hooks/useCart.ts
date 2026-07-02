import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'
import { getBundleDiscountRate } from '@/lib/bundle'

export { getBundleDiscountRate }

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  clearCart: () => void
  subtotal: () => number
  bundleDiscountRate: () => number
  bundleDiscountAmount: () => number
  total: () => number
  count: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) => {
        const existing = get().items.find(i => i.product.id === product.id)
        if (!existing) {
          set(state => ({ items: [...state.items, { product, quantity: 1 }] }))
        }
      },

      removeItem: (productId) => {
        set(state => ({ items: state.items.filter(i => i.product.id !== productId) }))
      },

      clearCart: () => set({ items: [] }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.product.price, 0),

      bundleDiscountRate: () => getBundleDiscountRate(get().items.length),

      bundleDiscountAmount: () => {
        const sub = get().subtotal()
        const rate = get().bundleDiscountRate()
        return parseFloat((sub * rate).toFixed(2))
      },

      total: () => {
        const sub = get().subtotal()
        const rate = get().bundleDiscountRate()
        return parseFloat((sub * (1 - rate)).toFixed(2))
      },

      count: () => get().items.length,
    }),
    { name: 'pod-cart' }
  )
)
