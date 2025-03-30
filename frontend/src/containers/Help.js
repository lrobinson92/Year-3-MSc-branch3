import React from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import GoogleDriveAuthCheck from '../components/GoogleDriveAuthCheck';
import { FaFileAlt, FaUsers, FaCheckSquare, FaGoogle, FaEdit } from 'react-icons/fa';

const Help = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <div className="d-flex">
        <Sidebar />
        <div className="main-content">
          <div className="recent-items-card">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Help & User Guide</h2>
            </div>
            
            {/* Google Drive Authentication Section */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaGoogle className="me-2" style={{ color: '#4285F4' }} /> 
                Google Drive Integration
              </h3>
              <div className="card p-4 mb-4">
                <h5>Why Connect Google Drive?</h5>
                <p>
                  SOPify stores all your documents in Google Drive, allowing you to:
                </p>
                <ul>
                  <li>Access your documents from anywhere</li>
                  <li>Edit documents collaboratively</li>
                  <li>Use Google's powerful editing features</li>
                  <li>Maintain version history</li>
                </ul>
                <h5 className="mt-3">How to Connect:</h5>
                <p>
                  Before creating or viewing documents, you'll need to connect your Google Drive account.
                  You'll see a prompt whenever you try to access document features without being connected.
                </p>
                
                <div className="mt-3">
                  <GoogleDriveAuthCheck showPrompt={false}>
                    <div className="alert alert-success">
                      ✅ You are currently connected to Google Drive.
                    </div>
                  </GoogleDriveAuthCheck>
                </div>
              </div>
            </div>
            
            {/* Documents Section */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaFileAlt className="me-2" style={{ color: '#0d6efd' }} /> 
                Managing Documents
              </h3>
              <div className="card p-4 mb-4">
                <h5>Creating Documents</h5>
                <p>
                  SOPify allows you to create Standard Operating Procedures (SOPs) in multiple ways:
                </p>
                <ol>
                  <li>Upload an existing document (.docx or .txt)</li>
                  <li>Create a document from scratch using the editor</li>
                  <li>Generate a document using AI by providing a prompt</li>
                  <li>Improve a document using AI</li>
                  <li>Summarise a document using AI</li>
                </ol>
                
                <h5 className="mt-3">Viewing Documents</h5>
                <p>
                  From the Documents page, you can:
                </p>
                <ul>
                  <li>See all documents you have access to</li>
                  <li>Click on any document card to view its contents</li>
                  <li>See which team a document belongs to</li>
                  <li>See when a document was last updated</li>
                </ul>
                
                <h5 className="mt-3">Editing Documents</h5>
                <p>
                  When viewing a document, click "Edit Document" to open it in Google Docs for editing.
                  Changes are automatically saved to Google Drive.
                </p>
              </div>
            </div>
            
            {/* Teams Section */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaUsers className="me-2" style={{ color: '#0d6efd' }} /> 
                Working with Teams
              </h3>
              <div className="card p-4 mb-4">
                <h5>Creating Teams</h5>
                <p>Teams allow you to collaborate with others on SOPs and tasks:</p>
                <ol>
                  <li>Go to the Teams page</li>
                  <li>Click "Create New Team"</li>
                  <li>Enter a team name and description</li>
                </ol>
                
                <h5 className="mt-3">Managing Team Members</h5>
                <p>As a team owner, you can:</p>
                <ul>
                  <li>Invite new members by email</li>
                  <li>Change members' roles (owner, member, admin)</li>
                  <li>Remove members from the team</li>
                </ul>
                
                <h5 className="mt-3">Team Documents</h5>
                <p>
                  When creating a document, you can assign it to a team, making it accessible to all team members.
                  Team documents appear in all team members' document lists.
                </p>
              </div>
            </div>
            
            {/* Tasks Section */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaCheckSquare className="me-2" style={{ color: '#0d6efd' }} /> 
                Managing Tasks
              </h3>
              <div className="card p-4 mb-4">
                <h5>Creating Tasks</h5>
                <p>Tasks help you track work related to SOPs:</p>
                <ol>
                  <li>Go to the Tasks page</li>
                  <li>Click "Create New Task"</li>
                  <li>Enter a description, assign a team member, set a due date, and choose a status</li>
                </ol>
                
                <h5 className="mt-3">Types of Tasks</h5>
                <ul>
                  <li><strong>My Tasks</strong> - Tasks assigned directly to you</li>
                  <li><strong>Team Tasks</strong> - Tasks for your teams assigned to other members</li>
                </ul>
                
                <h5 className="mt-3">Task Statuses</h5>
                <ul>
                  <li>
                    <span style={{ color: '#717186' }}>◌</span> Not Started - Task has been created but work hasn't begun
                  </li>
                  <li>
                    <span style={{ color: '#d35400' }}>⟳</span> In Progress - Work has begun on the task
                  </li>
                  <li>
                    <span style={{ color: '#0FA312' }}>✓</span> Complete - Task has been finished
                  </li>
                </ul>
                
                <h5 className="mt-3">Task Reminders</h5>
                <div className="alert alert-info">
                  <div className="d-flex align-items-center">
                    <div className="me-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-bell" viewBox="0 0 16 16">
                        <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="mb-0">
                        <strong>Automatic Email Reminders</strong><br />
                        SOPify automatically sends email reminders when tasks are due soon. 
                        You'll receive an email notification 7 days before the due date 
                        for any task assigned to you.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-3">
                  The reminder emails include:
                </p>
                <ul>
                  <li>Task description</li>
                  <li>Due date</li>
                  <li>Link to login and complete the task</li>
                </ul>
                <p>
                  This feature helps ensure that important tasks are never forgotten and 
                  team members have adequate time to complete their assigned work.
                </p>
              </div>
            </div>
            
            {/* Advanced Features */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaEdit className="me-2" style={{ color: '#0d6efd' }} /> 
                Advanced Features
              </h3>
              <div className="card p-4 mb-4">
                <h5>AI-powered Document Generation</h5>
                <p>
                  When creating a new document, you can use our AI-powered generator:
                </p>
                <ol>
                  <li>Go to Create Document and select "Generate using AI"</li>
                  <li>Enter a prompt describing the SOP you want to create</li>
                  <li>Click "Generate" and review the generated content</li>
                  <li>Edit as needed before saving</li>
                </ol>
                
                <h5 className="mt-3">Document Improvement</h5>
                <p>
                  For existing documents, you can use AI to improve them:
                </p>
                <ul>
                  <li>Open a document and click "Improve with AI"</li>
                  <li>The system will enhance clarity, formatting, and professionalism</li>
                  <li>Review and save the improvements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated
});

export default connect(mapStateToProps)(Help);