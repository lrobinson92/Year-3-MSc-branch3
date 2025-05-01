import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { FaQuestion } from 'react-icons/fa';

/**
 * Sidebar Component
 * 
 * Main navigation sidebar for authenticated users.
 * Displays user information and navigation links to main application features.
 * 
 * @param {Object} props - Component properties
 * @param {Object} props.user - User object from Redux store containing name and other user data
 */
const Sidebar = ({ user }) => {
    
    return (
        <nav className="col-md-2 d-none d-md-block sidebar">
            <div className="sidebar-sticky">
                {/* User profile section */}
                <div className="user-info">
                    <div className="user-greeting">
                        {user && (
                            <div className="user-initial" data-testid="user-initial">
                                {/* Display first letter of user's name as avatar */}
                                {user.name ? user.name.charAt(0) : ''}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main navigation links */}
                <ul className="nav flex-column">
                    {/* Dashboard link */}
                    <li className="nav-item">
                        <NavLink
                            to="/view/dashboard"
                            className={({ isActive }) =>
                                isActive ? 'nav-link active' : 'nav-link'
                            }
                        >
                            Dashboard
                        </NavLink>
                    </li>
                    
                    {/* Documents link */}
                    <li className="nav-item">
                        <NavLink
                            to="/view/documents"
                            className={({ isActive }) =>
                                isActive ? 'nav-link active' : 'nav-link'
                            }
                        >
                            All Documents
                        </NavLink>
                    </li>
                    
                    {/* Tasks link */}
                    <li className="nav-item">
                        <NavLink
                            to="/view/tasks"
                            className={({ isActive }) =>
                                isActive ? 'nav-link active' : 'nav-link'
                            }
                        >
                            Tasks
                        </NavLink>
                    </li>
                    
                    {/* Teams link */}
                    <li className="nav-item">
                        <NavLink
                            to="/view/teams"
                            className={({ isActive }) =>
                                isActive ? 'nav-link active' : 'nav-link'
                            }
                        >
                            Teams
                        </NavLink>
                    </li>
                    
                    {/* Help link with icon */}
                    <li className="nav-item">
                        <Link to="/help" className="nav-link">
                            <div className="d-flex align-items-center">
                                <FaQuestion className="me-2" />
                                <span>Help</span>
                            </div>
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

/**
 * Maps Redux state to component props
 * 
 * @param {Object} state - Redux state
 * @returns {Object} Props derived from Redux state
 */
const mapStateToProps = (state) => ({
    user: state.auth.user, // Access user from Redux
});

export default connect(mapStateToProps)(Sidebar);