'use client';

import { useState } from 'react';

export default function SettingsPanel({ settings, saveSettings, seedMenu, saving, offlineMode }) {
  const [form, setForm] = useState(settings);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(e) {
    e.preventDefault();
    saveSettings({
      ...form,
      taxRate: Number(form.taxRate || 0),
      serviceChargeRate: Number(form.serviceChargeRate || 0)
    });
  }

  return (
    <section className="settings-layout">
      <form className="panel-card settings-form" onSubmit={submit}>
        <div className="section-head">
          <div>
            <p className="eyebrow">Branch setup</p>
            <h2>Business settings</h2>
          </div>
        </div>
        <label>Store name<input value={form.storeName || ''} onChange={(e) => update('storeName', e.target.value)} /></label>
        <label>Address<input value={form.address || ''} onChange={(e) => update('address', e.target.value)} /></label>
        <label>Contact<input value={form.contact || ''} onChange={(e) => update('contact', e.target.value)} /></label>
        <div className="two-cols">
          <label>Tax rate %<input type="number" min="0" step="0.01" value={form.taxRate || 0} onChange={(e) => update('taxRate', e.target.value)} /></label>
          <label>Service charge %<input type="number" min="0" step="0.01" value={form.serviceChargeRate || 0} onChange={(e) => update('serviceChargeRate', e.target.value)} /></label>
        </div>
        <label>Receipt footer<textarea value={form.receiptFooter || ''} onChange={(e) => update('receiptFooter', e.target.value)} /></label>
        <button className="checkout-btn" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</button>
      </form>

      <div className="panel-card deploy-card">
        <p className="eyebrow">MongoDB setup</p>
        <h2>Seed the menu from the photo</h2>
        <p>
          After adding <code>MONGODB_URI</code> in your <code>.env.local</code> or Vercel Environment Variables,
          click this button to insert/update all menu items and default settings in MongoDB.
        </p>
        <button className="primary-btn wide" disabled={saving} onClick={seedMenu}>{saving ? 'Working...' : 'Seed menu to MongoDB'}</button>
        {offlineMode && <p className="warning-text">Currently using demo menu because MongoDB is not connected or products collection is empty.</p>}

        <div className="deploy-steps">
          <h3>Deploy to Vercel</h3>
          <ol>
            <li>Upload/push this project to GitHub.</li>
            <li>Import the repository in Vercel.</li>
            <li>Add Environment Variable: <code>MONGODB_URI</code>.</li>
            <li>Deploy, open the app, then click <strong>Seed menu to MongoDB</strong>.</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
