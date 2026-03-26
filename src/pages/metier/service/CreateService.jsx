import { useState, useEffect } from "react";
import { createService, updateService } from "../../../api/serviceApi";

const EMPTY_FORM = { nom: "", description: "", prix: "" };

export default function CreateService({ onSuccess, editingService, onCancelEdit }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isEditing = Boolean(editingService);

    useEffect(() => {
        if (editingService) {
            setForm({
                nom: editingService.nom || "",
                description: editingService.description || "",
                prix: editingService.prix || "",
            });
        } else {
            setForm(EMPTY_FORM);
        }
    }, [editingService]);

    function handleChange(e) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (isEditing) {
                await updateService(editingService.id, form);
            } else {
                await createService(form);
            }
            setForm(EMPTY_FORM);
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>{isEditing ? "Edit service" : "New service"}</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <label>Name
                <input
                    name="nom"
                    value={form.nom}
                    onChange={handleChange}
                    required
                />
            </label>

            <label>Description
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                />
            </label>

            <label>Price
                <input
                    name="prix"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prix}
                    onChange={handleChange}
                    required
                />
            </label>

            <button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>

            {isEditing && (
                <button type="button" onClick={onCancelEdit}>Cancel</button>
            )}
        </form>
    );
}