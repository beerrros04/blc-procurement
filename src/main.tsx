import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { validateDraft, type DraftErrors, type DraftInput } from './draft';
import { readDrafts, saveDraft as persistDraft, type Draft } from './draft-store';
import './style.css';

const emptyForm: DraftInput = { title: '', branch: '', amount: '', purpose: '', requiredDate: '' };
const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function App() {
  const [initial] = useState(() => {
    try { return { drafts: readDrafts(localStorage), error: '' }; }
    catch { return { drafts: [] as Draft[], error: 'Draf tidak dapat dibaca. Data yang tersimpan tidak diubah; periksa penyimpanan browser.' }; }
  });
  const [drafts, setDrafts] = useState(initial.drafts);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [editingId, setEditingId] = useState<string>();
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialog.current?.showModal();
  }, [open]);

  function closeForm() {
    dialog.current?.close();
    setOpen(false);
    setForm(emptyForm);
    setEditingId(undefined);
    setErrors({});
    setSaveError('');
  }

  function openForm(draft?: Draft) {
    setForm(draft ? { title: draft.title, branch: draft.branch, amount: String(draft.amount), purpose: draft.purpose ?? '', requiredDate: draft.requiredDate ?? '' } : emptyForm);
    setEditingId(draft?.id);
    setErrors({});
    setSaveError('');
    setNotice('');
    setOpen(true);
  }

  function saveDraft(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateDraft(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    try {
      setDrafts(persistDraft(localStorage, form, editingId));
      setNotice(editingId ? 'Perubahan draf tersimpan di browser ini.' : 'Draf tersimpan di browser ini.');
      closeForm();
    } catch {
      setSaveError('Draf tidak tersimpan. Data sebelumnya tidak diubah; periksa penyimpanan browser atau muat ulang halaman.');
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">B</span><div><strong>BLC</strong><small>PROCUREMENT</small></div></div>
        <div className="nav-label">RUANG KERJA</div>
        <nav aria-label="Navigasi utama"><a className="nav-active" href="#permintaan"><span aria-hidden="true">▤</span> Permintaan pembelian</a></nav>
        <div className="sidebar-note"><span className="dot" />Rancangan awal<span>Versi lokal untuk evaluasi</span></div>
      </aside>
      <main className="main" id="permintaan">
        <header className="topbar"><span>Ruang kerja <span className="slash">/</span> Permintaan pembelian</span><span className="top-tag">BLC PROCUREMENT</span></header>
        <div className="content">
          <div className="preview-note"><strong>Pratinjau lokal</strong><span>Hanya untuk evaluasi. Jangan gunakan data perusahaan atau transaksi nyata.</span></div>
          <div className="page-heading"><div><div className="eyebrow">PENGADAAN <span> / </span> PURCHASE REQUEST</div><h1>Permintaan pembelian</h1><p>Siapkan dan pantau draf permintaan dalam satu tempat.</p></div><button className="primary" disabled={!!initial.error} onClick={() => openForm()}><span aria-hidden="true">＋</span> Buat draf PR</button></div>
          <section className="summary" aria-label="Ringkasan draf"><div><span className="summary-label">DRAF DI BROWSER INI</span><strong>{drafts.length.toString().padStart(2, '0')}</strong><span className="summary-caption">Permintaan tersimpan</span></div><div className="summary-rule" /><div className="summary-detail"><span className="summary-icon" aria-hidden="true">↗</span><div><strong>Mulai dari permintaan</strong><p>Buat draf terlebih dahulu untuk menyiapkan rincian pembelian.</p></div></div></section>
          {initial.error && <div className="notice error-notice" role="alert">{initial.error}</div>}
          {notice && <div className="notice" role="status">{notice}</div>}
          <section className="list-card" aria-labelledby="list-title">
            <div className="section-head"><div><h2 id="list-title">Draf permintaan</h2><p>Daftar draf yang disimpan pada perangkat ini.</p></div><span className="count">{drafts.length} draf</span></div>
            {drafts.length === 0 ? <div className="empty"><div className="empty-icon" aria-hidden="true">▤</div><h3>{initial.error ? 'Draf tidak dapat ditampilkan' : 'Belum ada draf permintaan'}</h3><p>{initial.error ? 'Periksa penyimpanan browser untuk mengakses draf.' : 'Mulai dengan membuat draf PR pertama Anda.'}</p>{!initial.error && <button className="secondary" onClick={() => openForm()}>Buat draf PR <span aria-hidden="true">↗</span></button>}</div> :
              <div className="table-wrap"><table><thead><tr><th scope="col">PERMINTAAN</th><th scope="col">CABANG</th><th scope="col">NOMINAL</th><th scope="col">DIBUAT</th><th scope="col">STATUS</th><th scope="col">TINDAKAN</th></tr></thead><tbody>{drafts.map(draft => <tr key={draft.id}><td><strong>{draft.title}</strong><small>Purchase Request</small></td><td>{draft.branch}</td><td>{rupiah.format(draft.amount)}</td><td>{new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(draft.createdAt))}</td><td><span className="badge">Draf</span></td><td><button className="edit-button" aria-label={`Ubah draf ${draft.title}`} onClick={() => openForm(draft)}>Ubah</button></td></tr>)}</tbody></table></div>}
          </section>
          <p className="footer-note">Pratinjau awal · Persetujuan dan pembayaran belum tersedia</p>
        </div>
      </main>
      {open && <dialog ref={dialog} className="modal" aria-labelledby="form-title" onCancel={event => { event.preventDefault(); closeForm(); }}><section className="drawer"><div className="drawer-head"><div><div className="eyebrow">PURCHASE REQUEST</div><h2 id="form-title">{editingId ? 'Ubah draf PR' : 'Buat draf PR'}</h2><p>Isi informasi awal permintaan pembelian.</p></div><button className="close" type="button" aria-label="Tutup formulir" onClick={closeForm}>×</button></div><form onSubmit={saveDraft} noValidate><div className="form-body"><div className="form-intro"><span>01</span><div><strong>Informasi permintaan</strong><p>Data ini hanya disimpan di browser Anda.</p></div></div>
        {saveError && <div className="notice error-notice" role="alert">{saveError}</div>}
        <label htmlFor="title">Judul permintaan <span>*</span></label><input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Pengadaan perlengkapan kantor" aria-invalid={!!errors.title} aria-describedby={errors.title ? 'title-error' : undefined} />{errors.title && <p className="error" id="title-error">{errors.title}</p>}
        <label htmlFor="branch">Cabang <span>*</span></label><input id="branch" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} placeholder="Masukkan nama cabang" aria-invalid={!!errors.branch} aria-describedby={errors.branch ? 'branch-error' : undefined} />{errors.branch && <p className="error" id="branch-error">{errors.branch}</p>}
        <label htmlFor="purpose">Tujuan pembelian</label><textarea id="purpose" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} placeholder="Jelaskan kebutuhan pembelian" rows={3} />
        <label htmlFor="requiredDate">Tanggal kebutuhan</label><input id="requiredDate" type="date" value={form.requiredDate} onChange={e => setForm({ ...form, requiredDate: e.target.value })} aria-invalid={!!errors.requiredDate} aria-describedby={errors.requiredDate ? 'date-error' : undefined} />{errors.requiredDate && <p className="error" id="date-error">{errors.requiredDate}</p>}
        <label htmlFor="amount">Perkiraan nominal <span>*</span></label><div className="money"><span>Rp</span><input id="amount" inputMode="numeric" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'amount-error' : 'amount-help'} /></div><p className="help" id="amount-help">Masukkan angka tanpa titik atau koma.</p>{errors.amount && <p className="error" id="amount-error">{errors.amount}</p>}
        </div><div className="form-actions"><button type="button" className="secondary" onClick={closeForm}>Batal</button><button className="primary" type="submit">{editingId ? 'Simpan perubahan' : 'Simpan draf'} <span aria-hidden="true">→</span></button></div></form></section></dialog>}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
