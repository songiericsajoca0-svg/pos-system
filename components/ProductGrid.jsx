'use client';

import { useMemo, useState } from 'react';

function peso(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

export default function ProductGrid({ products, onAdd, currency }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [subCategory, setSubCategory] = useState('All');
  const [selection, setSelection] = useState({});

  const categories = useMemo(() => ['All', ...new Set(products.map((item) => item.category).filter(Boolean))], [products]);
  const subCategories = useMemo(() => {
    const base = category === 'All' ? products : products.filter((item) => item.category === category);
    return ['All', ...new Set(base.map((item) => item.subCategory).filter(Boolean))];
  }, [products, category]);

  const filtered = useMemo(() => {
    const needle = search.toLowerCase();
    return products.filter((item) => {
      const matchesSearch = [item.name, item.sku, item.category, item.subCategory].join(' ').toLowerCase().includes(needle);
      const matchesCategory = category === 'All' || item.category === category;
      const matchesSub = subCategory === 'All' || item.subCategory === subCategory;
      return matchesSearch && matchesCategory && matchesSub;
    });
  }, [products, search, category, subCategory]);

  function setProductSelection(id, patch) {
    setSelection((current) => ({ ...current, [id]: { ...(current[id] || {}), ...patch } }));
  }

  function toggleAddOn(product, addOn) {
    const current = selection[product._id]?.addOns || [];
    const exists = current.some((item) => item.name === addOn.name);
    const next = exists ? current.filter((item) => item.name !== addOn.name) : [...current, addOn];
    setProductSelection(product._id, { addOns: next });
  }

  return (
    <section className="product-area">
      <div className="toolbar">
        <div className="search-box">
          <span>🔎</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search menu item, SKU, category..." />
        </div>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory('All'); }}>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
          {subCategories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="category-pills">
        {categories.map((item) => (
          <button key={item} className={category === item ? 'pill active' : 'pill'} onClick={() => { setCategory(item); setSubCategory('All'); }}>
            {item}
          </button>
        ))}
      </div>

      <div className="product-grid">
        {filtered.map((product) => {
          const current = selection[product._id] || {};
          const variant = current.variant || product.variants?.[0]?.name || product.size || '';
          const variantPrice = product.variants?.find((item) => item.name === variant)?.price;
          const basePrice = Number(variantPrice ?? product.basePrice ?? 0);
          const addOns = current.addOns || [];
          const addOnTotal = addOns.reduce((sum, item) => sum + Number(item.price || 0), 0);
          const finalPrice = basePrice + addOnTotal;
          const stockWarning = product.trackStock && Number(product.stock) <= 5;

          return (
            <article key={product._id} className={stockWarning ? 'product-card low' : 'product-card'}>
              <div className="card-head">
                <span className="category-tag">{product.subCategory || product.category}</span>
                {product.trackStock && <span className="stock-tag">Stock: {product.stock}</span>}
              </div>
              <h3>{product.name}</h3>
              <p className="sku">{product.sku}</p>
              {product.notes && <p className="note">{product.notes}</p>}

              {product.variants?.length > 0 && (
                <div className="variant-row">
                  {product.variants.map((item) => (
                    <button
                      key={item.name}
                      className={variant === item.name ? 'mini-btn active' : 'mini-btn'}
                      onClick={() => setProductSelection(product._id, { variant: item.name })}
                    >
                      {item.name} {peso(item.price, currency)}
                    </button>
                  ))}
                </div>
              )}

              {product.addOns?.length > 0 && (
                <div className="addons">
                  <small>Add-ons</small>
                  {product.addOns.map((addOn) => (
                    <label key={addOn.name}>
                      <input
                        type="checkbox"
                        checked={addOns.some((item) => item.name === addOn.name)}
                        onChange={() => toggleAddOn(product, addOn)}
                      />
                      {addOn.name} +{peso(addOn.price, currency)}
                    </label>
                  ))}
                </div>
              )}

              <div className="card-footer">
                <strong>{peso(finalPrice, currency)}</strong>
                <button className="primary-btn" disabled={product.trackStock && Number(product.stock) <= 0} onClick={() => onAdd(product, { variant, addOns })}>
                  {product.trackStock && Number(product.stock) <= 0 ? 'Out' : 'Add'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="empty-state">No menu item found.</div>}
    </section>
  );
}
