import "../styles/pagination.css";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="pagination-controls">
      <button
        type="button"
        className="btn-secondary pagination-btn"
        onClick={handlePrev}
        disabled={currentPage === 1}
      >
        ‹
      </button>
      <span className="page-info">
        Page {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        className="btn-secondary pagination-btn"
        onClick={handleNext}
        disabled={currentPage === totalPages}
      >
        ›
      </button>
    </div>
  );
}
