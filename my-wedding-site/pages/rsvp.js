import { useState, useEffect, useRef } from 'react';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Layout from '../components/Layout';

export default function RSVP() {
  const { t } = useTranslation(['common', 'rsvp']);
  const confettiRef = useRef(null);
  const [form, setForm] = useState({ name: '', attending: 'Yes', dietary: '' });
  const [contactEmail, setContactEmail] = useState('');
  const [status, setStatus] = useState('idle');

  // Invitation lookup state
  const [searchName, setSearchName] = useState('');
  const [searchStatus, setSearchStatus] = useState('idle'); // idle | loading | done | none
  const [matches, setMatches] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [partyResponses, setPartyResponses] = useState([]); // [{name, attending, dietary, staying}]

  const checkInvite = async (e) => {
    e.preventDefault();
    setSearchStatus('loading');
    setMatches([]);
    try {
      const res = await fetch('/api/guest-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: searchName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      const found = Array.isArray(data.matches) ? data.matches : [];
      setMatches(found);
      if (found.length === 1) {
        const g = found[0];
        setSelectedGuest(g);
        setForm((prev) => ({ ...prev, name: g.name }));
        if (Array.isArray(g.partyMembers) && g.partyMembers.length) {
          setPartyResponses(g.partyMembers.map((n)=>({ name: n, attending: 'Yes', dietary: '', staying: '' })));
        } else {
          setPartyResponses([{ name: g.name, attending: 'Yes', dietary: '', staying: '' }]);
        }
      }
      setSearchStatus(found.length ? 'done' : 'none');
    } catch (err) {
      console.error(err);
      setSearchStatus('none');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
      setStatus('loading');
    try {
      const payload = partyResponses && partyResponses.length
        ? { responses: partyResponses.map((r)=>({ Name: r.name, Attending: r.attending, DietaryRestrictions: r.dietary, Staying: r.staying })), ContactEmail: contactEmail || undefined }
        : { Name: form.name, Attending: form.attending, DietaryRestrictions: form.dietary, ContactEmail: contactEmail || undefined };
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setStatus('success');
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
      setForm({ name: '', attending: 'Yes', dietary: '' });
      setContactEmail('');
      setPartyResponses([]);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  // Fire a quick celebratory confetti when RSVP succeeds
  useEffect(() => {
    if (status !== 'success') return;
    let mounted = true;
    (async () => {
      try {
        const confetti = confettiRef.current || (await import('canvas-confetti')).default;
        if (!mounted) return;
        confettiRef.current = confetti;
        const irish = ['#169B62', '#FFFFFF', '#FF8F00'];
        const french = ['#0055A4', '#FFFFFF', '#ED2939'];
        // Center pop
        confetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0.35 }, colors: [...irish, ...french], startVelocity: 55, gravity: 0.95 });
        // Side cannons
        confetti({ particleCount: 70, angle: 60, spread: 65, origin: { x: 0, y: 0.6 }, startVelocity: 55, drift: 0.6, gravity: 0.95, colors: irish });
        confetti({ particleCount: 70, angle: 120, spread: 65, origin: { x: 1, y: 0.6 }, startVelocity: 55, drift: -0.6, gravity: 0.95, colors: french });
      } catch {}
    })();
    return () => { mounted = false; };
  }, [status]);

  return (
    <Layout>
      <section className="rsvpWrap" data-reveal>
        {status !== 'success' && (
          <>
            <header className="sectionTitle">
              <h2>{t('rsvp:heading')}</h2>
              <p className="muted">{t('rsvp:subtitle')}</p>
            </header>

            <div className="steps">
              <div className={`step ${!selectedGuest ? 'active' : 'done'}`}>
                <span className="num">1</span>
                <span>{t('rsvp:stepCheck')}</span>
              </div>
              <div className={`step ${selectedGuest ? 'active' : ''}`}>
                <span className="num">2</span>
                <span>{t('rsvp:stepRsvp')}</span>
              </div>
            </div>
          </>
        )}

        {!selectedGuest && (
          <div className="card">
            <form className="form" onSubmit={checkInvite}>
              <h3 style={{ marginTop: 0 }}>{t('rsvp:checkHeading')}</h3>
              <div className="formGrid">
                <label className="label">
                  {t('rsvp:checkName')}
                  <input className="input" placeholder="e.g. Alice Johnson" value={searchName} onChange={(e)=>setSearchName(e.target.value)} required />
                  <div className="help">Type your full name as it may appear on the invite.</div>
                </label>
              </div>
              <div className="actions">
                <button className="button" disabled={searchStatus==='loading'}>
                  {searchStatus==='loading' ? t('rsvp:submitting') : t('rsvp:checkButton')}
                </button>
              </div>
            </form>

            {searchStatus==='none' && (
              <div className="banner error">{t('rsvp:checkNoMatch')}</div>
            )}

            {searchStatus==='done' && matches.length > 1 && (
              <div className="matchList">
                <p className="muted" style={{ marginTop: 0 }}>{t('rsvp:checkMatches')}</p>
                <div className="chips">
                  {matches.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setSelectedGuest(m);
                        setForm((prev)=>({ ...prev, name: m.name }));
                        setPartyResponses(Array.isArray(m.partyMembers) && m.partyMembers.length
                          ? m.partyMembers.map((n)=>({ name: n, attending: 'Yes', dietary: '', staying: '' }))
                          : [{ name: m.name, attending: 'Yes', dietary: '', staying: '' }]);
                      }}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedGuest && status !== 'success' && (
          <div className="banner success" role="status">
            <strong>{t('rsvp:invited')}</strong>
          </div>
        )}

        {selectedGuest && status !== 'success' && (
          <div className="card">
            <form className="form" onSubmit={submit}>
              <div className="formGrid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 2fr) 180px 180px', gap: '1rem', alignItems: 'center' }}>
                    <div className="muted" style={{ fontWeight: 600 }}>{t('rsvp:member')}</div>
                    <div className="muted" style={{ fontWeight: 600 }}>{t('rsvp:attending')}</div>
                    <div className="muted" style={{ fontWeight: 600 }}>{t('rsvp:memberStaying')}</div>
                  </div>
                </div>
                {partyResponses.map((p, idx) => (
                  <div key={idx} className="partyRow" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 2fr) 180px 180px', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <input aria-label={t('rsvp:member')} className="input" value={p.name} disabled />
                      </div>
                      <div>
                        <select aria-label={t('rsvp:attending')} value={p.attending} onChange={(e)=>{
                          const v = e.target.value; setPartyResponses((prev)=> prev.map((r,i)=> i===idx ? { ...r, attending: v } : r));
                        }}>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                      </div>
                      <div>
                        <select aria-label={t('rsvp:memberStaying')} value={p.staying} onChange={(e)=>{
                          const v = e.target.value; setPartyResponses((prev)=> prev.map((r,i)=> i===idx ? { ...r, staying: v } : r));
                        }}>
                          <option value="">{t('rsvp:selectOption')}</option>
                          <option>{t('rsvp:stayingYesCamping')}</option>
                          <option>{t('rsvp:stayingYesBedInDorm')}</option>
                          <option>{t('rsvp:stayingNo')}</option>
                        </select>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label className="label" style={{ margin: 0 }}>
                          <span className="muted" style={{ fontWeight: 600 }}>{t('rsvp:memberDietary')}</span>
                          <input aria-label={t('rsvp:memberDietary')} className="input" placeholder="Vegetarian, gluten-free, etc." value={p.dietary} onChange={(e)=>{
                            const v = e.target.value; setPartyResponses((prev)=> prev.map((r,i)=> i===idx ? { ...r, dietary: v } : r));
                          }} />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                  <div className="label" style={{ maxWidth: 520 }}>
                    {t('rsvp:contactEmail')}
                    <input type="email" className="input" placeholder="you@example.com" value={contactEmail} onChange={(e)=>setContactEmail(e.target.value)} />
                    <div className="help">{t('rsvp:contactEmailHelp')}</div>
                  </div>
                </div>
              </div>
              <div className="actions">
                <button type="submit" className="button" disabled={status==='loading'}>
                  {status === 'loading' ? t('rsvp:submitting') : t('rsvp:submit')}
                </button>
              </div>
              {status === 'loading' && <div className="banner" style={{ marginTop: '0.75rem' }}>{t('rsvp:submitting')}</div>}
              {status === 'error' && <div className="banner error" style={{ marginTop: '0.75rem' }}>{t('rsvp:error')}</div>}
            </form>
          </div>
        )}
        {selectedGuest && status === 'success' && (
          <div className="card">
            <div className="banner success" role="status" style={{ marginTop: 0 }}>
              {t('rsvp:success')}
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'rsvp'])),
    },
  };
}
