import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import MobileBackButton from '../../components/MobileBackButton';
import aboutImg from '../../assets/afrique_invite.jpeg';
import missionImg from '../../assets/notre_mission.jpeg';

export default function AboutScreen() {
  return (
    <div>
      <SEO
        title="À propos"
        description="L'histoire d'EthniSpirit — une boutique dédiée à la mode caribéenne authentique et aux cosmétiques bio naturels, née d'un amour pour la culture créole et africaine."
      />
      <MobileBackButton to="/" label="Accueil" />
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="eth-about-hero">
        <div className="eth-about-hero-inner">
          <div>
            <p className="eth-about-eyebrow">Notre histoire</p>
            <h1 className="eth-about-title">
              L'Afrique au cœur<br />de la <em>Caraïbe</em>
            </h1>
            <p className="eth-about-lead">
              Chez Ethnispirit, nous sélectionnons avec passion des pièces artisanales
              authentiques venues d'Afrique, pensées pour séduire une clientèle caribéenne
              attachée à ses racines, à son histoire et à son identité culturelle.
            </p>
            <p className="eth-about-lead" style={{ marginTop: 16 }}>
              Chaque création est choisie pour son authenticité, la qualité de son
              artisanat et sa résonance avec l'âme et la sensibilité des Caribéens.
            </p>
            <p className="eth-about-lead" style={{ marginTop: 16 }}>
              Plus qu'une boutique, Ethnispirit est une invitation à renouer avec un
              héritage culturel, à valoriser l'artisanat africain et à faire entrer chez
              vous des créations porteuses d'histoire, d'élégance et d'émotion.
            </p>
            <div style={{ display: 'flex', gap: 14, marginTop: 32, flexWrap: 'wrap' }}>
              <Link to="/catalogue" className="btn-hero-main">
                <i className="fa-solid fa-sparkles"></i>
                Voir la collection
              </Link>
              <Link to="/contact" className="btn-hero-ghost">
                Nous contacter
              </Link>
            </div>
          </div>
          <div className="eth-about-hero-img">
            <img
              src={aboutImg}
              alt="L'Afrique s'invite chez vous — EthniSpirit"
            />
          </div>
        </div>
      </section>

      {/* ── Chiffres ─────────────────────────────────────────────────── */}
      <section className="eth-about-numbers">
        <div className="eth-about-numbers-inner">
          {[
            { val: '200+', lbl: 'Articles' },
            { val: '4',    lbl: 'Catégories' },
            { val: '2',    lbl: 'Îles livrées' },
            { val: '100%', lbl: 'Authenticité' },
          ].map((s) => (
            <div className="eth-about-num" key={s.lbl}>
              <div className="eth-about-num-val">{s.val}</div>
              <div className="eth-about-num-label">{s.lbl}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ──────────────────────────────────────────────────── */}
      <section className="eth-about-mission">
        <div className="eth-about-mission-inner">
          <div className="eth-about-mission-img">
            <img
              src={missionImg}
              alt="Mode africaine"
              style={{ borderRadius: 'var(--r-lg)', width: '100%', aspectRatio: '1080 / 427', objectFit: 'cover' }}
            />
          </div>
          <div className="eth-about-mission-text">
            <p className="eth-section-label">Notre mission</p>
            <h2 className="eth-about-h2">
              Des pièces qui <em>racontent</em><br />une histoire
            </h2>
            <p className="eth-about-body">
              Nous sélectionnons avec soin des bijoux, vêtements, sacs et chaussures
              fabriqués par des artisans d'Afrique, garantissant authenticité,
              qualité et commerce éthique à chaque pièce.
            </p>
            <p className="eth-about-body">
              Chaque article témoigne de mains expertes, de traditions centenaires
              et d'un savoir-faire transmis de génération en génération — une invitation
              à porter la culture africaine avec fierté.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 24 }}>
              {[
                'Sélection rigoureuse directement chez les artisans',
                'Partenariats équitables et durables',
                'Contrôle qualité à chaque commande',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--text-mid)' }}>
                  <i className="fa-solid fa-check" style={{ color: 'var(--tc-classic)', fontSize: 12, width: 16 }}></i>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Valeurs ──────────────────────────────────────────────────── */}
      <section className="eth-about-values">
        <div className="eth-about-values-inner">
          <div style={{ textAlign: 'center', maxWidth: 480, margin: '0 auto 48px' }}>
            <p className="eth-section-label">Nos engagements</p>
            <h2 className="eth-section-title">Ce qui nous <em>distingue</em></h2>
          </div>
          <div className="eth-about-cards">
            {[
              {
                icon: 'fa-handshake',
                title: 'Commerce éthique',
                text: 'Nous travaillons directement avec les artisans pour garantir une rémunération juste et des conditions de travail dignes.',
              },
              {
                icon: 'fa-globe-africa',
                title: 'Origine authentique',
                text: 'Toutes nos pièces proviennent d\'artisans africains, garantissant une traçabilité complète.',
              },
              {
                icon: 'fa-gem',
                title: 'Qualité premium',
                text: 'Chaque article est sélectionné pour sa beauté, sa robustesse et sa singularité culturelle.',
              },
            ].map((item) => (
              <div className="eth-about-card" key={item.icon}>
                <div className="eth-about-icon-wrap">
                  <i className={`fa-solid ${item.icon}`}></i>
                </div>
                <h5>{item.title}</h5>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--brown)', padding: '64px 80px', textAlign: 'center',
      }}>
        <p className="eth-section-label" style={{ color: 'var(--tc-light)' }}>Rejoignez-nous</p>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 36, color: 'var(--cream)', marginBottom: 16 }}>
          Prêt à découvrir la collection ?
        </h3>
        <p style={{ color: 'rgba(233,216,201,.72)', maxWidth: 400, margin: '0 auto 32px', fontSize: 15 }}>
          Bijoux, vêtements, sacs et chaussures — des pièces uniques livrées aux Caraïbes.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/catalogue" className="btn-hero-main">
            <i className="fa-solid fa-arrow-right"></i>
            Explorer le catalogue
          </Link>
          <Link to="/bio" className="btn-hero-ghost">
            <i className="fa-solid fa-leaf me-2"></i>
            Univers Bio
          </Link>
        </div>
      </section>
    </div>
  );
}
