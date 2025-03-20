// ViewSOP.js
import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';

const ViewSOP = ({ isAuthenticated }) => {
  const { id } = useParams(); // Document ID
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDocumentContent = async () => {
      try {
        // Optionally, you might also fetch the Document record from /api/documents/:id
        const res = await axiosInstance.get(
          `${process.env.REACT_APP_API_URL}/api/google-drive/file-content/${id}/`,
          { withCredentials: true }
        );
        setContent(res.data.content);
    } catch (err) {
        console.error(err);
        setError('Failed to fetch document content.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocumentContent();
  }, [id]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="d-flex">
      <Sidebar />
      <div className="main-content">
        <div className="sop-detail-card">
          <h2>Document #{id}</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps)(ViewSOP);
