'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE } from '../_shared/theme';

export default function ProfilePhoto({ parentId, name, initialUrl, initialPath }: { parentId: string; name: string; initialUrl: string | null; initialPath: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(initialUrl);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choisissez une image JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    setLoading(true);
    const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const path = `${parentId}/profile-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      upsert: false,
      contentType: file.type,
      cacheControl: '3600',
    });
    if (uploadError) {
      console.error('Avatar upload failed:', uploadError);
      setLoading(false);
      setError(uploadError.message || "La photo n'a pas pu être envoyée.");
      event.target.value = '';
      return;
    }
    const { error: updateError } = await supabase.from('parents').update({ avatar_path: path }).eq('id', parentId);
    if (updateError) {
      await supabase.storage.from('avatars').remove([path]);
      console.error('Avatar profile update failed:', updateError);
      setLoading(false);
      setError("La photo n'a pas pu être associée au profil.");
      event.target.value = '';
      return;
    }
    if (currentPath && currentPath !== path) {
      const { error: removeError } = await supabase.storage.from('avatars').remove([currentPath]);
      if (removeError) console.error('Previous avatar removal failed:', removeError);
    }
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    setPreview(data?.signedUrl ?? URL.createObjectURL(file));
    setCurrentPath(path);
    setLoading(false);
    event.target.value = '';
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
      <div style={{ width: 82, height: 82, borderRadius: '50%', overflow: 'hidden', background: PALETTE.coral, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-heading)', fontSize: 30, fontWeight: 700, border: `3px solid ${PALETTE.divider}` }}>
        {preview ? <img src={preview} alt={`Photo de ${name}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : name.charAt(0).toLocaleUpperCase('fr-FR')}
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} hidden />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={loading} style={{ border: `1px solid ${PALETTE.coral}`, background: 'transparent', color: PALETTE.coral, borderRadius: 12, padding: '9px 14px', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Envoi…' : preview ? 'Changer la photo' : 'Ajouter une photo'}
        </button>
        <p style={{ color: PALETTE.muted, fontSize: 12, marginTop: 6 }}>JPG, PNG ou WebP · 5 Mo maximum</p>
        {error && <p role="alert" style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>{error}</p>}
      </div>
    </div>
  );
}
