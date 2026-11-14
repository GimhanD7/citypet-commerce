import { useEffect, useState } from 'react'
import { apiFetch } from '../config/api'

export default function useStoreProducts() {
  const [products, setProducts] = useState([])
  useEffect(() => {
    let mounted = true
    async function load() {
      const all = []
      let offset = 0
      try {
        while (true) {
          const data = await apiFetch(`products.php?limit=100&offset=${offset}`)
          all.push(...data.products)
          offset += data.products.length
          if (offset >= data.total || data.products.length === 0) break
        }
        if (mounted) setProducts(all)
      } catch (err) { console.warn('Unable to load store products:', err.message) }
    }
    load()

    const onUpdate = (e) => {
      if (e.detail?.productId) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === e.detail.productId
              ? {
                  ...p,
                  stockCount: e.detail.stockCount !== undefined ? e.detail.stockCount : p.stockCount,
                  inStock: e.detail.inStock !== undefined ? e.detail.inStock : p.inStock,
                }
              : p
          )
        )
      }
      load()
    }
    window.addEventListener('citypet_products_updated', onUpdate)

    return () => {
      mounted = false
      window.removeEventListener('citypet_products_updated', onUpdate)
    }
  }, [])
  return products
}
