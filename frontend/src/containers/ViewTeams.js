import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import axiosInstance from '../utils/axiosConfig';
import { Dropdown } from 'react-bootstrap';
import CustomToggle from '../utils/customToggle';
import { deleteTeam, editTeam } from '../actions/team'; // Import the editTeam action
import { toTitleCase } from '../utils/utils';

const ViewTeams = ({ isAuthenticated, firstLogin, deleteTeam }) => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/`, {
                    withCredentials: true,  // Include credentials in the request
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
            await deleteTeam(teamId);
            setTeams(teams.filter(team => team.id !== teamId));
        } catch (err) {
            console.error('Failed to delete team');
        }
    };

    const handleEdit = (teamId) => {
        navigate(`/edit-team/${teamId}`);
    };

    const handleAddMembers = (teamId) => {
        navigate(`/invite-member/${teamId}`);
    };

    return (
        <div>
            {/* Sidebar and Main Content */}
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
                        {/* Recent Items */}
                        <div className="row">
                            {Array.isArray(teams) && teams.length > 0 ? (
                                teams.map((team) => (
                                    <div className="col-md-4 mb-3" key={team.id}>
                                        <div className="card p-3 view">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <h4>{team.name}</h4>
                                                <Dropdown>
                                                    <Dropdown.Toggle as={CustomToggle} id="dropdown-custom-components">
                                                        ...
                                                    </Dropdown.Toggle>

                                                    <Dropdown.Menu className="custom-dropdown-menu">
                                                        <Dropdown.Item onClick={() => handleEdit(team.id)}>Edit</Dropdown.Item>
                                                        <Dropdown.Item onClick={() => handleAddMembers(team.id)}>Add Members</Dropdown.Item>
                                                        <Dropdown.Item onClick={() => handleDelete(team.id)}>Delete</Dropdown.Item>
                                                    </Dropdown.Menu>
                                                </Dropdown>
                                            </div>
                                            <ul className="member-list">
                                                {team.members.map((member) => (
                                                    <li key={member.id}>
                                                        <span
                                                            className={`member-initial ${member.role === 'owner' ? 'owner-initial' : ''}`}
                                                            data-fullname={`${member.user_name} (${toTitleCase(member.role)})`}
                                                            title={`${member.user_name} (${toTitleCase(member.role)})`}
                                                        >
                                                            {member.user_name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <p>{team.description}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>No teams available</p>
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
    firstLogin: state.auth.firstLogin,
});

export default connect(mapStateToProps, { deleteTeam, editTeam })(ViewTeams);