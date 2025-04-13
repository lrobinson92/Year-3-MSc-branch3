import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TeamGrid from '../../components/TeamGrid';
import { toTitleCase } from '../../utils/utils';

// Mock utils functions
jest.mock('../../utils/utils', () => ({
    toTitleCase: jest.fn(text => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase())
}));

// Mock react-router-dom's useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate
}));

describe('TeamGrid Component', () => {
    const mockTeams = [
        {
            id: 1,
            name: 'Team Alpha',
            description: 'This is Team Alpha',
            members: [
                { id: 1, user: 101, user_name: 'John Doe', role: 'owner' },
                { id: 2, user: 102, user_name: 'Jane Smith', role: 'member' }
            ]
        },
        {
            id: 2,
            name: 'Team Beta',
            description: 'This is Team Beta',
            members: [
                { id: 3, user: 103, user_name: 'Bob Johnson', role: 'owner' }
            ]
        }
    ];

    const mockCurrentUser = { id: 101 };
    const mockOnTeamClick = jest.fn();
    const mockOnEditClick = jest.fn();
    const mockOnAddMembersClick = jest.fn();
    const mockOnDeleteClick = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders teams correctly', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    currentUser={mockCurrentUser}
                />
            </MemoryRouter>
        );

        // Check if team names are displayed
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('Team Beta')).toBeInTheDocument();

        // Check if team descriptions are displayed
        expect(screen.getByText('This is Team Alpha')).toBeInTheDocument();
        expect(screen.getByText('This is Team Beta')).toBeInTheDocument();

        // Check if member initials are displayed by looking for the text content
        const memberInitials = screen.getAllByText(/^[JB]$/);
        expect(memberInitials).toHaveLength(3);
        
        // Verify owners have the owner-initial class
        const ownerInitials = screen.getAllByText(/^[JB]$/).filter(
            el => el.classList.contains('owner-initial')
        );
        expect(ownerInitials).toHaveLength(2); // John and Bob should be owners
        
        // Verify that non-owners don't have the owner-initial class
        const nonOwnerInitials = screen.getAllByText(/^[JB]$/).filter(
            el => !el.classList.contains('owner-initial')
        );
        expect(nonOwnerInitials).toHaveLength(1); // Jane should be a non-owner
    });

    test('displays empty message when no teams', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={[]}
                    emptyMessage="No teams found"
                />
            </MemoryRouter>
        );

        expect(screen.getByText('No teams found')).toBeInTheDocument();
    });

    test('shows Create Team button when showCreateButton is true', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    showCreateButton={true}
                />
            </MemoryRouter>
        );

        const createButton = screen.getByText('+ Create New Team');
        expect(createButton).toBeInTheDocument();
        expect(createButton.tagName).toBe('A');
        expect(createButton.getAttribute('href')).toBe('/create-team');
    });

    test('calls onTeamClick when a team is clicked (with showActions=false)', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    showActions={false}
                    onTeamClick={mockOnTeamClick}
                    currentUser={mockCurrentUser}
                />
            </MemoryRouter>
        );

        // Find team card and click it
        const teamCard = screen.getByText('Team Alpha').closest('.card');
        fireEvent.click(teamCard);

        expect(mockOnTeamClick).toHaveBeenCalledWith(1);
    });

    test('navigates to team detail when no onTeamClick provided', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    showActions={false}
                    currentUser={mockCurrentUser}
                />
            </MemoryRouter>
        );

        const teamCard = screen.getByText('Team Alpha').closest('.card');
        fireEvent.click(teamCard);

        expect(mockNavigate).toHaveBeenCalledWith('/team/1');
    });

    test('renders team actions for team owner', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    showActions={true}
                    currentUser={mockCurrentUser}
                    onEditClick={mockOnEditClick}
                    onAddMembersClick={mockOnAddMembersClick}
                    onDeleteClick={mockOnDeleteClick}
                />
            </MemoryRouter>
        );

        // Find dropdown for Team Alpha (where current user is owner)
        const dropdownToggle = screen.getAllByText('...')[0];
        fireEvent.click(dropdownToggle);

        // Check if actions are displayed
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Add Members')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });
    
    test('does not show owner actions for non-owner team members', () => {
        // Create a different current user who is not an owner
        const nonOwnerUser = { id: 102 }; // Jane Smith from Team Alpha
        
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    showActions={true}
                    currentUser={nonOwnerUser}
                    onEditClick={mockOnEditClick}
                    onAddMembersClick={mockOnAddMembersClick}
                    onDeleteClick={mockOnDeleteClick}
                />
            </MemoryRouter>
        );

        // Find dropdown for Team Alpha
        const dropdownToggle = screen.getAllByText('...')[0];
        fireEvent.click(dropdownToggle);

        // Only "View Team" should be available, not the owner actions
        expect(screen.getByText('View Team')).toBeInTheDocument();
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Add Members')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
    
    test('limits the number of teams displayed when limit is provided', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    limit={1}
                    currentUser={mockCurrentUser}
                />
            </MemoryRouter>
        );

        // Should only display Team Alpha
        expect(screen.getByText('Team Alpha')).toBeInTheDocument();
        expect(screen.queryByText('Team Beta')).not.toBeInTheDocument();
    });
    
    test('hides description when showDescription is false', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    showDescription={false}
                    currentUser={mockCurrentUser}
                />
            </MemoryRouter>
        );

        expect(screen.queryByText('This is Team Alpha')).not.toBeInTheDocument();
        expect(screen.queryByText('This is Team Beta')).not.toBeInTheDocument();
    });
    
    test('calls the correct handler when team actions are clicked', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    showActions={true}
                    currentUser={mockCurrentUser}
                    onEditClick={mockOnEditClick}
                    onAddMembersClick={mockOnAddMembersClick}
                    onDeleteClick={mockOnDeleteClick}
                />
            </MemoryRouter>
        );

        // Find dropdown for Team Alpha and open it
        const dropdownToggle = screen.getAllByText('...')[0];
        fireEvent.click(dropdownToggle);

        // Click the Edit button and check if handler was called
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
        expect(mockOnEditClick).toHaveBeenCalledWith(1);

        // Open dropdown again (it might have closed)
        fireEvent.click(dropdownToggle);

        // Click Add Members button
        const addMembersButton = screen.getByText('Add Members');
        fireEvent.click(addMembersButton);
        expect(mockOnAddMembersClick).toHaveBeenCalledWith(1);

        // Open dropdown again
        fireEvent.click(dropdownToggle);

        // Click Delete button
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
        expect(mockOnDeleteClick).toHaveBeenCalledWith(1);
    });
    
    test('clicking View Team in dropdown navigates to team detail', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={mockTeams}
                    showActions={true}
                    currentUser={mockCurrentUser}
                />
            </MemoryRouter>
        );

        // Open dropdown
        const dropdownToggle = screen.getAllByText('...')[0];
        fireEvent.click(dropdownToggle);

        // Click View Team
        const viewTeamButton = screen.getByText('View Team');
        fireEvent.click(viewTeamButton);
        
        expect(mockNavigate).toHaveBeenCalledWith('/team/1');
    });
    
    test('handles null or undefined teams array gracefully', () => {
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={null}
                    emptyMessage="No teams available"
                />
            </MemoryRouter>
        );

        expect(screen.getByText('No teams available')).toBeInTheDocument();
    });
    
    test('handles teams without members array gracefully', () => {
        const teamsWithoutMembers = [
            {
                id: 1,
                name: 'Team Without Members',
                description: 'This team has no members array'
            }
        ];
        
        render(
            <MemoryRouter>
                <TeamGrid 
                    teams={teamsWithoutMembers}
                    currentUser={mockCurrentUser}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('Team Without Members')).toBeInTheDocument();
        // Should not crash when trying to render member initials
    });
});