'use client';

import { useMemo, useState } from 'react';

const blank = {
  sku: '',
  name: '',
  category: 'Drinks',
  subCategory: '',
  size: '',
  basePrice: 0,
  stock: 0,
  trackStock: false,
  active: true,
  variantsText: '',
  addOnsText: '',
  notes: ''
};

function peso(value, currency) {
  return `${currency}${Number(value || 0).toFixed(2)}`;
}

function pairsToText(items = []) {
  return items.map((item) => `${item.name}:${item.price}`).join('\n');
}

function textToPairs(text = '') {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, price] = line.split(':');
      return { name: (name || '').trim(), price: Number(price || 0) };
    })
    .filter((item) => item.name);
}

function toForm(product) {
  if (!product) return { ...blank };
  return {
    ...blank,
    ...product,
    variantsText: pairsToText(product.variants),
    addOnsText: pairsToText(product.addOns)
  };
}

export default function InventoryManager({ products, saveProduct, deleteProduct, saving, currency }) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(blank);
  const [showInactive, setShowInactive] = useState(true);

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return products.filter((item) => {
      if (!showInactive && item.active === false) return false;
      return [item.name, item.sku, item.category, item.subCategory].join(' ').toLowerCase().includes(needle);
    });
  }, [products, query, showInactive]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      basePrice: Number(form.basePrice || 0),
      stock: Number(form.stock || 0),
      variants: textToPairs(form.variantsText),
      addOns: textToPairs(form.addOnsText)
    };
    const ok = await saveProduct(payload);
    if (ok) setForm(blank);
  }

  return (
    <section className="split-panel">
      <div className="panel-card inventory-list">
        <div className="section-head">
          <div>
            <p className="eyebrow">Menu & stocks</p>
            <h2>Inventory</h2>
          </div>
          <button className="primary-btn" onClick={() => setForm(blank)}>New item</button>
        </div>
        <div className="toolbar slim">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." />
          <label className="check-row">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id}>
                  <td><strong>{item.name}</strong><small>{item.sku}</small></td>
                  <td>{item.category}<small>{item.subCategory}</small></td>
                  <td>{item.variants?.length ? item.variants.map((v) => `${v.name} ${peso(v.price, currency)}`).join(', ') : peso(item.basePrice, currency)}</td>
                  <td>{item.trackStock ? item.stock : 'Not tracked'}</td>
                  <td><span className={item.active === false ? 'badge muted' : 'badge success'}>{item.active === false ? 'Inactive' : 'Active'}</span></td>
                  <td className="row-actions">
                    <button className="ghost-btn" onClick={() => setForm(toForm(item))}>Edit</button>
                    <button className="ghost-btn danger" onClick={() => deleteProduct(item)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form className="panel-card product-form" onSubmit={submit}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Product editor</p>
            <h2>{form._id ? 'Edit item' : 'Add item'}</h2>
          </div>
        </div>

        <label>SKU<input value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="AUTO-SKU" /></label>
        <label>Name<input required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Item name" /></label>
        <div className="two-cols">
          <label>Category<input value={form.category} onChange={(e) => update('category', e.target.value)} /></label>
          <label>Sub-category<input value={form.subCategory} onChange={(e) => update('subCategory', e.target.value)} /></label>
        </div>
        <div className="two-cols">
          <label>Size<input value={form.size} onChange={(e) => update('size', e.target.value)} placeholder="16oz" /></label>
          <label>Base price<input type="number" min="0" value={form.basePrice} onChange={(e) => update('basePrice', e.target.value)} /></label>
        </div>
        <div className="two-cols">
          <label>Stock<input type="number" min="0" value={form.stock} onChange={(e) => update('stock', e.target.value)} /></label>
          <label className="check-row boxed"><input type="checkbox" checked={form.trackStock} onChange={(e) => update('trackStock', e.target.checked)} /> Track stock</label>
        </div>
        <label>Variants <small>One per line: name:price</small><textarea value={form.variantsText} onChange={(e) => update('variantsText', e.target.value)} placeholder={'12oz:25\n16oz:35\n22oz:45'} /></label>
        <label>Add-ons <small>One per line: name:price</small><textarea value={form.addOnsText} onChange={(e) => update('addOnsText', e.target.value)} placeholder={'Sea Salt Foam:13\nYakult Mist:25'} /></label>
        <label>Notes<textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Kitchen notes or menu description" /></label>
        <label className="check-row boxed"><input type="checkbox" checked={form.active} onChange={(e) => update('active', e.target.checked)} /> Active on POS</label>

        <button className="checkout-btn" disabled={saving}>{saving ? 'Saving...' : 'Save product'}</button>
      </form>
    </section>
  );
}
