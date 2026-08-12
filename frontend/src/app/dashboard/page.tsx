import Link from 'next/link';
import { requireHousehold, canAccessSection } from '@/lib/household';
import Sidebar from '../_shared/Sidebar';
import UserMenu from './UserMenu';
import FamilyIcon, { type FamilyIconName } from '../_shared/FamilyIcon';
import { PALETTE, capitalize } from '../_shared/theme';
import styles from './dashboard.module.css';

function parseDate(s: string) { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d); }
function fmtShort(d: Date) { return capitalize(d.toLocaleDateString('fr-FR',{ day:'2-digit', month:'short' })); }
function fmtFull(d: Date) { return capitalize(d.toLocaleDateString('fr-FR',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })); }

function StatCard({ bg, color, label, value, icon, href }: { bg:string;color:string;label:string;value:string;icon:FamilyIconName;href:string }) {
  return <Link href={href} className={styles.stat} style={{ background:bg }}><FamilyIcon name={icon} size={54}/><div><small style={{ color }}>{label}</small><strong>{value}</strong></div></Link>;
}

export default async function DashboardPage() {
  const { supabase, ownParent, householdId, parents, children } = await requireHousehold();
  const myName = ownParent?.name ?? parents[0]?.name ?? '';
  const others = parents.filter(p => p.id !== ownParent?.id);
  const canCalendar = canAccessSection(ownParent,'calendar');
  const canExpenses = canAccessSection(ownParent,'expenses');
  const canHomework = canAccessSection(ownParent,'homework');
  const canJournal = canAccessSection(ownParent,'journal');
  const canMessages = canAccessSection(ownParent,'messages');
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);

  let upcomingEvents: { id:string;title:string;date:Date;type:string;color:string|null }[] = [];
  if (householdId && canCalendar) {
    const { data } = await supabase.from('events').select('*').eq('household_id',householdId).gte('event_date',todayStr).order('event_date').limit(3);
    upcomingEvents = (data ?? []).map(ev => ({ id:ev.id,title:ev.title,date:parseDate(ev.event_date),type:ev.event_type,color:ev.color }));
  }
  const childName = (id:string|null) => children.find(c => c.id === id)?.name;
  const parentName = (id:string|null) => parents.find(p => p.id === id)?.name ?? 'Parent';
  let pendingHomeworkCount=0, pendingAmount=0, messagesCount=0;
  let journal: { id:string;author:string;child?:string;date:Date;text:string }[]=[];

  if (householdId) {
    const [{count:hw},{data:jData},{data:eData},{count:msg}] = await Promise.all([
      canHomework ? supabase.from('homework').select('*',{count:'exact',head:true}).eq('household_id',householdId).neq('status','done') : Promise.resolve({count:0}),
      canJournal ? supabase.from('journal_entries').select('id, text, entry_date, author_id, child_id').eq('household_id',householdId).order('entry_date',{ascending:false}).limit(3) : Promise.resolve({data:[]}),
      canExpenses ? supabase.from('expenses').select('amount').eq('household_id',householdId).eq('status','pending') : Promise.resolve({data:[]}),
      canMessages ? supabase.from('messages').select('*',{count:'exact',head:true}).eq('household_id',householdId) : Promise.resolve({count:0}),
    ]);
    pendingHomeworkCount=hw ?? 0; pendingAmount=(eData ?? []).reduce((s,e)=>s+Number(e.amount),0); messagesCount=msg ?? 0;
    journal=(jData ?? []).map(j=>({id:j.id,author:parentName(j.author_id),child:childName(j.child_id),date:parseDate(j.entry_date),text:j.text}));
  }
  const nextEvent=upcomingEvents[0];
  const avatarEntries = await Promise.all(parents.map(async (parent) => {
    if (!parent.avatar_path) return [parent.id, null] as const;
    const { data } = await supabase.storage.from('avatars').createSignedUrl(parent.avatar_path, 3600);
    return [parent.id, data?.signedUrl ?? null] as const;
  }));
  const avatarUrls = new Map(avatarEntries);

  return <div className="pageShell" style={{ minHeight:'100vh',background:PALETTE.bgGradient,fontFamily:'var(--font-body)',color:PALETTE.text }}>
    <Sidebar active="/dashboard" ownParent={ownParent}/>
    <main className={`pageContent ${styles.content}`}>
      <header className={styles.top}><div className={styles.welcome}><small>{fmtFull(today)}</small><h1>Bonjour {myName} 👋</h1></div><div className={styles.people}>{others.map((p,i)=><span key={p.id} className={styles.person} title={p.name} style={{background:i%2?PALETTE.purple:PALETTE.teal,overflow:'hidden'}}>{avatarUrls.get(p.id)?<img src={avatarUrls.get(p.id)!} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:p.name.charAt(0).toLocaleUpperCase('fr-FR')}</span>)}<UserMenu name={myName} photoUrl={ownParent ? avatarUrls.get(ownParent.id) : null}/></div></header>

      <section className={styles.hero}><div className={styles.heroLabel}>VOTRE FOYER AUJOURD’HUI</div><h2>{nextEvent ? `${nextEvent.title}, ${fmtShort(nextEvent.date)}` : 'Une journée bien organisée commence ici'}</h2><p>{nextEvent ? 'Votre prochain événement est prêt dans le calendrier.' : 'Aucun événement à venir. Profitez de ce moment calme.'}</p></section>

      <section className={styles.stats} aria-label="Résumé du foyer">
        {canCalendar && <StatCard href="/calendar" bg={PALETTE.coralBg} color={PALETTE.coralText} label="PROCHAIN RDV" value={nextEvent ? fmtShort(nextEvent.date) : 'Rien de prévu'} icon="calendar"/>}
        {canExpenses && <StatCard href="/expenses" bg={PALETTE.tealBg} color={PALETTE.tealText} label="EN ATTENTE" value={`${pendingAmount.toFixed(2)} €`} icon="expenses"/>}
        {canHomework && <StatCard href="/homework" bg={PALETTE.goldBg} color={PALETTE.goldText} label="DEVOIRS" value={`${pendingHomeworkCount} à faire`} icon="homework"/>}
        {canMessages && <StatCard href="/messages" bg={PALETTE.purpleBg} color={PALETTE.purpleText} label="MESSAGES" value={`${messagesCount} échanges`} icon="messages"/>}
      </section>

      <div className={styles.mainGrid}>
        {canCalendar && <section className={styles.panel}><div className={styles.panelHead}><h3>Les prochains rendez-vous</h3><Link href="/calendar">Voir le calendrier →</Link></div>{upcomingEvents.length===0?<p className={styles.empty}>Rien de prévu pour le moment.</p>:upcomingEvents.map(ev=><div className={styles.event} key={ev.id}><div className={styles.date}>{ev.date.getDate()}<small>{ev.date.toLocaleDateString('fr-FR',{month:'short'})}</small></div><div className={styles.eventInfo}><strong>{ev.title}</strong><span>{ev.type}</span></div></div>)}</section>}
        <aside className={styles.panel}><div className={styles.panelHead}><h3>Dernières nouvelles</h3>{canJournal&&<Link href="/journal">Tout voir →</Link>}</div><div className={styles.notes}>{journal.length===0?<p className={styles.empty}>Aucune observation récente.</p>:journal.map(j=><div className={styles.note} key={j.id}><strong>{j.author}{j.child?` · ${j.child}`:''}</strong><br/>{j.text}</div>)}</div><div className={styles.quick}>{canMessages&&<Link href="/messages">Écrire un message</Link>}{canHomework&&<Link href="/homework">Voir les devoirs</Link>}</div></aside>
      </div>
    </main>
  </div>;
}
