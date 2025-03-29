import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import { fetchTasks, getStatusIconWithTooltip, handleTaskDelete } from '../actions/task';
import { fetchTeams } from '../actions/team'; // Add this import
import { formatDate } from '../utils/utils';
import { FaEdit, FaTrash } from 'react-icons/fa';

const ViewTasks = ({ isAuthenticated, userTasks, teamTasks, fetchTasks, fetchTeams, handleTaskDelete, user, teams }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);

    const navigate = useNavigate();
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch both tasks and teams data
                await Promise.all([fetchTasks(), fetchTeams()]);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fetchTasks, fetchTeams]);

    const handleDelete = (taskId) => {
        handleTaskDelete(taskId, setError);
    };

    const toggleRowExpand = (taskId) => {
        setExpandedRow(expandedRow === taskId ? null : taskId);
    };
    
    // Check if user has permission to edit/delete a task
    const canModifyTask = (task) => {
        if (!user) {
            console.log("No user found");
            return false;
        }
        
        // User can modify if they are assigned to the task
        const isAssignedUser = task.assigned_to === user.id;
        console.log("Is assigned user?", isAssignedUser, "Task assigned to:", task.assigned_to, "User ID:", user.id);
        
        // User can modify if they are the team owner
        let isTeamOwner = false;
        
        // First, let's check if we have all the required data
        if (!task.team) {
            console.log("Task has no team assigned");
        } else if (!teams || teams.length === 0) {
            console.log("No teams data available");
        } else {
            // Debug the team data more thoroughly
            console.log("Task team ID:", task.team, "(type:", typeof task.team, ")");
            console.log("Teams available:", teams.length);
            
            // Try with both strict and loose equality
            const taskTeamStrict = teams.find(team => team.id === task.team);
            const taskTeamLoose = teams.find(team => Number(team.id) === Number(task.team));
            
            console.log("Found team with strict equality?", !!taskTeamStrict);
            console.log("Found team with loose equality?", !!taskTeamLoose);
            
            // Use the one that works (prefer strict, fallback to loose)
            const taskTeam = taskTeamStrict || taskTeamLoose;
            
            if (taskTeam) {
                console.log("Team found:", taskTeam.name, "ID:", taskTeam.id);
                
                if (!taskTeam.members) {
                    console.log("Team has no members array");
                } else {
                    console.log("Team members count:", taskTeam.members.length);
                    
                    // Check if user is a member of this team
                    const userMembership = taskTeam.members.find(membership => 
                        membership.user === user.id || 
                        Number(membership.user) === Number(user.id)
                    );
                    
                    console.log("User membership found?", !!userMembership);
                    
                    if (userMembership) {
                        console.log("User role in team:", userMembership.role);
                        isTeamOwner = userMembership.role === 'owner';
                        console.log("Is team owner?", isTeamOwner);
                    }
                }
            } else {
                console.log("Could not find team with ID:", task.team);
                console.log("Available team IDs:", teams.map(t => t.id));
            }
        }
        
        const result = isAssignedUser || isTeamOwner;
        console.log("Final permission result:", result);
        
        return result;
    };
    
    // Handle edit click with permission check
    const handleEditClick = (task) => {
        if (canModifyTask(task)) {
            navigate(`/edit-task/${task.id}`);
        } else {
            alert("You don't have permission to edit this task. Only assigned users or team owners can edit tasks.");
        }
    };
    
    // Handle delete click with permission check
    const handleDeleteClick = (task) => {
        if (canModifyTask(task)) {
            handleDelete(task.id);
        } else {
            alert("You don't have permission to delete this task. Only assigned users or team owners can delete tasks.");
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    // Function to render actions column
    const renderActionButtons = (task) => {
        const canModify = canModifyTask(task);
        const iconStyle = canModify 
            ? { opacity: 1, cursor: 'pointer' } 
            : { opacity: 0.4, cursor: 'not-allowed' };
            
        return (
            <td>
                <FaEdit 
                    className="action-icon edit-icon" 
                    onClick={() => handleEditClick(task)} 
                    style={iconStyle} 
                    title={canModify ? "Edit task" : "You don't have permission to edit this task"}
                />
                <FaTrash 
                    className="action-icon delete-icon" 
                    onClick={() => handleDeleteClick(task)} 
                    style={iconStyle}
                    title={canModify ? "Delete task" : "You don't have permission to delete this task"}
                />
            </td>
        );
    };

    return (
        <div>
            {/* Sidebar and Main Content */}
            <div className="d-flex">
                <Sidebar />
                <div className="main-content">
                    <div className="recent-items-card">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h2>My Tasks</h2>
                            <Link to="/create-task" className="btn btn-primary create-new-link">
                                + Create New Task
                            </Link>
                        </div>  
                        {userTasks.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Description</th>
                                            <th>Assigned To</th>
                                            <th>Team</th>
                                            <th>Due Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userTasks.map(task => (
                                            <React.Fragment key={task.id}>
                                                <tr>
                                                    <td className="status-width">{getStatusIconWithTooltip(task.status)}</td>
                                                    <td className="truncate-description" onClick={() => toggleRowExpand(task.id)}>
                                                        <span>{task.description}</span>
                                                    </td>
                                                    <td>{task.assigned_to_name}</td>
                                                    <td>{task.team_name}</td>
                                                    <td>{formatDate(task.due_date)}</td>
                                                    {renderActionButtons(task)}
                                                </tr>
                                                {expandedRow === task.id && (
                                                    <tr className="expanded-row">
                                                        <td colSpan="6">
                                                            <div className="expanded-content">
                                                                <strong>Full Description:</strong> {task.description}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>You have no tasks</p>
                        )}

                        <h2>Team Tasks</h2>
                        {teamTasks.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th>Description</th>
                                            <th>Assigned To</th>
                                            <th>Team</th>
                                            <th>Due Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamTasks.map(task => (
                                            <React.Fragment key={task.id}>
                                                <tr>
                                                    <td className="status-width">{getStatusIconWithTooltip(task.status)}</td>
                                                    <td className="truncate-description" onClick={() => toggleRowExpand(task.id)}>
                                                        <span>{task.description}</span>
                                                    </td>
                                                    <td>{task.assigned_to_name}</td>
                                                    <td>{task.team_name}</td>
                                                    <td>{formatDate(task.due_date)}</td>
                                                    {renderActionButtons(task)}
                                                </tr>
                                                {expandedRow === task.id && (
                                                    <tr className="expanded-row">
                                                        <td colSpan="6">
                                                            <div className="expanded-content">
                                                                <strong>Full Description:</strong> {task.description}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>Your teams have no tasks</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    userTasks: state.task.userTasks,
    teamTasks: state.task.teamTasks,
    user: state.auth.user,
    teams: state.team ? state.team.teams : [] // Make sure your Redux store has teams data
});

export default connect(
    mapStateToProps, 
    { fetchTasks, fetchTeams, handleTaskDelete, getStatusIconWithTooltip }
)(ViewTasks);
