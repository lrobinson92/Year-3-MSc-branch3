import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { formatDate } from '../utils/utils';
import { getStatusIconWithTooltip, handleTaskDelete } from '../actions/task';
import { FaEdit, FaTrash } from 'react-icons/fa';

const TaskTable = ({ 
    tasks, 
    teams, 
    user, 
    handleTaskDelete, 
    emptyMessage = "No tasks available",
    limit = null, // Add a limit prop
    showColumns = { status: true, description: true, assignedTo: true, team: true, dueDate: true, actions: true } // Control which columns to show
}) => {
    const [expandedRow, setExpandedRow] = useState(null);
    const navigate = useNavigate();

    // If limit is set, only show that many tasks
    const displayTasks = limit ? tasks.slice(0, limit) : tasks;

    const toggleRowExpand = (taskId) => {
        setExpandedRow(expandedRow === taskId ? null : taskId);
    };
    
    // Check if user has permission to edit/delete a task
    const canModifyTask = (task) => {
        if (!user) return false;
        
        // User can modify if they are assigned to the task
        const isAssignedUser = task.assigned_to === user.id;
        
        // User can modify if they are the team owner
        let isTeamOwner = false;
        
        if (task.team && teams && teams.length > 0) {
            const taskTeam = teams.find(team => Number(team.id) === Number(task.team));
            
            if (taskTeam && taskTeam.members) {
                const userMembership = taskTeam.members.find(membership => 
                    Number(membership.user) === Number(user.id)
                );
                
                if (userMembership) {
                    isTeamOwner = userMembership.role === 'owner';
                }
            }
        }
        
        return isAssignedUser || isTeamOwner;
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
            handleTaskDelete(task.id);
        } else {
            alert("You don't have permission to delete this task. Only assigned users or team owners can delete tasks.");
        }
    };

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

    if (!tasks || tasks.length === 0) {
        return <p>{emptyMessage}</p>;
    }

    return (
        <div className="table-responsive">
            <table className="table">
                <thead>
                    <tr>
                        {showColumns.status && <th>Status</th>}
                        {showColumns.description && <th>Description</th>}
                        {showColumns.assignedTo && <th>Assigned To</th>}
                        {showColumns.team && <th>Team</th>}
                        {showColumns.dueDate && <th>Due Date</th>}
                        {showColumns.actions && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {displayTasks.map(task => (
                        <React.Fragment key={task.id}>
                            <tr>
                                {showColumns.status && <td className="status-width">{getStatusIconWithTooltip(task.status)}</td>}
                                {showColumns.description && <td className="truncate-description" onClick={() => toggleRowExpand(task.id)}>
                                    <span>{task.description}</span>
                                </td>}
                                {showColumns.assignedTo && <td>{task.assigned_to_name}</td>}
                                {showColumns.team && <td>{task.team_name}</td>}
                                {showColumns.dueDate && <td>{formatDate(task.due_date)}</td>}
                                {showColumns.actions && renderActionButtons(task)}
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
    );
};

const mapStateToProps = (state) => ({
    user: state.auth.user,
    teams: state.team ? state.team.teams : []
});

export default connect(mapStateToProps, { getStatusIconWithTooltip, handleTaskDelete })(TaskTable);