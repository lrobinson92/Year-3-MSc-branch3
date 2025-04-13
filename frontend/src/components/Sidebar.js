import React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { connect } from 'react-redux';
import { FaQuestion, FaBug } from 'react-icons/fa';

const Sidebar = ( { user } ) => {

    const location = useLocation();

    const getUserInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '';
    };
    
    return (
        <nav className="col-md-2 d-none d-md-block sidebar">
            <div className="sidebar-sticky">
                <div className="user-info">
                    <div className="user-greeting">
                        {user && (
                            <div className="user-avatar" data-testid="user-avatar">
                                {user.name ? user.name.charAt(0) : ''}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Navigation */}
                <ul className="nav flex-column">
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

const mapStateToProps = (state) => ({
    user: state.auth.user, // Access user from Redux
});

export default connect(mapStateToProps)(Sidebar);