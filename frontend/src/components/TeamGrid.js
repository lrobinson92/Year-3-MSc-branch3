import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import CustomToggle from '../utils/customToggle';
import { toTitleCase } from '../utils/utils';

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
    const navigate = useNavigate();
    
    // If limit is set, only show that many teams
    const displayTeams = limit ? teams.slice(0, limit) : teams;
    
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
    
    const handleTeamClick = (teamId) => {
        if (onTeamClick) {
            onTeamClick(teamId);
        } else {
            navigate(`/team/${teamId}`);
        }
    };

    // Check if the current user is the owner of a team
    const isTeamOwner = (team) => {
        if (!team || !currentUser) return false;
        const userMembership = team.members?.find(member => member.user === currentUser.id);
        return userMembership?.role === 'owner';
    };

    return (
        <div>
            {showCreateButton && (
                <div className="d-flex justify-content-end mb-3">
                    <Link to="/create-team" className="btn btn-primary">
                        + Create New Team
                    </Link>
                </div>
            )}
            <div className="row">
                {displayTeams.map((team) => (
                    <div className="col-md-4 mb-3" key={team.id}>
                        <div 
                            className="card p-3 view"
                            onClick={showActions ? null : () => handleTeamClick(team.id)} 
                            style={showActions ? {} : {cursor: 'pointer'}}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <h4>{team.name}</h4>
                                {showActions && (
                                    <Dropdown>
                                        <Dropdown.Toggle as={CustomToggle} id={`dropdown-team-${team.id}`}>
                                            ...
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu className="custom-dropdown-menu">
                                            <Dropdown.Item onClick={() => handleTeamClick(team.id)}>View Team</Dropdown.Item>
                                            
                                            {/* Only show these options if user is the team owner */}
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
                            {showDescription && team.description && <p>{team.description}</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamGrid;