from django.test import TestCase
from sop.models import Task, Team, TeamMembership, UserAccount
from sop.serializers import TaskSerializer, TeamSerializer, TeamMembershipSerializer

class TeamMembershipSerializerTest(TestCase):
    def setUp(self):
        self.user = UserAccount.objects.create_user(email='testuser@example.com', password='testpass', name='Test')
        self.team = Team.objects.create(name='Test Team', description='A test team', created_by=self.user)
        self.membership = TeamMembership.objects.create(user=self.user, team=self.team, role='member')

    def test_team_membership_serializer(self):
        serializer = TeamMembershipSerializer(self.membership)
        data = serializer.data

        self.assertEqual(data['id'], self.membership.id)
        self.assertEqual(data['user'], self.membership.user.id)
        self.assertEqual(data['team'], self.membership.team.id)
        self.assertEqual(data['role'], self.membership.role)
        self.assertEqual(data['user_name'], f'{self.user.name}')
        self.assertEqual(data['team_name'], self.membership.team.name)

class TeamSerializerTest(TestCase):
    def setUp(self):
        self.user = UserAccount.objects.create_user(email='testuser@example.com', password='testpass', name='Test')
        self.team = Team.objects.create(name='Test Team', description='A test team', created_by=self.user)
        self.membership = TeamMembership.objects.create(user=self.user, team=self.team, role='member')

    def test_team_serializer(self):
        serializer = TeamSerializer(self.team)
        data = serializer.data

        self.assertEqual(data['id'], self.team.id)
        self.assertEqual(data['name'], self.team.name)
        self.assertEqual(data['description'], self.team.description)
        self.assertEqual(data['created_by'], self.team.created_by.id)
        self.assertEqual(len(data['members']), 1)
        self.assertEqual(data['members'][0]['id'], self.membership.id)
        self.assertEqual(data['members'][0]['user'], self.membership.user.id)
        self.assertEqual(data['members'][0]['team'], self.membership.team.id)
        self.assertEqual(data['members'][0]['role'], self.membership.role)
        self.assertEqual(data['members'][0]['user_name'], f'{self.user.name}')
        self.assertEqual(data['members'][0]['team_name'], self.membership.team.name)

class TaskSerializerTest(TestCase):
    def setUp(self):
        self.user = UserAccount.objects.create_user(email='testuser@example.com', password='testpass', name='Test')
        self.team = Team.objects.create(name='Test Team', description='A test team', created_by=self.user)
        self.task = Task.objects.create(
            description='Test Task',
            assigned_to=self.user,
            team=self.team,
            due_date='2023-10-01',
            status='not_started'
        )

    def test_task_serializer(self):
        serializer = TaskSerializer(self.task)
        data = serializer.data

        self.assertEqual(data['id'], self.task.id)
        self.assertEqual(data['description'], self.task.description)
        self.assertEqual(data['assigned_to'], self.task.assigned_to.id)
        self.assertEqual(data['assigned_to_name'], f'{self.user.name}')
        self.assertEqual(data['team'], self.task.team.id)
        self.assertEqual(data['team_name'], self.task.team.name)
        self.assertEqual(data['due_date'], self.task.due_date)
        self.assertEqual(data['status'], self.task.status)

    def test_task_serializer_with_no_assigned_to(self):
        task = Task.objects.create(
            description='Test Task No Assigned',
            team=self.team,
            due_date='2023-10-01',
            status='not_started'
        )
        serializer = TaskSerializer(task)
        data = serializer.data

        self.assertEqual(data['id'], task.id)
        self.assertEqual(data['description'], task.description)
        self.assertIsNone(data['assigned_to'])
        self.assertEqual(data['assigned_to_name'], 'Unassigned')
        self.assertEqual(data['team'], task.team.id)
        self.assertEqual(data['team_name'], task.team.name)
        self.assertEqual(data['due_date'], task.due_date)
        self.assertEqual(data['status'], task.status)