import React, { useState } from 'react';
import { Navigate, useNavigate  } from 'react-router-dom';
import { connect } from 'react-redux';
import { createTeam } from '../actions/team';
import { FaArrowLeft } from 'react-icons/fa';

const CreateTeam = ({ createTeam, isAuthenticated }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const { name, description } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await createTeam(name, description);
            alert("Team created successfully!");
            navigate('/view/teams');
        } catch (error) {
            alert("Failed to create team. Please try again.");
        }
    };

    if (!isAuthenticated) {
        return <Navigate to='/login' />;
    }

    const handleGoBack = () => {
        navigate(-1); // This navigates back one step in history
    };

    return (
        <div className='container mt-5 entry-container'>
            <FaArrowLeft 
                                                    className="back-arrow" 
                                                    onClick={handleGoBack} 
                                                    style={{ cursor: 'pointer' }}
                                                    title="Go back to previous page" 
                                                />
            <div className="card p-4 mx-auto" style={{ maxWidth: '400px' }}>
                <h1 className="text-center mb-4">Create Team</h1>
                <form onSubmit={onSubmit}>
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
                    <div className='form-group mb-4'>
                        <textarea
                            className='form-control'
                            placeholder='Description'
                            name='description'
                            value={description}
                            onChange={onChange}
                        />
                    </div>
                    <button className="btn btn-primary w-100" type='submit'>Create Team</button>
                </form>
            </div>
        </div>
    );
};

const mapStateToProps = state => ({
    isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps, { createTeam })(CreateTeam);