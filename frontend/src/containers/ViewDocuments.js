import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import { onedriveLogin, uploadDocument } from '../actions/onedrive';
import axiosInstance from '../utils/axiosConfig';

const ViewDocuments = ({ isAuthenticated, onedriveLogin, uploadDocument }) => {
    
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    
    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/documents/`, {
                    withCredentials: true,  // Include credentials in the request
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                });

                console.log("API Response:", res.data);  // Check if JSON is returned

                setDocuments(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch documents');
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, []);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const handleLogin = () => {
        onedriveLogin();
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        await uploadDocument(file);
    };

    return (
        <div>
            {/* Sidebar and Main Content */}
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                    <div className="recent-items-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>All Documents</h2>
                            <Link to="/create-document" className="btn btn-primary create-new-link">
                                + Create New Document
                            </Link>
                        </div>
                        <button onClick={handleLogin} className="btn btn-primary">Login to OneDrive</button>
                        <input type="file" onChange={handleFileUpload} />
                        <div className="row">
                            {Array.isArray(documents) && documents.length > 0 ? (
                                documents.map((document) => (
                                    <div className="col-md-4 mb-3" key={document.id}>
                                        <div className="card p-3 view">
                                            <h4>{document.title}</h4>
                                            <p>Team: {document.team_name}</p>
                                            <p>Owner: {document.owner_name}</p>
                                            <a href={document.file_url} target="_blank" rel="noopener noreferrer">View Document</a>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No documents available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    user: state.auth.user,
});

export default connect(mapStateToProps, { onedriveLogin, uploadDocument })(ViewDocuments);