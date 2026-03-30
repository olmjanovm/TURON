import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProductAvailabilityEnum, ProductBadgeEnum } from '@turon/shared';
import { MenuCategory, MenuProduct, CategoryFormData, ProductFormData, ProductFilterState } from '../features/menu/types';
import { getSeedCategories, getSeedProducts } from '../features/menu/seedData';

interface MenuState {
  categories: MenuCategory[];
  products: MenuProduct[];
  _seeded: boolean;

  // Category CRUD
  addCategory: (data: CategoryFormData) => MenuCategory;
  updateCategory: (id: string, data: Partial<CategoryFormData>) => void;
  toggleCategoryActive: (id: string) => void;
  deleteCategory: (id: string) => void;

  // Product CRUD
  addProduct: (data: ProductFormData) => MenuProduct;
  updateProduct: (id: string, data: Partial<ProductFormData>) => void;
  toggleProductActive: (id: string) => void;
  setProductAvailability: (id: string, availability: ProductAvailabilityEnum) => void;
  setProductImage: (id: string, imageUrl: string) => void;
  removeProductImage: (id: string) => void;
  deleteProduct: (id: string) => void;

  // Queries
  getActiveCategories: () => MenuCategory[];
  getCategoryById: (id: string) => MenuCategory | undefined;
  getProductById: (id: string) => MenuProduct | undefined;
  getProductsByCategory: (categoryId: string) => MenuProduct[];
  getActiveProducts: () => MenuProduct[];
  getProductCountForCategory: (categoryId: string) => number;
  filterProducts: (filters: ProductFilterState) => MenuProduct[];

  // Init
  ensureSeeded: () => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export const useMenuStore = create<MenuState>()(
  persist(
    (set, get) => ({
      categories: [],
      products: [],
      _seeded: false,

      ensureSeeded: () => {
        if (!get()._seeded) {
          set({
            categories: getSeedCategories(),
            products: getSeedProducts(),
            _seeded: true,
          });
        }
      },

      // Category CRUD
      addCategory: (data) => {
        const now = new Date().toISOString();
        const category: MenuCategory = {
          id: generateId(),
          name: data.name,
          slug: data.slug,
          imageUrl: data.imageUrl,
          sortOrder: data.sortOrder,
          isActive: data.isActive,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ categories: [...state.categories, category] }));
        return category;
      },

      updateCategory: (id, data) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      toggleCategoryActive: (id) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, isActive: !c.isActive, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, isActive: false, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      // Product CRUD
      addProduct: (data) => {
        const now = new Date().toISOString();
        const product: MenuProduct = {
          id: generateId(),
          categoryId: data.categoryId,
          name: data.name,
          description: data.description,
          price: data.price,
          imageUrl: data.imageUrl,
          isActive: data.isActive,
          availability: data.availability,
          stockQuantity: data.stockQuantity,
          badge: data.badge,
          weight: data.weight,
          sortOrder: data.sortOrder,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ products: [...state.products, product] }));
        return product;
      },

      updateProduct: (id, data) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      toggleProductActive: (id) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      setProductAvailability: (id, availability) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, availability, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      setProductImage: (id, imageUrl) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, imageUrl, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      removeProductImage: (id) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, imageUrl: '', updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, isActive: false, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      // Queries
      getActiveCategories: () => {
        return get().categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
      },

      getCategoryById: (id) => {
        return get().categories.find((c) => c.id === id);
      },

      getProductById: (id) => {
        return get().products.find((p) => p.id === id);
      },

      getProductsByCategory: (categoryId) => {
        return get().products.filter(
          (p) => p.categoryId === categoryId && p.isActive && p.availability !== ProductAvailabilityEnum.OUT_OF_STOCK
        ).sort((a, b) => a.sortOrder - b.sortOrder);
      },

      getActiveProducts: () => {
        return get().products.filter((p) => p.isActive && p.availability === ProductAvailabilityEnum.AVAILABLE)
          .sort((a, b) => a.sortOrder - b.sortOrder);
      },

      getProductCountForCategory: (categoryId) => {
        return get().products.filter((p) => p.categoryId === categoryId).length;
      },

      filterProducts: (filters) => {
        let result = get().products;

        if (filters.categoryId && filters.categoryId !== 'all') {
          result = result.filter((p) => p.categoryId === filters.categoryId);
        }
        if (filters.activeFilter === 'active') {
          result = result.filter((p) => p.isActive);
        } else if (filters.activeFilter === 'inactive') {
          result = result.filter((p) => !p.isActive);
        }
        if (filters.availabilityFilter !== 'all') {
          result = result.filter((p) => p.availability === filters.availabilityFilter);
        }
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase();
          result = result.filter((p) => p.name.toLowerCase().includes(q));
        }

        return result.sort((a, b) => a.sortOrder - b.sortOrder);
      },
    }),
    { name: 'turon-menu-storage' }
  )
);
