import React from 'react';
import { Navigate } from 'react-router-dom';
import { connect } from 'react-redux';
import Sidebar from '../components/Sidebar';
import GoogleDriveAuthCheck from '../components/GoogleDriveAuthCheck';
import { FaFileAlt, FaUsers, FaCheckSquare, FaGoogle, FaEdit, FaLock } from 'react-icons/fa';

/**
 * Help Component
 * 
 * Comprehensive help and user guide section that provides information
 * about all major features of the application. Includes sections on
 * Google Drive integration, document management, team collaboration,
 * task management, permissions, and advanced features.
 * 
 * The component is structured as a series of expandable sections with
 * explanatory content, tables for permissions, and visual guides.
 */
const Help = ({ isAuthenticated }) => {
  // Redirect to login if user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      {/* Main layout with sidebar */}
      <div className="d-flex">
        {/* Sidebar navigation component */}
        <Sidebar />
        
        {/* Main content area */}
        <div className="main-content">
          <div className="recent-items-card">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2>Help & User Guide</h2>
            </div>
            
            {/* Google Drive Authentication Section - Explains Google Drive integration */}
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
                
                {/* Shows current Google Drive connection status */}
                <div className="mt-3">
                  <GoogleDriveAuthCheck showPrompt={false}>
                    <div className="alert alert-success">
                      ✅ You are currently connected to Google Drive.
                    </div>
                  </GoogleDriveAuthCheck>
                </div>
              </div>
            </div>
            
            {/* Documents Section - Explains document creation and management */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaFileAlt className="me-2" style={{ color: '#0d6efd' }} /> 
                Managing Documents
              </h3>
              <div className="card p-4 mb-4">
                {/* Document creation methods subsection */}
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
                
                {/* Document viewing capabilities subsection */}
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
                
                {/* Document editing workflow subsection */}
                <h5 className="mt-3">Editing Documents</h5>
                <p>
                  When viewing a document, click "Edit Document" to open it in Google Docs for editing.
                  Changes are automatically saved to Google Drive.
                </p>
              </div>
            </div>
            
            {/* Teams Section - Explains team creation and management */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaUsers className="me-2" style={{ color: '#0d6efd' }} /> 
                Working with Teams
              </h3>
              <div className="card p-4 mb-4">
                {/* Team creation process */}
                <h5>Creating Teams</h5>
                <p>Teams allow you to collaborate with others on SOPs and tasks:</p>
                <ol>
                  <li>Go to the Teams page</li>
                  <li>Click "Create New Team"</li>
                  <li>Enter a team name and description</li>
                </ol>
                
                {/* Team member management capabilities */}
                <h5 className="mt-3">Managing Team Members</h5>
                <p>As a team owner, you can:</p>
                <ul>
                  <li>Invite new members by email</li>
                  <li>Change members' roles (owner, member, admin)</li>
                  <li>Remove members from the team</li>
                </ul>
                
                {/* Team document sharing explanation */}
                <h5 className="mt-3">Team Documents</h5>
                <p>
                  When creating a document, you can assign it to a team, making it accessible to all team members.
                  Team documents appear in all team members' document lists.
                </p>
              </div>
            </div>
            
            {/* Tasks Section - Explains task creation and management */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaCheckSquare className="me-2" style={{ color: '#0d6efd' }} /> 
                Managing Tasks
              </h3>
              <div className="card p-4 mb-4">
                {/* Task creation process */}
                <h5>Creating Tasks</h5>
                <p>Tasks help you track work related to SOPs:</p>
                <ol>
                  <li>Go to the Tasks page</li>
                  <li>Click "Create New Task"</li>
                  <li>Enter a description, assign a team member, set a due date, and choose a status</li>
                </ol>
                
                {/* Task categorization explanation */}
                <h5 className="mt-3">Types of Tasks</h5>
                <ul>
                  <li><strong>My Tasks</strong> - Tasks assigned directly to you</li>
                  <li><strong>Team Tasks</strong> - Tasks for your teams assigned to other members</li>
                </ul>
                
                {/* Task status types and their visual indicators */}
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
                
                {/* Task reminder system explanation */}
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
            
            {/* Permissions & Access Control Section - Explains role-based security */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaLock className="me-2" style={{ color: '#dc3545' }} /> 
                Permissions & Access Control
              </h3>
              <div className="card p-4 mb-4">
                {/* Team role descriptions */}
                <h5>Team Roles & Permissions</h5>
                <p>SOPify uses role-based access control with three distinct roles for team collaboration:</p>
                
                {/* Role permissions table with detailed breakdown */}
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Role</th>
                        <th>Description</th>
                        <th>Permissions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Owner</strong></td>
                        <td>Team creator or designated owner</td>
                        <td>
                          <ul className="mb-0 ps-3">
                            <li>Create, edit and delete the team</li>
                            <li>Invite new members</li>
                            <li>Change member roles</li>
                            <li>Remove members</li>
                            <li>Full access to all team resources</li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Member</strong></td>
                        <td>Regular team participant</td>
                        <td>
                          <ul className="mb-0 ps-3">
                            <li>View team information</li>
                            <li>Create content within the team</li>
                            <li>Edit team content</li>
                            <li>Cannot delete content created by others</li>
                          </ul>
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Admin</strong></td>
                        <td>Observer role with limited privileges</td>
                        <td>
                          <ul className="mb-0 ps-3">
                            <li>View team information and resources</li>
                            <li>Can edit tasks assigned directly to them</li>
                            <li>Otherwise has read-only access</li>
                            <li>Cannot create or delete team content</li>
                          </ul>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Important notice about personal vs. team content */}
                <div className="alert alert-warning mt-4">
                  <strong>Important:</strong> The permissions below apply only to team documents and tasks. 
                  Personal items (not assigned to any team) are fully controlled by their creator, 
                  regardless of role, and are not visible to other users.
                </div>
                
                {/* Document permissions by role */}
                <h5 className="mt-4">Team Document Permissions</h5>
                <p>Access to team documents is controlled by your role in that team:</p>
                
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Action</th>
                        <th>Owner</th>
                        <th>Member</th>
                        <th>Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>View team documents</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                      </tr>
                      <tr>
                        <td>Create new team documents</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-danger">✗</td>
                      </tr>
                      <tr>
                        <td>Edit team documents</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-danger">✗</td>
                      </tr>
                      <tr>
                        <td>Delete team documents</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-danger">✗</td>
                        <td className="text-center text-danger">✗</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Task permissions by role */}
                <h5 className="mt-4">Team Task Permissions</h5>
                <p>Team task management follows similar permission structure:</p>
                
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Action</th>
                        <th>Owner</th>
                        <th>Member</th>
                        <th>Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>View team tasks</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                      </tr>
                      <tr>
                        <td>Create team tasks assigned to self</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-danger">✗</td>
                      </tr>
                      <tr>
                        <td>Create team tasks assigned to others</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-danger">✗</td>
                        <td className="text-center text-danger">✗</td>
                      </tr>
                      <tr>
                        <td>Edit tasks assigned to self</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                      </tr>
                      <tr>
                        <td>Edit tasks assigned to others</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-danger">✗</td>
                        <td className="text-center text-danger">✗</td>
                      </tr>
                      <tr>
                        <td>Mark tasks assigned to self as complete</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-success">✓</td>
                      </tr>
                      <tr>
                        <td>Delete any team task</td>
                        <td className="text-center text-success">✓</td>
                        <td className="text-center text-danger">✗</td>
                        <td className="text-center text-danger">✗</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
              </div>
            </div>
            
            {/* Advanced Features Section - Explains AI-powered features */}
            <div className="mb-5">
              <h3 className="d-flex align-items-center mb-3">
                <FaEdit className="me-2" style={{ color: '#0d6efd' }} /> 
                Advanced Features
              </h3>
              <div className="card p-4 mb-4">
                {/* AI document generation workflow */}
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
                
                {/* AI document improvement workflow */}
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

/**
 * Maps Redux state to component props
 * Provides authentication status to protect this route
 */
const mapStateToProps = (state) => ({
  isAuthenticated: state.auth.isAuthenticated
});

/**
 * Connect component to Redux store
 * This enables access to the isAuthenticated state property
 */
export default connect(mapStateToProps)(Help);