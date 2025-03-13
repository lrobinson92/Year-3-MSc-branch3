import React from 'react';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';

const Sidebar = ( { user } ) => {
    const getUserInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '';
    };
    
    return (
        <nav className="col-md-2 d-none d-md-block sidebar">
            <div className="sidebar-sticky">
                <div className="user-info">
                    <div className="user-greeting">
                    {user && (
                            <span className="user-initial">
                                {getUserInitial(user.name)}
                            </span>
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
                </ul>
            </div>
        </nav>
    );
};

const mapStateToProps = (state) => ({
    user: state.auth.user, // Access user from Redux
});

export default connect(mapStateToProps)(Sidebar);