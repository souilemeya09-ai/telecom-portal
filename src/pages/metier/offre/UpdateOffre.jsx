import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getOffreById, updateOffre } from "../../api/api";
import "../../styles/createOffre.css";

const UpdateOffre = () => {
  const { id } = useParams(); // récupère l'id de l'offre depuis la route
  const navigate = useNavigate();

  const [nomOffre, setNomOffre] = useState("");
  const [typeOffre, setTypeOffre] = useState("");
  const [planId, setPlanId] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    fetchOffre();
  }, []);

  const fetchOffre = async () => {
    try {
      const offre = await getOffreById(id);
      setNomOffre(offre.nomOffre);
      setTypeOffre(offre.typeOffre);
      setPlanId(offre.planTarifaire?.id || "");
      setSelectedServices(offre.services?.map((s) => s.id) || []);
    } catch (error) {
      console.error("Erreur récupération offre", error);
    }
  };

  const handleServiceChange = (e) => {
    const value = Array.from(
      e.target.selectedOptions,
      (option) => parseInt(option.value)
    );
    setSelectedServices(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedOffre = {
      nomOffre,
      typeOffre,
      planTarifaire: { id: planId },
      services: selectedServices.map((id) => ({ id })),
    };

    try {
      await updateOffre(id, updatedOffre);
      alert("Offre mise à jour avec succès !");
      navigate("/offres"); // redirige vers la liste des offres
    } catch (error) {
      console.error("Erreur mise à jour offre", error);
    }
  };

  return (
    <div className="create-offre-container">
      <h2>Modifier l'Offre</h2>

      <form onSubmit={handleSubmit} className="create-offre-form">
        <input
          type="text"
          placeholder="Nom de l'offre"
          value={nomOffre}
          onChange={(e) => setNomOffre(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Type d'offre"
          value={typeOffre}
          onChange={(e) => setTypeOffre(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="ID Plan Tarifaire"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          required
        />

        <select
          multiple
          value={selectedServices}
          onChange={handleServiceChange}
        >
          <option value={1}>Service 1</option>
          <option value={2}>Service 2</option>
          <option value={3}>Service 3</option>
          {/* Remplacer par fetch dynamique si nécessaire */}
        </select>

        <button type="submit">Mettre à jour</button>
      </form>
    </div>
  );
};

export default UpdateOffre;