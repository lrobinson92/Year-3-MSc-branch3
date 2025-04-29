import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { createTeam } from '../actions/team';
import { FaArrowLeft } from 'react-icons/fa';

// This component is a form for creating a new team
const CreateTeam = ({ createTeam, isAuthenticated }) => {
    // Store and track the team information entered by user
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Extract values from the form data for easier access
    const { name, description } = formData;

    // Function to update form data when user types in fields
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Set up navigation for redirecting after form submission
    const navigate = useNavigate();

    // Function that runs when the form is submitted
    const onSubmit = async (e) => {
        // Prevent the form from refreshing the page
        e.preventDefault();
        try {
            // Send the team information to the server
            await createTeam(name, description);
            // Show success message
            alert("Team created successfully!");
            // Redirect to teams page
            navigate('/view/teams');
        } catch (error) {
            // Show error message if team creation fails
            alert("Failed to create team. Please try again.");
        }
    };

    // If user is not logged in, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to='/login' />;
    }

    // Function to handle the back button click
    const handleGoBack = () => {
        navigate(-1); // Go back to previous page
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
            {/* Team creation form card */}
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <h1 className="text-center mb-4">Create Team</h1>
                <form onSubmit={onSubmit}>
                    {/* Team name input field */}
                    <div className="form-group mb-4">
                        <input
                            className='form-control'
                            type='text'
                            placeholder='Team Name*'
                            name='name'
                            value={name}
                            onChange={onChange}
                            required
                        />
                    </div>
                    {/* Team description input field */}
                    <div className='form-group mb-4'>
                        <textarea
                            className='form-control'
                            placeholder='Description'
                            name='description'
                            value={description}
                            onChange={onChange}
                        />
                    </div>
                    {/* Submit button */}
                    <button className="btn btn-primary w-100" type='submit'>Create Team</button>
                </form>
            </div>
        </div>
    );
};

// Connect component to Redux state management
const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { createTeam })(CreateTeam);