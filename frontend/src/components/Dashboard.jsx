import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// TODO: Remplacer ce mock par un appel API réel
const mockNonConformites = [
  { id: 1, description: "Problème A", responsable: "Alice", statut: "En cours" },
  { id: 2, description: "Problème B", responsable: "Bob", statut: "En cours" },
];

function Dashboard() {
  const [nonConformites, setNonConformites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Remplacer par fetch('/api/nonconformites') plus tard
    setNonConformites(mockNonConformites);
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard Non-Conformités</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Description</th>
            <th>Responsable</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {nonConformites.map(nc => (
            <tr key={nc.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td>{nc.id}</td>
              <td>{nc.description}</td>
              <td>{nc.responsable}</td>
              <td>{nc.statut}</td>
              <td>
                <button onClick={() => navigate(`/resolution/${nc.id}`)}>
                  Voir / Modifier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => navigate('/resolution/new')}>
        Nouvelle Non-Conformité
      </button>
    </div>
  );
}

export default Dashboard;
