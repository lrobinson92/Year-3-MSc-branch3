import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import TeamGrid from '../components/TeamGrid';
import axiosInstance from '../utils/axiosConfig';
import { deleteTeam } from '../actions/team';

/**
 * ViewTeams Component
 * 
 * Displays and manages all teams available to the current user.
 * Provides functionality to view, edit, add members to, and delete teams.
 * Team access and actions are controlled by user permissions.
 */
const ViewTeams = ({ isAuthenticated, firstLogin, deleteTeam, user }) => {
    // State management
    const [teams, setTeams] = useState([]);             // List of teams user has access to
    const [loading, setLoading] = useState(true);       // Loading state indicator
    const [error, setError] = useState(null);           // Error message storage
    
    // Navigation hook
    const navigate = useNavigate();

    /**
     * Fetch teams data on component mount
     * Retrieves all teams the user has access to from the API
     */
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

    // Redirect unauthenticated users to login
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Redirect first-time logins to dashboard for onboarding
    if (firstLogin) {
        return <Navigate to="/dashboard" />;
    }

    // Display loading spinner while fetching data
    if (loading) {
        return (
            <div className="d-flex">
                <Sidebar />
                <div className="main-content d-flex justify-content-center align-items-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading teams...</span>
                    </div>
                </div>
            </div>
        );
    }

    // Display error message if fetch failed
    if (error) {
        return (
            <div className="d-flex">
                <Sidebar />
                <div className="main-content p-4">
                    <div className="alert alert-danger">{error}</div>
                </div>
            </div>
        );
    }

    /**
     * Handle team deletion with confirmation
     * @param {number} teamId - ID of team to delete
     */
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

    /**
     * Navigate to team edit page
     * @param {number} teamId - ID of team to edit
     */
    const handleEdit = (teamId) => {
        navigate(`/edit-team/${teamId}`);
    };

    /**
     * Navigate to invite members page
     * @param {number} teamId - ID of team to add members to
     */
    const handleAddMembers = (teamId) => {
        navigate(`/invite-member/${teamId}`);
    };

    /**
     * Navigate to team detail page
     * @param {number} teamId - ID of team to view
     */
    const handleViewTeam = (teamId) => {
        navigate(`/team/${teamId}`);
    };

    return (
        <div>
            <div className="d-flex">
                {/* Sidebar navigation */}
                <Sidebar />
                
                {/* Main content area */}
                <div className="main-content">
                    <div className="recent-items-card">
                        {/* Header with title and create button */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>All Teams</h2>
                            <Link 
                                to="/create-team" 
                                className="btn btn-primary create-new-link"
                                title="Create a new team"
                            >
                                + Create New Team
                            </Link>
                        </div>
                        
                        {/* Team grid display */}
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

/**
 * Maps Redux state to component props
 * Provides authentication status and user details
 */
const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    firstLogin: state.auth.firstLogin,
    user: state.auth.user
});

/**
 * Connect component to Redux store
 */
export default connect(mapStateToProps, { deleteTeam })(ViewTeams);