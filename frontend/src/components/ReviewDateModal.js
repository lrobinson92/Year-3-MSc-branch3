import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const ReviewDateModal = ({ show, onHide, onSubmit, document, isUpdating = false }) => {
  // Initialize with empty string (will be updated when document changes)
  const [reviewDate, setReviewDate] = useState('');
  const [removeReviewDate, setRemoveReviewDate] = useState(false);

  // Update reviewDate when document prop changes or modal is shown
  useEffect(() => {
    if (document && show) {
      if (document.review_date) {
        // Format the date from ISO format to YYYY-MM-DD
        const formattedDate = new Date(document.review_date).toISOString().split('T')[0];
        setReviewDate(formattedDate);
        setRemoveReviewDate(false); // Reset the remove checkbox
      } else {
        // No review date set
        setReviewDate('');
        setRemoveReviewDate(false);
      }
    }
  }, [document, show]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(removeReviewDate ? null : reviewDate);
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Review Date</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Document: <strong>{document?.title}</strong></Form.Label>
          </Form.Group>

          {/* Current date display */}
          {document?.review_date && !removeReviewDate && (
            <Form.Group className="mb-3">
              <Form.Text className="text-info">
                Current review date: {new Date(document.review_date).toLocaleDateString()}
              </Form.Text>
            </Form.Group>
          )}

          {/* Option to remove review date */}
          <Form.Group className="mb-3">
            <Form.Check 
              type="checkbox"
              id="remove-review-date"
              label="Remove review date"
              checked={removeReviewDate}
              onChange={(e) => setRemoveReviewDate(e.target.checked)}
            />
          </Form.Group>

          {/* Date picker (disabled if removing date) */}
          {!removeReviewDate && (
            <Form.Group className="mb-3">
              <Form.Label>Review Date</Form.Label>
              <Form.Control
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <Form.Text className="text-muted">
                A reminder will be sent 14 days before the review date.
              </Form.Text>
            </Form.Group>
          )}

          <div className="text-end mt-4">
            {isUpdating && (
              <div className="mb-3 text-center">
                <span className="spinner-border spinner-border-sm me-2"></span>
                Updating...
              </div>
            )}
            <Button variant="secondary" onClick={onHide} className="me-2" disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isUpdating}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ReviewDateModal;