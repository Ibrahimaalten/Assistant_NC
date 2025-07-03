import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { COLORS } from '../colors';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ListeNonConformites() {
  const [nonConformites, setNonConformites] = useState([]);
  const query = useQuery();
  const navigate = useNavigate();
  const statut = query.get('statut');

  useEffect(() => {
    fetch('http://localhost:8000/api/nonconformites')
      .then(res => res.json())
      .then(data => setNonConformites(data))
      .catch(() => setNonConformites([]));
  }, []);

  const filtered = statut ? nonConformites.filter(nc => nc.statut === statut) : nonConformites;

  return (
    <div style={{ padding: '2rem', background: COLORS.background, minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '2rem', color: COLORS.textGreen, fontWeight: 700 }}>
        Liste des non-conformités {statut ? `(${statut})` : ''}
      </h2>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: COLORS.white, borderRadius: '14px', boxShadow: '0 2px 12px rgba(35,57,93,0.08)', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: COLORS.gradientGreen }}>
            <th style={{ padding: '1rem', color: COLORS.white, fontWeight: 700, letterSpacing: 0.5 }}>ID</th>
            <th style={{ padding: '1rem', color: COLORS.white, fontWeight: 700, letterSpacing: 0.5 }}>Reference</th>

            <th style={{ color: COLORS.white, fontWeight: 700, letterSpacing: 0.5 }}>Description</th>
            <th style={{ color: COLORS.white, fontWeight: 700, letterSpacing: 0.5 }}>Responsable</th>
            <th style={{ color: COLORS.white, fontWeight: 700, letterSpacing: 0.5 }}>Statut</th>
            <th style={{ color: COLORS.white, fontWeight: 700, letterSpacing: 0.5 }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: COLORS.textGrey }}>Aucune non-conformité trouvée.</td></tr>
          ) : filtered.map((nc, idx) => (
            <tr key={nc.id} style={{ background: nc.statut === 'En cours' ? 'rgba(35,57,93,0.07)' : 'rgba(46,204,113,0.08)', borderBottom: `1px solid #e0e7ef` }}>
              <td style={{ padding: '1rem', color: COLORS.textDark }}>{nc.id}</td>
              <td style={{ padding: '1rem', color: COLORS.textDark }}>{nc.d0_initialisation.referenceNC}</td>

              <td style={{ color: COLORS.textGrey }}>{nc.d0_initialisation?.descriptionInitiale || ''}</td>
              <td style={{ color: COLORS.textGrey }}>{nc.d1_team?.chefEquipe?.prenom || ''} {nc.d1_team?.chefEquipe?.nom || ''}</td>
              <td>
                <span style={{
                  display: 'inline-block',
                  minWidth: 90,
                  textAlign: 'center',
                  background: nc.statut === 'En cours' ? COLORS.primaryGradient : COLORS.gradientGreen,
                  color: COLORS.white,
                  borderRadius: 12,
                  padding: '4px 0.7em',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  fontSize: '1rem',
                  boxShadow: '0 1px 4px rgba(35,57,93,0.07)'
                }}>{nc.statut}</span>
              </td>
              <td>
                <button onClick={() => navigate(`/resolution/${nc.id}`)} style={{
                  background: nc.statut === 'En cours' ? COLORS.primaryDark : COLORS.accentGreen,
                  color: COLORS.white, border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontWeight: 500,
                  transition: 'background 0.2s', boxShadow: '0 1px 4px rgba(35,57,93,0.07)'
                }}>
                  Voir / Modifier
                </button>
                <button onClick={async () => {
                  if(window.confirm('Supprimer cette non-conformité ?')) {
                    await fetch(`http://localhost:8000/api/nonconformites/${nc.id}`, { method: 'DELETE' });
                    setNonConformites(ncs => ncs.filter(n => n.id !== nc.id));
                  }
                }} style={{
                  marginLeft: 8,
                  background: COLORS.error,
                  color: COLORS.white,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 16px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background 0.2s',
                  boxShadow: '0 1px 4px rgba(35,57,93,0.07)'
                }}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => navigate('/dashboard')} style={{ marginTop: '2rem', background: COLORS.textGreen, color: COLORS.white, border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 8px rgba(35,57,93,0.08)' }}>
        Retour au Dashboard
      </button>
    </div>
  );
}

export default ListeNonConformites;
