/**
 * MobileBackButton — Flèche "retour" visible uniquement sur mobile (< 768px).
 *
 * Props :
 *   to       : chemin de secours si l'historique est vide (ex: "/catalogue")
 *   label    : texte du bouton (défaut: "Retour")
 *   style    : styles CSS supplémentaires pour le wrapper
 */
import { useNavigate } from 'react-router-dom';

export default function MobileBackButton({ to = '/', label = 'Retour', style = {} }) {
  const navigate = useNavigate();

  function handleBack() {
    // Si on peut reculer dans l'historique, on le fait ; sinon on va au fallback
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(to);
    }
  }

  return (
    <button
      onClick={handleBack}
      className="eth-mobile-back"
      aria-label="Page précédente"
      style={style}
    >
      <i className="fa-solid fa-arrow-left"></i>
      <span>{label}</span>
    </button>
  );
}
