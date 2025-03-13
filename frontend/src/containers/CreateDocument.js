import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import axiosInstance from '../utils/axiosConfig';

const CreateDocument = ({ isAuthenticated }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [teamId, setTeamId] = useState('');  // Add teamId state
    const navigate = useNavigate();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('team_id', teamId);  // Include team_id

        try {
            const response = await axiosInstance.post('/api/onedrive/upload/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('Document created:', response.data);
            navigate('/view/documents');
        } catch (error) {
            console.error('Error creating document:', error);
        }
    };

    return (
        <div className="container mt-5 entry-container">
            <h2>Create New Document</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Title</label>
                    <input
                        type="text"
                        className="form-control"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="content">Content</label>
                    <textarea
                        className="form-control"
                        id="content"
                        rows="10"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    ></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="team_id">Team ID</label>
                    <input
                        type="text"
                        className="form-control"
                        id="team_id"
                        value={teamId}
                        onChange={(e) => setTeamId(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary mt-3">Create Document</button>
            </form>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
});

export default connect(mapStateToProps)(CreateDocument);