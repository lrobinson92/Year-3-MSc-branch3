import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { connect } from 'react-redux';
import { editTeam, updateMemberRole, removeMember } from '../actions/team';
import axiosInstance from '../utils/axiosConfig';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';

const EditTeam = ({ editTeam, updateMemberRole, removeMember, user, teams }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ name: '', description: '' });
    const [members, setMembers] = useState([]);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);

    const { name, description } = formData;

    useEffect(() => {
        const fetchTeam = async () => {
            try {
                const res = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/${id}/`, { withCredentials: true });
                setFormData({ name: res.data.name, description: res.data.description });

                // Fetch team members
                const membersRes = await axiosInstance.get(`${process.env.REACT_APP_API_URL}/api/teams/${id}/users-in-same-team/`, { withCredentials: true });
                
                console.log("🔍 Team Members API Response:", membersRes.data);
                console.log("🔍 Logged-in User:", user);
                
                setMembers(membersRes.data);

                // Check if the user is the team owner
                const userMembership = membersRes.data.find(member => member.user === user.id);
                console.log("🔍 Found User Membership:", userMembership);

                setIsOwner(userMembership?.role === 'owner');

                setLoading(false);
            } catch (err) {
                console.error('Failed to fetch team data:', err);
                setLoading(false);
            }
        };

        fetchTeam();
    }, [id, user]);

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await editTeam(id, name, description);
            alert("Team updated successfully!");
            navigate('/view/teams');
        } catch (error) {
            alert("Failed to update team. Please try again.");
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await updateMemberRole(id, userId, newRole);
            alert("User role updated!");
            setMembers(members.map(m => m.user === userId ? { ...m, role: newRole } : m));
        } catch (err) {
            console.error("❌ Failed to update role:", err.response?.data || err.message);
            alert("Failed to update role. Please check permissions.");
        }
    };

    const handleRemoveMember = async (userId) => {
        const confirmDelete = window.confirm("Are you sure you want to remove this member?");
        if (!confirmDelete) return;

        try {
            await removeMember(id, userId);
            alert("User removed!");
            setMembers(members.filter(m => m.user !== userId));
        } catch (err) {
            console.error("❌ Failed to remove member:", err.response?.data || err.message);
            alert("Failed to remove member.");
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className='container mt-5 entry-container'>
            <FaArrowLeft className="back-arrow" onClick={() => navigate('/view/teams')} />
            <div className="card p-4 mx-auto" style={{ maxWidth: '500px' }}>
                <h1 className="text-center mb-4">Edit Team</h1>
                <form onSubmit={onSubmit}>
                    <div className="form-group mb-3">
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
                    <div className='form-group mb-3'>
                        <textarea
                            className='form-control'
                            placeholder='Description'
                            name='description'
                            value={description}
                            onChange={onChange}
                        />
                    </div>
                    <button className="btn btn-primary w-100 mb-3" type='submit'>Update Team</button>
                </form>

                {isOwner && (
                    <div className="mt-4">
                        <h3>Team Members</h3>
                        <ul className="list-group">
                            {members.map(member => (
                                <li key={member.user} className="list-group-item d-flex justify-content-between align-items-center">
                                    {member.user_name}
                                    <select 
                                        className="form-control form-control-sm w-50"
                                        value={member.role}
                                        onChange={(e) => handleUpdateRole(member.user, e.target.value)}
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                        <option value="owner">Owner</option>
                                    </select>
                                    <FaTrash className="text-danger" onClick={() => handleRemoveMember(member.user)} />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

const mapStateToProps = (state) => ({
    user: state.auth.user,
    teams: state.team.teams
});

export default connect(mapStateToProps, { editTeam, updateMemberRole, removeMember })(EditTeam);
