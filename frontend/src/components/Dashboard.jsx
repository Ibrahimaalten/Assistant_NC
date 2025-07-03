import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import { COLORS } from '../colors';

// Palette pour les graphes et stats
const PIE_COLORS = [COLORS.accentBlue, COLORS.accentGreen];
const CAT_PIE_COLORS = [COLORS.primaryDark, COLORS.accentBlue, COLORS.accentGreen, '#bdbdbd'];

const Dashboard = () => {
  const [nonConformites, setNonConformites] = useState([]);
  const [fetchError, setFetchError] = useState(null); // Ajout pour l'erreur
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8000/api/nonconformites')
      .then(res => {
        if (!res.ok) throw new Error('API non accessible');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setNonConformites(data);
          setFetchError(null);
        } else {
          setNonConformites([]);
          setFetchError('Format inattendu de la réponse API');
        }
      })
      .catch((err) => {
        setNonConformites([]);
        setFetchError('Impossible de charger les non-conformités (API non disponible)');
      });
  }, []);

  const enCours = Array.isArray(nonConformites) ? nonConformites.filter(nc => nc.statut === 'En cours') : [];
  const resolues = Array.isArray(nonConformites) ? nonConformites.filter(nc => nc.statut === 'Résolue') : [];

  const pieData = [
    { name: 'En cours', value: enCours.length },
    { name: 'Résolues', value: resolues.length },
  ];

  // Exemple statique pour le bar chart (à remplacer par des vraies stats plus tard)
  const barData = [
    { mois: 'Jan', enCours: 2, resolues: 1 },
    { mois: 'Fév', enCours: 1, resolues: 2 },
    { mois: 'Mar', enCours: 3, resolues: 2 },
    { mois: 'Avr', enCours: 2, resolues: 3 },
    { mois: 'Mai', enCours: 1, resolues: 4 },
  ];

  return (
    <div style={{ background: COLORS.background, minHeight: '100vh', padding: '2rem', fontFamily: 'Segoe UI, Roboto, Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2.3rem', color: COLORS.textDark, marginBottom: 0, letterSpacing: 1 }}>Tableau de bord Non-Conformités</h1>
      <p style={{ textAlign: 'center', color: COLORS.textGrey, fontSize: '1.1rem', marginBottom: '2.5rem', fontWeight: 500 }}>
        Suivi et pilotage des non-conformités – vue synthétique et professionnelle
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <button
          style={{
            background: COLORS.textDark, color: COLORS.white, border: 'none', borderRadius: '10px', padding: '0.8rem 2.2rem', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,35,126,0.08)', transition: 'background 0.2s', letterSpacing: 0.5, marginTop: '0.5rem'
          }}
          onClick={() => navigate('/')}
        >
          + Nouvelle non-conformité
        </button>
      </div>
      {fetchError && (
        <div style={{ color: COLORS.error, textAlign: 'center', marginBottom: '2rem', fontWeight: 600 }}>
          {fetchError}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        {/* NC en cours */}
        <div
          onClick={() => navigate('/liste-nonconformites?statut=En%20cours')}
          style={{
            background: COLORS.primaryGradient,
            color: COLORS.white,
            borderRadius: '18px',
            boxShadow: '0 2px 12px rgba(26,35,126,0.10)',
            width: '260px',
            height: '140px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.1rem',
            marginBottom: 12
          }}
        >
          <span style={{ fontSize: '2.7rem', fontWeight: 700 }}>{enCours.length}</span>
          <span style={{ fontWeight: 500, marginTop: '0.7rem', letterSpacing: 0.2 }}>NC en cours</span>
        </div>
        {/* NC résolues */}
        <div
          onClick={() => navigate('/liste-nonconformites?statut=Résolue')}
          style={{
            background: COLORS.gradientGreen,
            color: COLORS.white,
            borderRadius: '18px',
            boxShadow: '0 2px 12px rgba(46,125,50,0.10)',
            width: '260px',
            height: '140px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.1rem',
            marginBottom: 12
          }}
        >
          <span style={{ fontSize: '2.7rem', fontWeight: 700 }}>{resolues.length}</span>
          <span style={{ fontWeight: 500, marginTop: '0.7rem', letterSpacing: 0.2 }}>NC résolues</span>
        </div>
        {/* Statistiques */}
        <StatCard color={COLORS.background} textColor={COLORS.textDark} icon="⏳" label="Délai moyen" value="10 jours" />
        <StatCard color={COLORS.background} textColor={COLORS.textDark} icon="📅" label="% dans les délais" value="72%" />
        <StatCard color={COLORS.background} textColor={COLORS.accentGreen} icon="🔄" label="Taux de récurrence" value="7%" />
        <StatCard color={COLORS.background} textColor={COLORS.accentBlue} icon="🏅" label="Score moyen NC" value="3,8 / 5" />
      </div>
      {/* Section camembert + tableaux */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <div style={{ background: COLORS.white, borderRadius: '14px', boxShadow: '0 2px 8px rgba(35,57,93,0.06)', padding: '2rem', minWidth: 340 }}>
          <h3 style={{ textAlign: 'center', color: COLORS.textDark, marginBottom: '1.2rem', fontWeight: 700, letterSpacing: 0.5 }}>Catégorisation des NC</h3>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '2rem', marginBottom: '0.5rem', color: COLORS.primaryDark }}>125</div>
          <ResponsiveContainer width={300} height={220}>
            <PieChart>
              <Pie data={catPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {catPieData.map((entry, index) => (
                  <Cell key={`cat-cell-${index}`} fill={CAT_PIE_COLORS[index % CAT_PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: COLORS.white, borderRadius: '14px', boxShadow: '0 2px 8px rgba(35,57,93,0.06)', padding: '1.5rem', minWidth: 340 }}>
            <h3 style={{ textAlign: 'center', color: COLORS.textDark, fontWeight: 700, letterSpacing: 0.5 }}>TOP 3</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
              <thead>
                <tr style={{ background: COLORS.background }}>
                  <th>Collaborateurs</th><th>Niveau</th><th>NC traitées</th><th>Score moyen</th>
                </tr>
              </thead>
              <tbody>
                {top3.map((row, i) => (
                  <tr key={i} style={{ textAlign: 'center' }}>
                    <td>{row.nom}</td><td>{row.niveau}</td><td>{row.nc}</td><td>{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: COLORS.white, borderRadius: '14px', boxShadow: '0 2px 8px rgba(35,57,93,0.06)', padding: '1.5rem', minWidth: 340 }}>
            <h3 style={{ textAlign: 'center', color: COLORS.error, fontWeight: 700, letterSpacing: 0.5 }}>En difficulté</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
              <thead>
                <tr style={{ background: COLORS.background }}>
                  <th>Collaborateurs</th><th>Niveau</th><th>NC traitées</th><th>Score moyen</th>
                </tr>
              </thead>
              <tbody>
                {difficulte.map((row, i) => (
                  <tr key={i} style={{ textAlign: 'center' }}>
                    <td>{row.nom}</td><td>{row.niveau}</td><td>{row.nc}</td><td>{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* Graphiques et alertes */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2.5rem', flexWrap: 'wrap' }}>
        <div style={{ background: COLORS.white, borderRadius: '14px', boxShadow: '0 2px 8px rgba(35,57,93,0.06)', padding: '2rem', minWidth: 340 }}>
          <h3 style={{ textAlign: 'center', color: COLORS.textDark, marginBottom: '1.2rem', fontWeight: 700, letterSpacing: 0.5 }}>Répartition globale</h3>
          <ResponsiveContainer width={300} height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: COLORS.white, borderRadius: '14px', boxShadow: '0 2px 8px rgba(35,57,93,0.06)', padding: '2rem', minWidth: 440 }}>
          <h3 style={{ textAlign: 'center', color: COLORS.textDark, marginBottom: '1.2rem', fontWeight: 700, letterSpacing: 0.5 }}>Évolution mensuelle</h3>
          <ResponsiveContainer width={400} height={220}>
            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="enCours" fill={COLORS.primaryDark} name="En cours" />
              <Bar dataKey="resolues" fill={COLORS.accentGreen} name="Résolues" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Filtres et alertes */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: `1px solid ${COLORS.textDark}`, background: COLORS.white, color: COLORS.textDark, fontWeight: 600, cursor: 'pointer' }}>7 jours</button>
        <button style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: `1px solid ${COLORS.textDark}`, background: COLORS.white, color: COLORS.textDark, fontWeight: 600, cursor: 'pointer' }}>30 jours</button>
        <button style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: `1px solid ${COLORS.textDark}`, background: COLORS.white, color: COLORS.textDark, fontWeight: 600, cursor: 'pointer' }}>12 mois</button>
      </div>
      <div style={{ background: COLORS.background, borderRadius: '12px', boxShadow: '0 2px 8px rgba(35,57,93,0.08)', padding: '1.2rem', margin: '0 auto 2rem auto', maxWidth: 600 }}>
        <h4 style={{ color: COLORS.textDark, marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>⚠️ NC en retard à traiter</h4>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {ncRetard.map((nc, i) => (
            <li key={i} style={{ marginBottom: 4, fontWeight: 500, color: COLORS.error }}>
              <b>{nc.id}</b> – {nc.description} (Responsable : {nc.responsable})
            </li>
          ))}
        </ul>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', marginRight: 40 }}>
        <button style={{ background: COLORS.textDark, color: COLORS.white, border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,35,126,0.08)' }} onClick={() => alert('Fonction export PDF à implémenter')}>Exporter le dashboard en PDF</button>
      </div>
    </div>
  );
}

// Card statistique générique
function StatCard({ color, textColor, icon, label, value }) {
  return (
    <div style={{ background: color, color: textColor, borderRadius: '14px', width: 200, height: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(26,35,126,0.08)', fontWeight: 600, fontSize: '1rem', marginBottom: 12 }}>
      <div style={{ fontSize: '1.7rem', marginBottom: 2 }}>{icon}</div>
      <div style={{ fontSize: '1rem', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

// Données mockées pour les nouveaux éléments
const catPieData = [
  { name: 'QUALITÉ', value: 80 },
  { name: 'PRODUCTION', value: 25 },
  { name: 'SÉCURITÉ', value: 15 },
  { name: 'AUTRE', value: 5 },
];
const top3 = [
  { nom: 'Mathieu', niveau: 4, nc: 32, score: '4,8/5' },
  { nom: 'Kevin', niveau: 4, nc: 23, score: '4,6/5' },
  { nom: 'Paul', niveau: 3, nc: 16, score: '4,2/5' },
];
const difficulte = [
  { nom: 'Julien', niveau: 1, nc: 15, score: '1,5/5' },
  { nom: 'Johanna', niveau: 1, nc: 8, score: '1,8/5' },
  { nom: '???', niveau: 1, nc: 5, score: '2/5' },
];
// Données mockées pour l'évolution temporelle
const evolutionData = [
  { mois: 'Jan', ouvertes: 12, cloturees: 8 },
  { mois: 'Fév', ouvertes: 10, cloturees: 9 },
  { mois: 'Mar', ouvertes: 15, cloturees: 12 },
  { mois: 'Avr', ouvertes: 9, cloturees: 14 },
  { mois: 'Mai', ouvertes: 8, cloturees: 13 },
  { mois: 'Juin', ouvertes: 7, cloturees: 10 },
];
// Données mockées pour les NC en retard
const ncRetard = [
  { id: 'NC-039', description: 'Problème de conformité sur lot 2025A', responsable: 'Julien' },
  { id: 'NC-041', description: 'Retard analyse sécurité', responsable: 'Paul' },
];

export default Dashboard;