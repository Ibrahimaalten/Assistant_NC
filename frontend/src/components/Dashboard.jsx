import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';

const COLORS = ['#008BBD', '#43e97b'];

function Dashboard() {
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
    <div style={{ background: '#f8f9fa', minHeight: '100vh', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', fontWeight: 700, fontSize: '2.5rem', color: '#008BBD', marginBottom: 0 }}>Assistant NC</h1>
      <p style={{ textAlign: 'center', color: '#555', fontSize: '1.2rem', marginBottom: '2.5rem' }}>
        Bienvenue sur votre tableau de bord des non-conformités
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
        <button
          style={{
            background: '#008BBD', color: '#fff', border: 'none', borderRadius: '12px', padding: '1rem 2.5rem', fontWeight: 700, fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.10)', transition: 'background 0.2s', letterSpacing: 0.5, marginTop: '0.5rem'
          }}
          onClick={() => navigate('/')}
        >
          + Créer une nouvelle non-conformité
        </button>
      </div>
      {fetchError && (
        <div style={{ color: 'red', textAlign: 'center', marginBottom: '2rem', fontWeight: 600 }}>
          {fetchError}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
        <div
          onClick={() => navigate('/liste-nonconformites?statut=En%20cours')}
          style={{
            background: 'linear-gradient(135deg, #008BBD 60%, #00C6FB 100%)',
            color: '#fff',
            borderRadius: '24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            width: '320px',
            height: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            fontSize: '1.2rem',
          }}
        >
          <span style={{ fontSize: '4rem', fontWeight: 700 }}>{enCours.length}</span>
          <span style={{ fontWeight: 500, marginTop: '1rem' }}>Non-conformités en cours</span>
        </div>
        <div
          onClick={() => navigate('/liste-nonconformites?statut=Résolue')}
          style={{
            background: 'linear-gradient(135deg, #43e97b 60%, #38f9d7 100%)',
            color: '#fff',
            borderRadius: '24px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            width: '320px',
            height: '260px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            fontSize: '1.2rem',
          }}
        >
          <span style={{ fontSize: '4rem', fontWeight: 700 }}>{resolues.length}</span>
          <span style={{ fontWeight: 500, marginTop: '1rem' }}>Non-conformités résolues</span>
        </div>
      </div>
      {/* Nouvelles cards statistiques */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <StatCard color="#b39ddb" icon="⏳" label="Délai moyen de traitement" value="10 jours" />
        <StatCard color="#ffb74d" icon="📅" label="% NC traitées dans les délais" value="72%" />
        <StatCard color="#f06292" icon="🔄" label="Taux de récurrence des NC" value="7%" />
        <StatCard color="#ffd54f" icon="🏅" label="Score moyen permis de NC du service" value="3,8 / 5" />
      </div>
      {/* Section camembert + tableaux */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '2rem', minWidth: 340 }}>
          <h3 style={{ textAlign: 'center', color: '#008BBD', marginBottom: '1.5rem' }}>Catégorisation des NC</h3>
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '2.2rem', marginBottom: '0.5rem' }}>125</div>
          <ResponsiveContainer width={300} height={220}>
            <PieChart>
              <Pie data={catPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {catPieData.map((entry, index) => (
                  <Cell key={`cat-cell-${index}`} fill={catPieColors[index % catPieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '1.5rem', minWidth: 340 }}>
            <h3 style={{ textAlign: 'center', color: '#222', fontWeight: 700 }}>TOP 3</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
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
          <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '1.5rem', minWidth: 340 }}>
            <h3 style={{ textAlign: 'center', color: '#222', fontWeight: 700 }}>En difficulté</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '2rem', minWidth: 340 }}>
          <h3 style={{ textAlign: 'center', color: '#008BBD', marginBottom: '1.5rem' }}>Répartition globale</h3>
          <ResponsiveContainer width={300} height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '2rem', minWidth: 440 }}>
          <h3 style={{ textAlign: 'center', color: '#008BBD', marginBottom: '1.5rem' }}>Évolution mensuelle (exemple)</h3>
          <ResponsiveContainer width={400} height={220}>
            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mois" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="enCours" fill="#008BBD" name="En cours" />
              <Bar dataKey="resolues" fill="#43e97b" name="Résolues" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Ajout : Filtres rapides par période */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: '1px solid #008BBD', background: '#fff', color: '#008BBD', fontWeight: 600, cursor: 'pointer' }}>7 jours</button>
        <button style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: '1px solid #008BBD', background: '#fff', color: '#008BBD', fontWeight: 600, cursor: 'pointer' }}>30 jours</button>
        <button style={{ padding: '0.5rem 1.2rem', borderRadius: 8, border: '1px solid #008BBD', background: '#fff', color: '#008BBD', fontWeight: 600, cursor: 'pointer' }}>12 mois</button>
      </div>
      {/* Ajout : Graphique d'évolution temporelle (lignes) */}
      <div style={{ background: '#fff', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: '2rem', margin: '0 auto 2rem auto', maxWidth: 800 }}>
        <h3 style={{ textAlign: 'center', color: '#008BBD', marginBottom: '1.5rem' }}>Évolution des NC ouvertes et clôturées</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={evolutionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mois" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="ouvertes" stroke="#008BBD" name="Ouvertes" strokeWidth={3} />
            <Line type="monotone" dataKey="cloturees" stroke="#43e97b" name="Clôturées" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Ajout : Alertes NC en retard */}
      <div style={{ background: '#fff3e0', borderRadius: '14px', boxShadow: '0 2px 8px rgba(255,152,0,0.08)', padding: '1.5rem', margin: '0 auto 2rem auto', maxWidth: 600 }}>
        <h4 style={{ color: '#ff9800', marginBottom: 8 }}>⚠️ NC en retard à traiter</h4>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {ncRetard.map((nc, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <b>{nc.id}</b> – {nc.description} (Responsable : {nc.responsable})
            </li>
          ))}
        </ul>
      </div>
      {/* Ajout : Bouton export PDF */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', marginRight: 40 }}>
        <button style={{ background: '#008BBD', color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} onClick={() => alert('Fonction export PDF à implémenter')}>Exporter le dashboard en PDF</button>
      </div>
    </div>
  );
}

// Card statistique générique
function StatCard({ color, icon, label, value }) {
  return (
    <div style={{ background: color, color: '#fff', borderRadius: '18px', width: 260, height: 110, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', fontWeight: 600, fontSize: '1.1rem' }}>
      <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
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
const catPieColors = ['#1746a2', '#4dd0e1', '#ff9800', '#bdbdbd'];
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