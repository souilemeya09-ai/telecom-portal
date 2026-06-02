// components/StructuredAnswer.jsx
import React from 'react';

export default function StructuredAnswer({ answer }) {
  // Fonction pour parser la réponse markdown en composants
  const parseAnswer = (text) => {
    if (!text) return null;

    const sections = {
      summary: '',
      offers: [],
      comparison: '',
      nextSteps: []
    };

    // Extraire le résumé (premier paragraphe après le titre)
    const summaryMatch = text.match(/(?:###\s*Connexion.*?\n)(.*?)(?=\n\n|###|\|)/s);
    if (summaryMatch) {
      sections.summary = summaryMatch[1].trim();
    }

    // Extraire les offres des tableaux
    const offerRows = [];
    const lines = text.split('\n');
    let inTable = false;
    let headers = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Détecter le début d'un tableau
      if (line.includes('|') && line.includes('Offre')) {
        inTable = true;
        headers = line.split('|').map(h => h.trim()).filter(h => h);
        i++; // Passer la ligne de séparation
        continue;
      }
      
      // Lire les lignes du tableau
      if (inTable && line.includes('|') && !line.includes('---')) {
        const cells = line.split('|').map(c => c.trim()).filter(c => c);
        if (cells.length >= 3) {
          offerRows.push({
            name: cells[0],
            type: cells[1] || '',
            price: cells[2] || '',
            features: cells[3] || '',
            why: cells[4] || ''
          });
        }
      }
      
      // Fin du tableau
      if (inTable && !line.includes('|') && line.trim() !== '') {
        inTable = false;
      }
      
      // Extraire les étapes suivantes
      if (line.includes('Étapes suivantes') || line.includes('#### Étapes')) {
        let j = i + 1;
        while (j < lines.length && lines[j].trim()) {
          const stepMatch = lines[j].match(/\d+\.\s*(.*)/);
          if (stepMatch) {
            sections.nextSteps.push(stepMatch[1]);
          }
          j++;
        }
      }
    }
    
    sections.offers = offerRows;
    
    return sections;
  };

  const parsed = parseAnswer(answer);
  
  if (!parsed) {
    return <div style={styles.answerText}>{answer}</div>;
  }

  return (
    <div style={styles.container}>
      {/* Résumé */}
      {parsed.summary && (
        <div style={styles.summary}>
          <h3 style={styles.summaryTitle}>📋 Résumé</h3>
          <p>{parsed.summary}</p>
        </div>
      )}
      
      {/* Offres recommandées */}
      {parsed.offers.length > 0 && (
        <div style={styles.offersSection}>
          <h3 style={styles.sectionTitle}>🎯 Offres recommandées</h3>
          <div style={styles.offersGrid}>
            {parsed.offers.map((offer, idx) => (
              <div key={idx} style={styles.offerCard}>
                <div style={styles.offerHeader}>
                  <h4 style={styles.offerName}>{offer.name}</h4>
                  <span style={styles.offerType}>{offer.type}</span>
                </div>
                <div style={styles.offerPrice}>
                  <span style={styles.priceAmount}>{offer.price}</span>
                  <span style={styles.priceUnit}>DT/mois</span>
                </div>
                <div style={styles.offerFeatures}>
                  <strong>Services clés :</strong>
                  <ul style={styles.featuresList}>
                    {offer.features.split('•').map((feature, i) => 
                      feature.trim() && <li key={i}>{feature.trim()}</li>
                    )}
                  </ul>
                </div>
                <div style={styles.offerWhy}>
                  <strong>Pourquoi cette offre :</strong>
                  <p>{offer.why}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Étapes suivantes */}
      {parsed.nextSteps.length > 0 && (
        <div style={styles.nextSteps}>
          <h3 style={styles.sectionTitle}>📝 Prochaines étapes</h3>
          <ol style={styles.stepsList}>
            {parsed.nextSteps.map((step, idx) => (
              <li key={idx} style={styles.step}>{step}</li>
            ))}
          </ol>
        </div>
      )}
      
      {/* Réponse complète en markdown (optionnel) */}
      <details style={styles.details}>
        <summary style={styles.detailsSummary}>📄 Voir la réponse complète</summary>
        <div style={styles.fullResponse}>{answer}</div>
      </details>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  summary: {
    padding: '16px',
    backgroundColor: '#e0f2fe',
    borderRadius: '8px',
    borderLeft: '4px solid #0284c7',
  },
  summaryTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#1e293b',
  },
  offersSection: {
    marginTop: '8px',
  },
  offersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  offerCard: {
    padding: '20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
  },
  offerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  offerName: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#0f172a',
  },
  offerType: {
    padding: '4px 12px',
    backgroundColor: '#dbeafe',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    color: '#1e40af',
  },
  offerPrice: {
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e2e8f0',
  },
  priceAmount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#059669',
  },
  priceUnit: {
    fontSize: '14px',
    color: '#64748b',
    marginLeft: '4px',
  },
  offerFeatures: {
    marginBottom: '12px',
  },
  featuresList: {
    margin: '8px 0 0 20px',
    padding: 0,
  },
  offerWhy: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e2e8f0',
  },
  nextSteps: {
    padding: '16px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    borderLeft: '4px solid #22c55e',
  },
  stepsList: {
    margin: '8px 0 0 20px',
    padding: 0,
  },
  step: {
    marginBottom: '8px',
  },
  details: {
    marginTop: '16px',
    cursor: 'pointer',
  },
  detailsSummary: {
    color: '#64748b',
    fontSize: '14px',
    userSelect: 'none',
  },
  fullResponse: {
    marginTop: '12px',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
  },
};