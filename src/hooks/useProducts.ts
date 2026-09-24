import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';

export function useProducts(filters?: {
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  featured?: boolean;
  bestseller?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('products')
        .select('*, categories(id, name, slug)')
        .order('created_at', { ascending: false });

      if (filters?.featured) query = query.eq('is_featured', true);
      if (filters?.bestseller) query = query.eq('is_bestseller', true);
      if (filters?.minPrice !== undefined) query = query.gte('price', filters.minPrice);
      if (filters?.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);

      if (filters?.categorySlug) {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('slug', filters.categorySlug)
          .single();
        if (cat) query = query.eq('category_id', cat.id);
      }

      const { data, error } = await query;
      if (error) setError(error.message);
      else setProducts((data as Product[]) || []);
      setLoading(false);
    }

    fetchProducts();
  }, [
    filters?.categorySlug,
    filters?.minPrice,
    filters?.maxPrice,
    filters?.search,
    filters?.featured,
    filters?.bestseller,
  ]);

  return { products, loading, error };
}

export function useProduct(slug: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('slug', slug)
      .single()
      .then(({ data }) => {
        setProduct(data as Product);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  return { product, loading };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = () => {
    setLoading(true);
    return supabase
      .from('categories')
      .select('*, products(id)')
      .order('name')
      .then(({ data }) => {
        const mapped = (data || []).map((cat: Category & { products?: { id: string }[] }) => ({
          ...cat,
          product_count: Array.isArray(cat.products) ? cat.products.length : 0,
        }));
        setCategories(mapped as Category[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async (payload: { name: string; slug: string; image_url: string }) => {
    const { error } = await supabase.from('categories').insert(payload);
    await fetchCategories();
    return error?.message || null;
  };

  const updateCategory = async (id: string, payload: Partial<{ name: string; slug: string; image_url: string }>) => {
    const { error } = await supabase.from('categories').update(payload).eq('id', id);
    await fetchCategories();
    return error?.message || null;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    await fetchCategories();
    return error?.message || null;
  };

  return { categories, loading, refetch: fetchCategories, addCategory, updateCategory, deleteCategory };
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  phone: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

export function useReviews(productId: string) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    if (!productId) return;
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    setReviews((data as Review[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  const submitReview = async (review: { customer_name: string; phone?: string; rating: number; comment: string }) => {
    const { error } = await supabase.from('reviews').insert({ product_id: productId, ...review });
    if (!error) {
      await fetchReviews();
      // update product rating & review_count
      const all = await supabase.from('reviews').select('rating').eq('product_id', productId);
      if (all.data) {
        const avg = all.data.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / all.data.length;
        await supabase.from('products').update({ rating: Math.round(avg * 10) / 10, review_count: all.data.length }).eq('id', productId);
      }
    }
    return error;
  };

  return { reviews, loading, submitReview };
}

export function useAdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .order('created_at', { ascending: false });
    setProducts((data as Product[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    await fetchProducts();
  };

  return { products, loading, refetch: fetchProducts, deleteProduct };
}
