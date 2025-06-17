import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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
    <div style={{ padding: '2rem', background: '#f8f9fa', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '2rem' }}>
        Liste des non-conformités {statut ? `(${statut})` : ''}
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <thead>
          <tr style={{ background: '#e3f2fd' }}>
            <th style={{ padding: '1rem' }}>ID</th>
            <th>Description</th>
            <th>Responsable</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Aucune non-conformité trouvée.</td></tr>
          ) : filtered.map(nc => (
            <tr key={nc.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '1rem' }}>{nc.id}</td>
              <td>{nc.descriptionInitiale}</td>
              <td>{nc.chefEquipe_prenom || ''} {nc.chefEquipe_nom || ''}</td>
              <td>
                <span style={{
                  color: nc.statut === 'En cours' ? '#008BBD' : '#43e97b',
                  fontWeight: 600
                }}>{nc.statut}</span>
              </td>
              <td>
                <button onClick={() => navigate(`/resolution/${nc.id}`)} style={{
                  background: '#008BBD', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 16px', cursor: 'pointer', fontWeight: 500
                }}>
                  Voir / Modifier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => navigate('/dashboard')} style={{ marginTop: '2rem', background: '#43e97b', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 600, cursor: 'pointer' }}>
        Retour au Dashboard
      </button>
    </div>
  );
}

export default ListeNonConformites;
