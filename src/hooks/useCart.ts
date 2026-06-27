import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product } from '@/types'

interface CartStore {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (productId: string) => void
  clearCart: () => void
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

      total: () => get().items.reduce((sum, i) => sum + i.product.price, 0),

      count: () => get().items.length,
    }),
    { name: 'pod-cart' }
  )
)
