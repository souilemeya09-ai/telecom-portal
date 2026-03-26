import { useEffect, useState } from "react";
import { getAllServices, deleteService } from "../../../api/serviceApi";

export default function ServiceList({ onEdit, refreshTrigger }) {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchServices();
    }, [refreshTrigger]);

    async function fetchServices() {
        try {
            setLoading(true);
            setError(null);
            const data = await getAllServices();
            setServices(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!window.confirm("Delete this service?")) return;
        try {
            await deleteService(id);
            setServices((prev) => prev.filter((s) => s.id !== id));
        } catch (err) {
            alert(`Delete failed: ${err.message}`);
        }
    }

    if (loading) return <p>Loading services...</p>;
    if (error) return <p style={{ color: "red" }}>Error: {error}</p>;

    return (
        <div>
            <h2>Services</h2>
            {services.length === 0 ? (
                <p>No services found.</p>
            ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map((service) => (
                            <tr key={service.id}>
                                <td>{service.id}</td>
                                <td>{service.nom}</td>
                                <td>{service.description}</td>
                                <td>{service.prix}</td>
                                <td>
                                    <button onClick={() => onEdit(service)}>Edit</button>
                                    <button onClick={() => handleDelete(service.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}