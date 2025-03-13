import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import { fetchTasks, deleteTask } from '../actions/task'; // Ensure correct import
import { toTitleCase, formatDate } from '../utils/utils';
import { FaEdit, FaTrash, FaSpinner, FaCircle, FaCheckCircle } from 'react-icons/fa'; // Import the icons
import { LuCircleDashed } from 'react-icons/lu';

const ViewTasks = ({ isAuthenticated, userTasks, teamTasks, fetchTasks, deleteTask }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);

    const navigate = useNavigate();
    useEffect(() => {
        const fetchData = async () => {
            try {
                await fetchTasks();
            } catch (err) {
                console.error(err);
                setError('Failed to fetch tasks');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [fetchTasks]);

    const handleDelete = async (taskId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this task?");
        if (!confirmDelete) {
            return;
        }

        try {
            await deleteTask(taskId);
        } catch (err) {
            console.error('Failed to delete task:', err);
            setError('Failed to delete task');
        }
    };

    const toggleRowExpand = (taskId) => {
        setExpandedRow(expandedRow === taskId ? null : taskId);
    };

    const getStatusIconWithTooltip = (status) => {
        let icon;
        let iconColor;
    
        switch (status.toLowerCase()) {
            case 'in_progress':
                icon = <FaSpinner className="fa-spin" />;
                iconColor = '#d35400'; // purple for in progress
                break;
            case 'not_started':
                icon = <LuCircleDashed />;
                iconColor = '#717186'; // grey for not started
                break;
            case 'complete':
                icon = <FaCheckCircle />;
                iconColor = '#0FA312'; // Green for completed
                break;
            default:
                icon = <FaCircle />;
                iconColor = '#95a5a6'; // red for unknown status
        }
    
        return (
            <div className="status-icon" style={{ color: iconColor }}>
                {icon}
                <span className="tooltip">{toTitleCase(status)}</span>
            </div>
        );
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
                                                    <td>
                                                        <FaEdit className="action-icon edit-icon" onClick={() => navigate(`/edit-task/${task.id}`)} />
                                                        <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(task.id)} />
                                                    </td>
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
                                                    <td>
                                                        <FaEdit className="action-icon edit-icon" onClick={() => navigate(`/edit-task/${task.id}`)} />
                                                        <FaTrash className="action-icon delete-icon" onClick={() => handleDelete(task.id)} />
                                                    </td>
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
});

export default connect(mapStateToProps, { fetchTasks, deleteTask })(ViewTasks);
