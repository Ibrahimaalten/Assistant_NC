import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

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
          onClick={() => navigate('/8d')}
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
    </div>
  );
}

export default Dashboard;
