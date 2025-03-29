import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import TeamGrid from '../components/TeamGrid'; // Import the TeamGrid component
import axiosInstance from '../utils/axiosConfig';
import { deleteTeam, editTeam } from '../actions/team';

const ViewTeams = ({ isAuthenticated, firstLogin, deleteTeam, user }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/`, {
                    withCredentials: true,
                });
                setTeams(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch teams');
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (firstLogin) {
        return <Navigate to="/dashboard" />;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    const handleDelete = async (teamId) => {
        try {
            // Add confirmation before deleting
            const confirmDelete = window.confirm("Are you sure you want to delete this team? This action cannot be undone.");
            if (!confirmDelete) return;
            
            await deleteTeam(teamId);
            setTeams(teams.filter(team => team.id !== teamId));
        } catch (err) {
            console.error('Failed to delete team:', err);
            alert('Failed to delete team. Please try again.');
        }
    };

    const handleEdit = (teamId) => {
        navigate(`/edit-team/${teamId}`);
    };

    const handleAddMembers = (teamId) => {
        navigate(`/invite-member/${teamId}`);
    };

    const handleViewTeam = (teamId) => {
        navigate(`/team/${teamId}`);
    };

    return (
        <div>
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                    <div className="recent-items-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>All Teams</h2>
                            <Link to="/create-team" className="btn btn-primary create-new-link">
                                + Create New Team
                            </Link>
                        </div>  
                        <TeamGrid 
                            teams={teams}
                            emptyMessage="No teams available"
                            showCreateButton={false} // Already showing the button in the header
                            showActions={true}
                            currentUser={user}
                            onTeamClick={handleViewTeam}
                            onEditClick={handleEdit}
                            onAddMembersClick={handleAddMembers}
                            onDeleteClick={handleDelete}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    firstLogin: state.auth.firstLogin,
    user: state.auth.user
});

export default connect(mapStateToProps, { deleteTeam, editTeam })(ViewTeams);