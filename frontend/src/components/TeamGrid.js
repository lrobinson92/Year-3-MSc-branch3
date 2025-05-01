import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import CustomToggle from '../utils/customToggle';
import { toTitleCase } from '../utils/utils';

/**
 * TeamGrid Component
 *
 * Displays teams in a responsive grid layout with optional actions.
 * Supports team management functions like viewing, editing, adding members, and deletion.
 *
 * @param {Array} teams - List of team objects to display
 * @param {string} emptyMessage - Message to show when no teams exist
 * @param {number} limit - Optional limit for number of teams to show
 * @param {boolean} showCreateButton - Whether to show the "Create New Team" button
 * @param {boolean} showActions - Whether to show action dropdown menu for teams
 * @param {boolean} showDescription - Whether to show team descriptions
 * @param {Object} currentUser - Current user object to determine permissions
 * @param {Function} onTeamClick - Custom handler for team card clicks
 * @param {Function} onEditClick - Handler for edit team action
 * @param {Function} onAddMembersClick - Handler for add members action
 * @param {Function} onDeleteClick - Handler for delete team action
 */
const TeamGrid = ({ 
    teams, 
    emptyMessage = "No teams available", 
    limit = null,
    showCreateButton = false,
    showActions = true,
    showDescription = true,
    currentUser,
    onTeamClick,
    onEditClick,
    onAddMembersClick,
    onDeleteClick
}) => {
    // Navigation hook for redirecting to team details
    const navigate = useNavigate();
    
    // If limit is set, only show that many teams
    const displayTeams = limit ? teams.slice(0, limit) : teams;
    
    /**
     * Render empty state when no teams are available
     * Shows create button if enabled and the empty message
     */
    if (!teams || teams.length === 0) {
        return (
            <div>
                {showCreateButton && (
                    <div className="d-flex justify-content-end mb-3">
                        <Link to="/create-team" className="btn btn-primary">
                            + Create New Team
                        </Link>
                    </div>
                )}
                <p>{emptyMessage}</p>
            </div>
        );
    }
    
    /**
     * Handle click on a team card
     * Uses custom handler if provided, otherwise navigates to team details page
     * 
     * @param {string|number} teamId - ID of clicked team
     */
    const handleTeamClick = (teamId) => {
        if (onTeamClick) {
            onTeamClick(teamId);
        } else {
            navigate(`/team/${teamId}`);
        }
    };

    /**
     * Determine if current user is owner of the specified team
     * Used to conditionally show owner-only actions
     * 
     * @param {Object} team - Team to check ownership for
     * @returns {boolean} True if current user is team owner
     */
    const isTeamOwner = (team) => {
        if (!team || !currentUser) return false;
        const userMembership = team.members?.find(member => member.user === currentUser.id);
        return userMembership?.role === 'owner';
    };

    return (
        <div>
            {/* Create team button (conditional) */}
            {showCreateButton && (
                <div className="d-flex justify-content-end mb-3">
                    <Link to="/create-team" className="btn btn-primary">
                        + Create New Team
                    </Link>
                </div>
            )}
            
            {/* Teams grid layout */}
            <div className="row">
                {displayTeams.map((team) => (
                    <div className="col-md-4 mb-3" key={team.id}>
                        <div 
                            className="card p-3 view"
                            onClick={showActions ? null : () => handleTeamClick(team.id)} 
                            style={showActions ? {} : {cursor: 'pointer'}}
                        >
                            {/* Team header with name and actions */}
                            <div className="d-flex justify-content-between align-items-center">
                                <h4>{team.name}</h4>
                                {showActions && (
                                    <Dropdown>
                                        <Dropdown.Toggle as={CustomToggle} id={`dropdown-team-${team.id}`}>
                                            ...
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="custom-dropdown-menu">
                                            <Dropdown.Item onClick={() => handleTeamClick(team.id)}>View Team</Dropdown.Item>
                                            
                                            {/* Owner-only actions */}
                                            {isTeamOwner(team) && onEditClick && (
                                                <Dropdown.Item onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditClick(team.id);
                                                }}>Edit</Dropdown.Item>
                                            )}
                                            
                                            {isTeamOwner(team) && onAddMembersClick && (
                                                <Dropdown.Item onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddMembersClick(team.id);
                                                }}>Add Members</Dropdown.Item>
                                            )}
                                            
                                            {isTeamOwner(team) && onDeleteClick && (
                                                <Dropdown.Item onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteClick(team.id);
                                                }}>Delete</Dropdown.Item>
                                            )}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                )}
                            </div>
                            
                            {/* Team member avatars */}
                            <ul className="member-list">
                                {team.members && team.members.map((member) => (
                                    <li key={member.id}>
                                        <span
                                            className={`member-initial ${member.role === 'owner' ? 'owner-initial' : ''}`}
                                            title={`${member.user_name} (${toTitleCase(member.role)})`}
                                        >
                                            {member.user_name.charAt(0).toUpperCase()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            
                            {/* Team description (conditional) */}
                            {showDescription && team.description && <p>{team.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamGrid;