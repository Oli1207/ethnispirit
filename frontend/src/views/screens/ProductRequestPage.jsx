import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productRequestAPI } from '../../utils/api';
import SEO from '../../components/SEO';

export default function ProductRequestPage() {
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [description, setDescription] = useState('');
  const [photo,       setPhoto]       = useState(null);
  const [photoName,   setPhotoName]   = useState('');
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState('');
  const fileRef = useRef(null);

  useEffect(() => { window.scrollTo(0, 0); }, []);

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SEO
        title="Faire une demande de produit — EthniSpirit"
        description="Vous ne trouvez pas le produit que vous cherchez ? Décrivez-le nous et notre équipe fera son possible pour vous le dénicher."
      />

      <div className="eth-pr-page">
        {/* Hero */}
        <div className="eth-pr-page-hero">
          <div className="eth-pr-page-hero-inner">
            <p className="eth-section-label">Votre demande</p>
            <h1 className="eth-pr-page-title">Vous ne trouvez pas ce que vous cherchez&nbsp;?</h1>
            <p className="eth-pr-page-desc">
              Notre boutique grandit chaque jour, mais si vous avez un coup de cœur précis en tête —
              une pièce, un style, une matière — partagez-le nous. Nous ferons tout notre possible pour vous satisfaire.
            </p>
          </div>
        </div>

        <div className="eth-pr-page-content">
          {success ? (
            <div className="eth-pr-page-success">
              <div className="eth-pr-success-icon large">
                <i className="fa-solid fa-circle-check"></i>
              </div>
              <h2 className="eth-pr-success-title">Demande envoyée avec succès !</h2>
              <p className="eth-pr-success-text">
                Merci ! Notre équipe examine chaque demande avec attention.
                {email && ' Nous vous répondrons par email dans les meilleurs délais.'}
              </p>
              <div className="eth-pr-page-success-actions">
                <Link to="/catalogue" className="btn-eth-primary">
                  <i className="fa-solid fa-store me-2"></i>Voir le catalogue
                </Link>
                <button
                  className="eth-btn-outline"
                  onClick={() => { setSuccess(false); setDescription(''); setName(''); setEmail(''); setPhoto(null); setPhotoName(''); }}
                >
                  Faire une autre demande
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="eth-pr-page-form" noValidate>
              {/* Description */}
              <div className="eth-pr-field">
                <label htmlFor="pr-desc" className="eth-label">
                  Décrivez le produit recherché <span className="eth-required">*</span>
                </label>
                <textarea
                  id="pr-desc"
                  className="eth-input"
                  placeholder="Ex : une robe wax longue en bleu indigo, style africain moderne, taille M — ou une veste en tissu bogolan avec des motifs géométriques…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  required
                />
                <span className="eth-pr-char-hint">{description.length} / 1000</span>
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

              {/* Nom + Email */}
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

              <p className="eth-pr-page-note">
                <i className="fa-solid fa-shield-halved me-1" style={{ color: 'var(--tc-light)' }}></i>
                Vos coordonnées ne sont utilisées que pour répondre à votre demande. Aucun spam.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
