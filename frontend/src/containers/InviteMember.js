import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { inviteTeamMember } from '../actions/team';
import { FaArrowLeft } from 'react-icons/fa';

/**
 * InviteMember Component
 *
 * Allows team owners to invite new members to their team by email.
 * Users can specify the role for the invitee (member, admin, or owner).
 * After a successful invitation, user is redirected back to the teams page.
 */
const InviteMember = ({ inviteTeamMember }) => {
    // Extract team ID from URL parameters
    const { teamId } = useParams();
    // Navigation hook for redirecting after operations
    const navigate = useNavigate();

    // State management
    const [email, setEmail] = useState('');         // Email address of invitee
    const [role, setRole] = useState('member');     // Default role for new members
    const [message, setMessage] = useState('');     // Feedback message for user
    const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

    // Event handlers for form inputs
    const onChange = (e) => setEmail(e.target.value);
    const onChangeRole = (e) => setRole(e.target.value);

    /**
     * Handle form submission to send invitation
     * Uses Redux action to create and send invitation email
     */
    const onSubmit = async (e) => {
        e.preventDefault();
        
        // Prevent multiple submissions
        if (isSubmitting) return;
        
        setIsSubmitting(true);
        
        try {
            // Use Redux action to make API call
            const result = await inviteTeamMember(teamId, email, role);
            
            if (result.success) {
                // Show success message and redirect
                setMessage(result.data.message || 'Invitation sent successfully!');
                alert("Invitation sent successfully!");
                navigate('/view/teams');
            } else {
                // Show error message if invitation fails
                setMessage(result.error || 'Failed to send invitation');
            }
        } catch (err) {
            // Show error message if invitation fails
            setMessage('Failed to send invitation, user may already be a member!');
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Navigate back to previous page
     */
    const handleGoBack = () => {
        navigate(-1);
    };

    return (
        <div className='container mt-5 entry-container'>
            {/* Back button */}
            <FaArrowLeft 
                className="back-arrow" 
                onClick={handleGoBack} 
                style={{ cursor: 'pointer' }}
                title="Go back to previous page" 
            />
            
            {/* Invitation form card */}
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <h1 className="text-center mb-4">Invite Member</h1>
                <form onSubmit={onSubmit}>
                    {/* Email input field */}
                    <div className="form-group mb-4">
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Enter email"
                            value={email}
                            onChange={onChange}
                            required
                        />
                    </div>
                    
                    {/* Role selection dropdown */}
                    <div className="form-group mb-3">
                        <label>Select Role</label>
                        <select className="form-control" value={role} onChange={onChangeRole}>
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                        </select>
                    </div>
                    
                    {/* Submit button */}
                    <button 
                        type="submit" 
                        className="btn btn-primary w-100"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Sending...' : 'Invite'}
                    </button>
                </form>
                
                {/* Status/error message display */}
                {message && (
                    <div className={`alert ${message.includes('Failed') ? 'alert-danger' : 'alert-success'} mt-3`}>
                        {message}
                    </div>
                )}
            </div>
        </div>
    );
};

// Connect component to Redux store
export default connect(null, { inviteTeamMember })(InviteMember);