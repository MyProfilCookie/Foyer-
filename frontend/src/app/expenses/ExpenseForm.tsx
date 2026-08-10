'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

type Props = {
  householdId: string;
  parentId: string;
};

export default function ExpenseForm({ householdId, parentId }: Props) {
  const router = useRouter();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const amountValue = parseFloat(amount.replace(',', '.'));
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError('Montant invalide.');
      return;
    }
    setLoading(true);

    let receiptUrl: string | null = null;
    if (file) {
      const path = `${householdId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(path, file);
      if (uploadError) {
        setError("Impossible d'envoyer le ticket.");
        setLoading(false);
        return;
      }
      // Le bucket est prive : on conserve seulement le chemin et jamais une URL publique.
      receiptUrl = path;
    }

    const { error: insertError } = await supabase.from('expenses').insert({
      household_id: householdId,
      paid_by_id: parentId,
      expense_date: date,
      category: category.trim(),
      amount: amountValue,
      note: note.trim() || null,
      status: 'pending',
      receipt_url: receiptUrl,
    });

    setLoading(false);
    if (insertError) {
      setError("Impossible d'ajouter la dépense.");
      return;
    }

    setCategory('');
    setAmount('');
    setDate('');
    setNote('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="category" style={labelStyle}>Catégorie</label>
        <input
          id="category"
          style={inputStyle}
          placeholder="Fournitures scolaires"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="amount" style={labelStyle}>Montant (€)</label>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          style={inputStyle}
          placeholder="42.50"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="date" style={labelStyle}>Date</label>
        <input
          id="date"
          type="date"
          style={inputStyle}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="note" style={labelStyle}>Note (optionnel)</label>
        <textarea
          id="note"
          style={inputStyle}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="receipt" style={labelStyle}>Ticket (optionnel)</label>
        <input
          id="receipt"
          type="file"
          accept="image/*,application/pdf"
          style={inputStyle}
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}

      <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
        {loading ? 'Ajout…' : 'Ajouter la dépense'}
      </button>
    </form>
  );
}
