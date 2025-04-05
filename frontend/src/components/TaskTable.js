import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaCheck, FaExclamationTriangle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { updateTaskStatus, deleteTask } from '../actions/task';
import { formatDate } from '../utils/utils';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

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
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState(null);
    const [expandedDescriptions, setExpandedDescriptions] = useState({});

    const handleRowClick = (task) => {
        if (onRowClick) {
            onRowClick(task);
        } else {
            navigate(`/edit-task/${task.id}`);
        }
    };

    const handleEdit = (e, taskId) => {
        e.stopPropagation();
        navigate(`/edit-task/${taskId}`);
    };

    const handleDelete = (e, task) => {
        e.stopPropagation();
        setTaskToDelete(task);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (taskToDelete) {
            await deleteTask(taskToDelete.id);
            setShowDeleteModal(false);
        }
    };

    const handleComplete = (e, task) => {
        e.stopPropagation();
        setTaskToComplete(task);
        setShowCompleteModal(true);
    };

    const confirmComplete = async () => {
        if (taskToComplete) {
            await updateTaskStatus(taskToComplete.id, 'complete');
            setShowCompleteModal(false);
        }
    };

    const isPastDue = (due) => {
        if (!due) return false;
        const now = new Date();
        const dueDate = new Date(due);
        return dueDate.setHours(0, 0, 0, 0) < now.setHours(0, 0, 0, 0);
    };

    const toggleDescription = (e, taskId) => {
        e.stopPropagation();
        setExpandedDescriptions(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    // Function to truncate text
    const truncateText = (text, maxLength = 35) => {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    };

    if (!tasks.length) {
        return <div className="alert alert-info text-center">{emptyMessage}</div>;
    }

    return (
        <>
            <div className="table-responsive">
                <table className="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Description</th>
                            {showColumns.status && <th>Status</th>}
                            {showColumns.assignedTo && <th>Assigned To</th>}
                            {showColumns.teamName && <th>Team</th>}
                            {showColumns.dueDate && <th>Due Date</th>}
                            {showColumns.actions && <th className="text-center action-column">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <React.Fragment key={task.id}>
                                <tr
                                    className={isPastDue(task.due_date) && task.status !== 'complete' ? 'table-danger' : ''}
                                    onClick={() => handleRowClick(task)}
                                    style={{ cursor: 'pointer' }}
                                >
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
                                    {showColumns.status && <td><span className={`badge bg-${task.status === 'complete' ? 'success' : task.status === 'in_progress' ? 'primary' : 'secondary'}`}>{task.status.replace('_', ' ')}</span></td>}
                                    {showColumns.assignedTo && <td>{task.assigned_to_name || 'Unassigned'}</td>}
                                    {showColumns.teamName && <td>{task.team_name || '—'}</td>}
                                    {showColumns.dueDate && <td>{task.due_date ? formatDate(task.due_date) : '—'}</td>}
                                    {showColumns.actions && (
                                        <td>
                                            <div className="d-flex justify-content-center gap-2">
                                                <button 
                                                    className="btn btn-sm task-icon-button"
                                                    onClick={(e) => handleEdit(e, task.id)} 
                                                    title="Edit"
                                                >
                                                    <FaEdit size={14} className="text-primary" />
                                                </button>
                                                
                                                {task.status !== 'complete' && (
                                                    <button 
                                                        className="btn btn-sm task-icon-button"
                                                        onClick={(e) => handleComplete(e, task)} 
                                                        title="Mark Complete"
                                                    >
                                                        <FaCheck size={14} className="text-success" />
                                                    </button>
                                                )}
                                                
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

            {/* Delete Modal */}
            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Delete Task</Modal.Title></Modal.Header>
                <Modal.Body>Are you sure you want to delete this task?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                </Modal.Footer>
            </Modal>

            {/* Complete Modal */}
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

export default connect(null, { updateTaskStatus, deleteTask })(TaskTable);
