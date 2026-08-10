import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import FamilyIcon, { type FamilyIconName } from './_shared/FamilyIcon';
import { formatPersonName } from './_shared/theme';
import styles from './landing.module.css';

const FEATURES: { icon: FamilyIconName; title: string; text: string }[] = [
  { icon: 'calendar', title: 'Calendrier partagé', text: 'Gardes, rendez-vous et activités visibles par toute la famille.' },
  { icon: 'expenses', title: 'Dépenses claires', text: 'Suivez les frais partagés et gardez les justificatifs au même endroit.' },
  { icon: 'homework', title: 'Devoirs suivis', text: 'Chacun sait ce qui est fait, à faire et pour quel enfant.' },
  { icon: 'journal', title: 'Journal du quotidien', text: 'Conservez les petites informations qui comptent vraiment.' },
  { icon: 'messages', title: 'Messages apaisés', text: 'Échangez simplement sans disperser les conversations.' },
  { icon: 'family', title: 'Accès sur mesure', text: 'Invitez vos proches et choisissez précisément leurs accès.' },
];

const STEPS = [
  ['01', 'Créez votre foyer', 'Quelques informations suffisent pour ouvrir votre espace familial.'],
  ['02', 'Invitez vos proches', 'Ajoutez les personnes qui participent au quotidien et réglez leurs accès.'],
  ['03', 'Avancez ensemble', 'Retrouvez les informations utiles, sans messages perdus ni malentendus.'],
];

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);
  let connectedName = '';

  if (user?.email) {
    const { data: parent } = await supabase
      .from('parents')
      .select('name')
      .ilike('email', user.email.trim())
      .maybeSingle();
    connectedName = parent?.name ? formatPersonName(parent.name) : '';
  }

  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand}>Foyer<span>+</span></Link>
          <nav className={styles.links} aria-label="Navigation principale">
            <Link href="#fonctionnalites">Fonctionnalités</Link>
            <Link href="#comment-ca-marche">Comment ça marche</Link>
            <Link href="#commencer">Nous rejoindre</Link>
          </nav>
          <div className={styles.actions}>
            {!isLoggedIn && <Link href="/login" className={styles.buttonGhost}>Se connecter</Link>}
            <Link href={isLoggedIn ? '/dashboard' : '/signup'} className={styles.button}>{isLoggedIn ? connectedName || 'Mon espace' : 'Créer mon espace'}</Link>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div>
              <div className={styles.eyebrow}>L’organisation familiale, tout simplement</div>
              <h1>Le quotidien en famille, <span>plus léger.</span></h1>
              <p className={styles.lead}>Un espace doux et partagé pour organiser les rendez-vous, les dépenses, les devoirs et les échanges autour de vos enfants.</p>
              <div className={styles.heroActions}>
                <Link href={isLoggedIn ? '/dashboard' : '/signup'} className={styles.button}>{isLoggedIn ? 'Ouvrir mon tableau de bord' : 'Créer mon espace gratuitement'}</Link>
                {!isLoggedIn && <Link href="/login" className={styles.buttonGhost}>J’ai déjà un compte</Link>}
              </div>
              <div className={styles.trust}>Gratuit · Jusqu’à 4 proches · Vos accès restent privés</div>
            </div>

            <div className={styles.preview} aria-label="Aperçu du tableau de bord">
              <div className={styles.previewTop}>
                <div><small style={{ color: '#8b9bad' }}>Bonjour Camille</small><div className={styles.previewTitle}>Votre famille aujourd’hui</div></div>
                <div className={styles.avatars}><span className={styles.avatar} style={{ background: '#ff7b87' }}>C</span><span className={styles.avatar} style={{ background: '#48bdb2' }}>A</span></div>
              </div>
              <div className={styles.miniGrid}>
                <div className={styles.miniCard} style={{ background: '#ffe9ec' }}><FamilyIcon name="calendar" size={48}/><div><small style={{ color: '#bb5964' }}>PROCHAIN RDV</small><br/><strong>Dentiste · 16:30</strong></div></div>
                <div className={styles.miniCard} style={{ background: '#e1f8f5' }}><FamilyIcon name="expenses" size={48}/><div><small style={{ color: '#368e86' }}>EN ATTENTE</small><br/><strong>42,50 €</strong></div></div>
                <div className={styles.miniCard} style={{ background: '#fff2d2' }}><FamilyIcon name="homework" size={48}/><div><small style={{ color: '#9c721d' }}>DEVOIRS</small><br/><strong>2 à terminer</strong></div></div>
                <div className={styles.miniCard} style={{ background: '#eee8ff' }}><FamilyIcon name="messages" size={48}/><div><small style={{ color: '#7058a8' }}>MESSAGES</small><br/><strong>3 nouveaux</strong></div></div>
              </div>
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className={styles.section}>
          <div className={styles.sectionHead}><span>Tout est réuni</span><h2>Moins de charge mentale, plus de sérénité</h2><p>Les outils essentiels du quotidien dans une interface claire, agréable et accessible à tous vos proches.</p></div>
          <div className={styles.featureGrid}>{FEATURES.map((item) => <article className={styles.feature} key={item.title}><FamilyIcon name={item.icon} size={52}/><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
        </section>

        <section id="comment-ca-marche" className={styles.how}><div className={styles.howInner}><h2>Ensemble en trois étapes</h2><div className={styles.steps}>{STEPS.map(([n,title,text]) => <article className={styles.step} key={n}><b>{n}</b><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>

        <section id="commencer" className={styles.cta}><h2>Prêt à alléger votre quotidien ?</h2><p>Créez votre foyer partagé en moins de deux minutes.</p><Link href={isLoggedIn ? '/dashboard' : '/signup'} className={styles.button}>{isLoggedIn ? 'Accéder à mon espace' : 'Commencer gratuitement'}</Link></section>
      </main>

      <footer className={styles.footer}><strong>Foyer+</strong><span>Un espace familial partagé et serein.</span></footer>
    </div>
  );
}
