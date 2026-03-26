import { useEffect, useState } from "react";
import { getOffres } from "../../../api/api";
import "../../../styles/offres.css";
const Offres = () => {
  const [offres, setOffres] = useState([]);
  const [loading, setLoading] = useState(true);
const token=localStorage.getItem("token")
  useEffect(() => {
    if(token)
    fetchOffres();
  }, [token]);

 
const fetchOffres = async () => {
  try {
    const response = await getOffres();
    console.log("Données reçues :", response); // <-- vérifier ici
    setOffres(response);
  } catch (error) {
    console.error("Erreur chargement offres", error);
  } finally {
    setLoading(false);
  }
};
  if (loading) return <p>Chargement des offres...</p>;

  return (
    <div className="offres-container">
      <h2 className="offres-title">Liste des Offres</h2>

      <table className="offres-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom de l'offre</th>
            <th>Type d'offre</th>
            <th>Plan Tarifaire</th>
            <th>Services</th>
          </tr>
        </thead>

        <tbody>
          {offres?.map((offre) => (
            <tr key={offre.id}>
              <td>{offre.id}</td>
              <td>{offre.nomOffre}</td>
              <td>{offre.typeOffre}</td>
              <td>{offre.planTarifaire?.nomPlan || "Non défini"}</td>
              <td>
                {offre.services && offre.services.length > 0
                  ? offre.services.map((s) => s.nomService).join(", ")
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Offres;