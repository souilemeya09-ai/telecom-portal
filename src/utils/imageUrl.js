export const getImageUrl = (path) => {
    if (!path) return null;
    return `http://localhost:8080/uploads/${path}`;
};