import { useState, useEffect, useRef } from 'react';
import { productRequestAPI } from '../utils/api';

export default function ProductRequestModal({ isOpen, onClose }) {
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [description, setDescription] = useState('');
  const [photo,       setPhoto]       = useState(null);
  const [photoName,   setPhotoName]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef(null);

  // Réinitialise quand on rouvre le modal
  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setDescription('');
      setPhoto(null);
      setPhotoName('');
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  // Fermeture avec Échap
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    if (isOpen) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Bloque le scroll du body
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    setPhoto(f);
    setPhotoName(f.name);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) {
      setError('Veuillez décrire le produit recherché.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('description', description.trim());
      if (name.trim())  fd.append('name',  name.trim());
      if (email.trim()) fd.append('email', email.trim());
      if (photo)        fd.append('photo', photo);
      await productRequestAPI.send(fd);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="eth-pr-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pr-modal-title"
    >
      <div className="eth-pr-modal">
        {/* Header */}
        <div className="eth-pr-header">
          <div className="eth-pr-header-icon">
            <i className="fa-solid fa-magnifying-glass-plus"></i>
          </div>
          <div>
            <h4 id="pr-modal-title" className="eth-pr-title">Vous ne trouvez pas votre bonheur&nbsp;?</h4>
            <p className="eth-pr-subtitle">Décrivez-nous le produit idéal — nous ferons notre possible pour vous le dénicher.</p>
          </div>
          <button className="eth-pr-close" onClick={onClose} aria-label="Fermer">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {success ? (
          <div className="eth-pr-success">
            <div className="eth-pr-success-icon">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <h5 className="eth-pr-success-title">Demande envoyée !</h5>
            <p className="eth-pr-success-text">
              Merci pour votre message. Notre équipe va examiner votre demande et reviendra vers vous dès que possible.
            </p>
            <button className="btn-eth-primary" onClick={onClose} style={{ marginTop: 8 }}>
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="eth-pr-body" noValidate>
            {/* Description — champ principal */}
            <div className="eth-pr-field">
              <label htmlFor="pr-desc" className="eth-label">
                Ce que vous recherchez <span className="eth-required">*</span>
              </label>
              <textarea
                id="pr-desc"
                className="eth-input"
                placeholder="Ex : une robe wax longue en bleu indigo, style africain moderne, taille M…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {/* Photo */}
            <div className="eth-pr-field">
              <label className="eth-label">
                Photo de référence <span className="eth-optional">(facultatif)</span>
              </label>
              <div
                className={`eth-pr-upload ${photo ? 'has-file' : ''}`}
                onClick={() => fileRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') fileRef.current?.click(); }}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFile}
                />
                {photo ? (
                  <>
                    <i className="fa-solid fa-image eth-pr-upload-icon has-file"></i>
                    <span className="eth-pr-upload-name">{photoName}</span>
                    <span
                      className="eth-pr-upload-clear"
                      onClick={(e) => { e.stopPropagation(); setPhoto(null); setPhotoName(''); fileRef.current.value = ''; }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setPhoto(null); setPhotoName(''); } }}
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up eth-pr-upload-icon"></i>
                    <span className="eth-pr-upload-label">Cliquez pour ajouter une image</span>
                    <span className="eth-pr-upload-hint">JPG, PNG, WebP — max 5 Mo</span>
                  </>
                )}
              </div>
            </div>

            {/* Nom + Email — optionnels */}
            <div className="eth-pr-row">
              <div className="eth-pr-field">
                <label htmlFor="pr-name" className="eth-label">
                  Votre nom <span className="eth-optional">(facultatif)</span>
                </label>
                <input
                  id="pr-name"
                  type="text"
                  className="eth-input"
                  placeholder="Prénom ou pseudo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="eth-pr-field">
                <label htmlFor="pr-email" className="eth-label">
                  Votre email <span className="eth-optional">(pour vous répondre)</span>
                </label>
                <input
                  id="pr-email"
                  type="email"
                  className="eth-input"
                  placeholder="exemple@mail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="eth-pr-error">
                <i className="fa-solid fa-circle-exclamation me-2"></i>{error}
              </div>
            )}

            <button
              type="submit"
              className="btn-eth-primary eth-pr-submit"
              disabled={loading}
            >
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi en cours…</>
                : <><i className="fa-solid fa-paper-plane me-2"></i>Envoyer ma demande</>
              }
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
