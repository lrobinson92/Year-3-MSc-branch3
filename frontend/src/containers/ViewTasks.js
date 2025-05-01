import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import TaskTable from '../components/TaskTable';
import { fetchTasks } from '../actions/task';
import { fetchTeams } from '../actions/team';
import { FaPlus, FaFilter } from 'react-icons/fa';
import TaskFilterBar from '../components/TaskFilterBar';

/**
 * ViewTasks Component
 * 
 * Displays and manages tasks for the current user.
 * Shows personal tasks assigned to the user and team tasks the user has access to.
 * Provides filtering capabilities and links to create new tasks.
 */
const ViewTasks = ({ isAuthenticated, userTasks, teamTasks, fetchTasks, fetchTeams, loading }) => {
    // Error state for API failures
    const [error, setError] = useState(null);

    /**
     * Fetch tasks and teams data on component mount
     * Uses Promise.all to fetch both data sets concurrently
     */
    useEffect(() => {
        const fetchData = async () => {
            try {
                await Promise.all([fetchTasks(), fetchTeams()]);
            } catch (err) {
                console.error(err);
                setError('Failed to fetch data');
            }
        };

        fetchData();
    }, [fetchTasks, fetchTeams]);

    // Redirect unauthenticated users to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    return (
        <div>
            <div className="d-flex">
                {/* Sidebar navigation */}
                <Sidebar />
                
                {/* Main content area */}
                <div className="main-content">
                    <div className="container-fluid pt-2 pb-1">
                        {/* Action buttons - Filter toggle and Create Task */}
                        <div className="d-flex justify-content-end">
                            <button
                                className="btn btn-outline-secondary me-2"
                                data-bs-toggle="collapse"
                                data-bs-target="#filterCollapse"
                                aria-expanded="false"
                                aria-controls="filterCollapse"
                                title="Show/hide filtering options"
                            >
                                <FaFilter className="me-1" /> Filters
                            </button>
                            <Link 
                                to="/create-task" 
                                className="btn btn-primary"
                                title="Create a new task"
                            >
                                <FaPlus className="me-1" /> Create New Task
                            </Link>
                        </div>

                        {/* Collapsible filter section */}
                        <div className="collapse mb-3" id="filterCollapse">
                            <div className="card card-body">
                                <TaskFilterBar />
                            </div>
                        </div>

                        {/* Error message display */}
                        {error && <div className="alert alert-danger">{error}</div>}

                        {/* Loading state or task tables */}
                        {loading ? (
                            <div className="d-flex justify-content-center my-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* User's personal tasks section */}
                                <div className="card mb-3">
                                    <div className="card-header bg-white">
                                        <h5 className="mb-0">My Tasks</h5>
                                    </div>
                                    <div className="card-body">
                                        <TaskTable 
                                            tasks={userTasks} 
                                            emptyMessage="You have no tasks that match the selected filters" 
                                            showColumns={{ 
                                                status: true, 
                                                assignedTo: false, // No need to show assignee for personal tasks
                                                teamName: true,
                                                dueDate: true, 
                                                actions: true 
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Team tasks section */}
                                <div className="card">
                                    <div className="card-header bg-white">
                                        <h5 className="mb-0">Team Tasks</h5>
                                    </div>
                                    <div className="card-body">
                                        <TaskTable 
                                            tasks={teamTasks} 
                                            emptyMessage="Your teams have no tasks that match the selected filters" 
                                            showColumns={{ 
                                                status: true, 
                                                assignedTo: true, // Show assignee for team tasks
                                                teamName: true,
                                                dueDate: true, 
                                                actions: true 
                                            }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Maps Redux state to component props
 * Provides authentication status, task lists, and loading state
 */
const mapStateToProps = (state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    userTasks: state.task.userTasks,
    teamTasks: state.task.teamTasks,
    loading: state.task.loading
});

/**
 * Connect component to Redux store
 */
export default connect(
    mapStateToProps, 
    { fetchTasks, fetchTeams }
)(ViewTasks);
