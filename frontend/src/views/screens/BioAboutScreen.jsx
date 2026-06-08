import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';
import logoBio from '../../assets/logo_ethnispirit_natural.jpeg';

export default function BioAboutScreen() {
  return (
    <div style={{ background: 'var(--bio-cream)' }}>
      <SEO
        title="À propos — EthniSpirit Natural"
        description="EthniSpirit est une marque afro-caribéenne qui célèbre le lien profond entre l'Afrique et la Caraïbe. Nos trésors naturels sont 100% biologiques et issus d'un savoir-faire ancestral."
      />
      <MobileBackButton to="/bio" label="Accueil Bio" />

      {/* ── Carte d'identité de marque ─────────────────────────────────── */}
      <section className="bio-about-hero">
        <div className="bio-about-hero-inner">

          {/* Carte principale */}
          <div className="bio-about-brand-card">

            {/* Logo */}
            <div className="bio-about-logo-wrap">
              <img src={logoBio} alt="EthniSpirit Natural" className="bio-about-logo" />
            </div>

            {/* Séparateur décoratif */}
            <div className="bio-about-sep">
              <span className="bio-about-sep-line" />
              <i className="fa-solid fa-leaf bio-about-sep-icon" />
              <span className="bio-about-sep-line" />
            </div>

            {/* Paragraphes identité */}
            <p className="bio-about-intro">
              Ethnispirit est une marque afro-caribéenne qui célèbre le lien profond
              entre l'Afrique et la Caraïbe.
            </p>
            <p className="bio-about-intro">
              Nos trésors naturels sont 100&nbsp;% biologiques et issus d'un savoir-faire ancestral.
            </p>
            <p className="bio-about-intro">
              Importés directement d'Afrique, ils prennent soin de la peau,
              des cheveux et de la santé, tout en respectant la planète.
            </p>

            {/* Séparateur */}
            <div className="bio-about-sep bio-about-sep--sm">
              <span className="bio-about-sep-line" />
              <span className="bio-about-sep-dot" />
              <span className="bio-about-sep-line" />
            </div>

            {/* Mission */}
            <p className="bio-about-body">
              Alliant authenticité et élégance, Ethnispirit s'engage pour une beauté
              et un bien-être conscients, éthiques et inspirés par nos racines.
              Chaque produit raconte une histoire&nbsp;: celle de la terre, des artisans,
              et d'un héritage vivant qui unit les peuples.
            </p>

            {/* Séparateur */}
            <div className="bio-about-sep bio-about-sep--sm">
              <span className="bio-about-sep-line" />
              <span className="bio-about-sep-dot" />
              <span className="bio-about-sep-line" />
            </div>

            {/* Tagline dans la carte */}
            <p className="bio-about-card-tagline">
              Ethnispirit&nbsp;: la nature au cœur, l'Afrique à l'âme,<br />
              la Caraïbe en éclat.
            </p>

          </div>
        </div>
      </section>

      {/* ── Valeurs ────────────────────────────────────────────────────── */}
      <section className="bio-about-values">
        <div className="bio-about-values-inner">
          <div className="bio-about-values-grid">
            {[
              {
                icon: 'fa-seedling',
                title: '100% Biologique',
                text: 'Chaque ingrédient est certifié biologique, sélectionné pour sa pureté et son efficacité naturelle.',
              },
              {
                icon: 'fa-globe-africa',
                title: 'Savoir-faire ancestral',
                text: "Nos recettes s'inspirent de traditions millénaires africaines transmises de génération en génération.",
              },
              {
                icon: 'fa-leaf',
                title: 'Respect de la planète',
                text: 'Emballages éco-conçus, filières courtes et commerce équitable — notre engagement pour la Terre.',
              },
              {
                icon: 'fa-hand-holding-heart',
                title: 'Commerce éthique',
                text: 'Nos partenariats directs avec les producteurs africains garantissent une rémunération juste.',
              },
            ].map((v) => (
              <div key={v.icon} className="bio-about-card">
                <div className="bio-about-icon-wrap">
                  <i className={`fa-solid ${v.icon}`}></i>
                </div>
                <h5 className="bio-about-card-title">{v.title}</h5>
                <p className="bio-about-card-text">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="bio-about-cta">
        <div className="bio-about-cta-inner">
          <p className="bio-section-label" style={{ color: 'var(--bio-light)' }}>Prêt·e à découvrir ?</p>
          <h3 className="bio-about-cta-title">Explorer nos produits naturels</h3>
          <p className="bio-about-cta-sub">
            Huiles végétales, soins du visage, cheveux et corps — directement d'Afrique aux Caraïbes.
          </p>
          <div className="bio-about-cta-btns">
            <Link to="/bio/catalogue" className="bio-btn-primary">
              <i className="fa-solid fa-arrow-right me-2"></i>Voir les produits Bio
            </Link>
            <Link to="/" className="bio-btn-ghost">
              <i className="fa-solid fa-shirt me-2"></i>Mode Caribéenne
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
