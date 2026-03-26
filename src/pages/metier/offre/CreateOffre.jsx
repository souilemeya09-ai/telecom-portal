import { useEffect, useState } from "react";
import { getOffres, createOffre } from "../../../api/api";
import "../../../styles/createOffre.css";
const CreateOffre = () => {
  const [offres, setOffres] = useState([]);
  const [nomOffre, setNomOffre] = useState("");
  const [typeOffre, setTypeOffre] = useState("");
  const [planId, setPlanId] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    fetchOffres();
  }, []);

  const fetchOffres = async () => {
    try {
      const response = await getOffres(); // ✅ utiliser response.data
      setOffres(response.data);
    } catch (error) {
      console.error("Erreur chargement offres", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newOffre = {
      nomOffre,
      typeOffre,
      planTarifaire: { id: parseInt(planId) },
      services: selectedServices.map((id) => ({ id })),
    };

    try {
      const created = await createOffre(newOffre);
      alert(`Offre créée: ${created.data.nomOffre}`); // ✅ response.data
      // Reset form
      setNomOffre("");
      setTypeOffre("");
      setPlanId("");
      setSelectedServices([]);
      fetchOffres();
    } catch (error) {
      console.error("Erreur création offre", error);
    }
  };

  const handleServiceChange = (e) => {
    const values = Array.from(
      e.target.selectedOptions,
      (option) => parseInt(option.value)
    );
    setSelectedServices(values);
  };

  return (
    <div className="create-offre-container">
      <h2>Créer une Offre</h2>

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
        </select>

        <button type="submit">Créer Offre</button>
      </form>

      <h3>Offres existantes</h3>
      <ul>
        {offres.map((offre) => (
          <li key={offre.id}>
            {offre.nomOffre} - {offre.typeOffre}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CreateOffre;