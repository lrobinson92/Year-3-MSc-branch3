import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  FaEdit, FaTrash, FaCheck, FaExclamationTriangle, 
  FaChevronDown, FaChevronUp, FaSort, FaSortUp, FaSortDown 
} from 'react-icons/fa';
import { updateTaskStatus, deleteTask } from '../actions/task';
import { formatDate } from '../utils/utils';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

/**
 * TaskTable Component
 * 
 * Displays tasks in a sortable, interactive table with status indicators,
 * expandable descriptions, and action buttons for task management.
 * 
 * @param {Array} tasks - List of task objects to display
 * @param {string} emptyMessage - Message to show when no tasks are available
 * @param {Object} showColumns - Configuration for which columns to display
 * @param {Function} updateTaskStatus - Redux action to update task status
 * @param {Function} deleteTask - Redux action to delete a task
 * @param {Function} onRowClick - Optional custom handler for row clicks
 */
const TaskTable = ({
    tasks = [],
    emptyMessage = "No tasks found",
    showColumns = {
        status: true,
        assignedTo: true,
        teamName: true,
        dueDate: true,
        actions: true
    },
    updateTaskStatus,
    deleteTask,
    onRowClick
}) => {
    // Navigation hook for redirecting after actions
    const navigate = useNavigate();
    
    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState(null);
    
    // UI state
    const [expandedDescriptions, setExpandedDescriptions] = useState({});
    
    // Sorting state
    const [sortConfig, setSortConfig] = useState({
        key: 'due_date',           // Default sort by due date
        direction: 'ascending'     // Default sort direction
    });
    
    // State for sorted tasks
    const [sortedTasks, setSortedTasks] = useState([]);
    
    /**
     * Sort tasks when the component loads or when tasks/sort config changes
     * Handles special case sorting for dates and null values
     */
    useEffect(() => {
        let tasksToSort = [...tasks];
        
        if (sortConfig.key) {
            tasksToSort.sort((a, b) => {
                // Handle null values (push them to the end)
                if (!a[sortConfig.key] && !b[sortConfig.key]) return 0;
                if (!a[sortConfig.key]) return 1;
                if (!b[sortConfig.key]) return -1;
                
                // Special handling for due dates
                if (sortConfig.key === 'due_date') {
                    const dateA = new Date(a[sortConfig.key]);
                    const dateB = new Date(b[sortConfig.key]);
                    
                    if (sortConfig.direction === 'ascending') {
                        return dateA - dateB;
                    } else {
                        return dateB - dateA;
                    }
                }
                
                // For other string fields (case-insensitive sort)
                if (a[sortConfig.key].toLowerCase() < b[sortConfig.key].toLowerCase()) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key].toLowerCase() > b[sortConfig.key].toLowerCase()) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        
        setSortedTasks(tasksToSort);
    }, [tasks, sortConfig]);
    
    /**
     * Request a sort operation on a specific column
     * Toggles direction if already sorting by this column
     * 
     * @param {string} key - Column key to sort by
     */
    const requestSort = (key) => {
        let direction = 'ascending';
        
        // If already sorting by this key, toggle direction
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        
        setSortConfig({ key, direction });
    };
    
    /**
     * Get the appropriate sort icon based on current sort configuration
     * 
     * @param {string} columnName - Column to check sort status for
     * @returns {JSX.Element} Appropriate sort icon component
     */
    const getSortDirectionIcon = (columnName) => {
        if (sortConfig.key !== columnName) {
            return <FaSort className="ms-1 text-muted" size={12} />;
        }
        
        return sortConfig.direction === 'ascending' 
            ? <FaSortUp className="ms-1" size={12} /> 
            : <FaSortDown className="ms-1" size={12} />;
    };

    /**
     * Handle click on a task row
     * Either uses custom handler or navigates to edit page
     * 
     * @param {Object} task - Task data for the clicked row
     */
    const handleRowClick = (task) => {
        if (onRowClick) {
            onRowClick(task);
        } else {
            navigate(`/edit-task/${task.id}`);
        }
    };

    /**
     * Handle edit button click
     * Prevents propagation to avoid triggering row click
     * 
     * @param {Event} e - Click event
     * @param {string|number} taskId - ID of task to edit
     */
    const handleEdit = (e, taskId) => {
        e.stopPropagation();
        navigate(`/edit-task/${taskId}`);
    };

    /**
     * Handle delete button click
     * Opens confirmation modal
     * 
     * @param {Event} e - Click event
     * @param {Object} task - Task to delete
     */
    const handleDelete = (e, task) => {
        e.stopPropagation();
        setTaskToDelete(task);
        setShowDeleteModal(true);
    };

    /**
     * Confirm task deletion after modal confirmation
     * Calls deleteTask action and closes modal
     */
    const confirmDelete = async () => {
        if (taskToDelete) {
            await deleteTask(taskToDelete.id);
            setShowDeleteModal(false);
        }
    };

    /**
     * Handle complete button click
     * Opens confirmation modal
     * 
     * @param {Event} e - Click event
     * @param {Object} task - Task to mark complete
     */
    const handleComplete = (e, task) => {
        e.stopPropagation();
        setTaskToComplete(task);
        setShowCompleteModal(true);
    };

    /**
     * Confirm task completion after modal confirmation
     * Updates task status to complete and closes modal
     */
    const confirmComplete = async () => {
        if (taskToComplete) {
            await updateTaskStatus(taskToComplete.id, 'complete');
            setShowCompleteModal(false);
        }
    };

    /**
     * Check if a task is past its due date
     * 
     * @param {string} due - Due date string
     * @returns {boolean} True if task is past due
     */
    const isPastDue = (due) => {
        if (!due) return false;
        const now = new Date();
        const dueDate = new Date(due);
        return dueDate.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0);
    };

    /**
     * Check if a task is due soon (within next 7 days)
     * 
     * @param {string} due - Due date string
     * @returns {boolean} True if task is due within 7 days
     */
    const isComingSoon = (due) => {
        if (!due) return false;
        const dueDate = new Date(due);
        const now = new Date();
        const diffTime = dueDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Consider tasks due in the next 7 days as "due soon"
        return diffDays > 0 && diffDays <= 7;
    };

    /**
     * Toggle expanded description for a task
     * 
     * @param {Event} e - Click event
     * @param {string|number} taskId - ID of task to toggle
     */
    const toggleDescription = (e, taskId) => {
        e.stopPropagation();
        setExpandedDescriptions(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    /**
     * Truncate text if longer than specified length
     * 
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length before truncation
     * @returns {string} Truncated text with ellipsis if needed
     */
    const truncateText = (text, maxLength = 35) => {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    // Show message when no tasks are available
    if (!tasks.length) {
        return <div className="alert alert-info text-center">{emptyMessage}</div>;
    }

    return (
        <>
            {/* Task table with sorting capability */}
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Description</th>
                            {showColumns.status && <th>Status</th>}
                            {showColumns.assignedTo && <th>Assigned To</th>}
                            {showColumns.teamName && <th>Team</th>}
                            {showColumns.dueDate && (
                                <th 
                                    className="sortable-header" 
                                    onClick={() => requestSort('due_date')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center">
                                        Due Date
                                        {getSortDirectionIcon('due_date')}
                                    </div>
                                </th>
                            )}
                            {showColumns.actions && <th className="text-center action-column">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTasks.map(task => (
                            <React.Fragment key={task.id}>
                                {/* Task row with conditional styling for overdue tasks */}
                                <tr
                                    className={isPastDue(task.due_date) && task.status !== 'complete' ? 'table-danger' : ''}
                                    onClick={() => handleRowClick(task)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Description cell with expand/collapse button */}
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="me-2 flex-grow-1">
                                                {truncateText(task.description)}
                                                {isPastDue(task.due_date) && task.status !== 'complete' && (
                                                    <FaExclamationTriangle className="text-danger ms-2" title="Past due" />
                                                )}
                                            </div>
                                            {task.description && task.description.length > 35 && (
                                                <button 
                                                    className="expand-button" 
                                                    onClick={(e) => toggleDescription(e, task.id)}
                                                    title={expandedDescriptions[task.id] ? "Collapse description" : "Expand description"}
                                                >
                                                    {expandedDescriptions[task.id] ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    
                                    {/* Status badge with color-coding */}
                                    {showColumns.status && 
                                      <td>
                                        <span className={`badge bg-${
                                          task.status === 'complete' ? 'success' : 
                                          task.status === 'in_progress' ? 'primary' : 
                                          'secondary'}`}>
                                          {task.status.replace('_', ' ')}
                                        </span>
                                      </td>
                                    }
                                    
                                    {/* Assignee name */}
                                    {showColumns.assignedTo && 
                                      <td>{task.assigned_to_name || 'Unassigned'}</td>
                                    }
                                    
                                    {/* Team name */}
                                    {showColumns.teamName && 
                                      <td>{task.team_name || '—'}</td>
                                    }
                                    
                                    {/* Due date with status indicators */}
                                    {showColumns.dueDate && (
                                        <td>
                                            {task.due_date ? (
                                                <div className="d-flex align-items-center">
                                                    {formatDate(task.due_date)}
                                                    {isPastDue(task.due_date) && task.status !== 'complete' ? (
                                                        <span className="badge bg-danger ms-2 text-white" style={{ fontSize: '0.65rem' }}>Overdue</span>
                                                    ) : (
                                                        isComingSoon(task.due_date) && task.status !== 'complete' && (
                                                            <span className="badge bg-warning ms-2 text-dark" style={{ fontSize: '0.65rem' }}>Due soon</span>
                                                        )
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                    )}
                                    
                                    {/* Action buttons */}
                                    {showColumns.actions && (
                                        <td>
                                            <div className="d-flex justify-content-center gap-2">
                                                {/* Edit button */}
                                                <button 
                                                    className="btn btn-sm task-icon-button"
                                                    onClick={(e) => handleEdit(e, task.id)} 
                                                    title="Edit"
                                                >
                                                    <FaEdit size={14} className="text-primary" />
                                                </button>
                                                
                                                {/* Complete button (only for incomplete tasks) */}
                                                {task.status !== 'complete' && (
                                                    <button 
                                                        className="btn btn-sm task-icon-button"
                                                        onClick={(e) => handleComplete(e, task)} 
                                                        title="Mark Complete"
                                                    >
                                                        <FaCheck size={14} className="text-success" />
                                                    </button>
                                                )}
                                                
                                                {/* Delete button */}
                                                <button 
                                                    className="btn btn-sm task-icon-button"
                                                    onClick={(e) => handleDelete(e, task)} 
                                                    title="Delete"
                                                >
                                                    <FaTrash size={14} className="text-danger" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                                
                                {/* Expanded description row (shown when expanded) */}
                                {expandedDescriptions[task.id] && (
                                    <tr 
                                        onClick={(e) => e.stopPropagation()}
                                        className="expanded-description-row"
                                    >
                                        <td colSpan={Object.values(showColumns).filter(Boolean).length + 1}>
                                            <div className="compact-description">
                                                {task.description}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Delete confirmation modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Delete Task</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to delete this task?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {/* Complete confirmation modal */}
            <Modal show={showCompleteModal} onHide={() => setShowCompleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Mark Task Complete</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to mark this task as complete?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
                    <Button variant="success" onClick={confirmComplete}>Confirm</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

// Connect component to Redux actions
export default connect(null, { updateTaskStatus, deleteTask })(TaskTable);
