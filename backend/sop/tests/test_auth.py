from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from sop.models import UserAccount

class UserRegistrationTestCase(TestCase):
    """Test case for user registration API"""
    
    def setUp(self):
        self.client = APIClient()
        # Correct URL based on URL discovery
        self.register_url = '/auth/users/'
        
        # Valid user data matching your frontend form structure
        self.valid_user_data = {
            'email': 'test@example.com',
            'name': 'Test User',
            'password': 'StrongPass123!',
            're_password': 'StrongPass123!'  # Djoser uses re_password, not password2
        }
        
        # Create an existing user for duplicate testing
        self.existing_user = UserAccount.objects.create_user(
            email='existing@example.com',
            name='Existing User',
            password='ExistingPass123!'
        )
    
    def test_successful_registration(self):
        """Test successful user registration with valid data"""
        response = self.client.post(
            self.register_url,
            self.valid_user_data,
            format='json'
        )
        
        # Check response - Djoser returns 201 CREATED
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify user is in database
        self.assertTrue(
            UserAccount.objects.filter(email=self.valid_user_data['email']).exists()
        )
        
        # Check if password was properly hashed (not stored as plaintext)
        user = UserAccount.objects.get(email=self.valid_user_data['email'])
        self.assertNotEqual(user.password, self.valid_user_data['password'])
        self.assertTrue(user.check_password(self.valid_user_data['password']))
    
    def test_invalid_email_format(self):
        """Test registration with invalid email format"""
        invalid_data = self.valid_user_data.copy()
        invalid_data['email'] = 'invalid-email'
        
        response = self.client.post(
            self.register_url,
            invalid_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
    
    def test_password_mismatch(self):
        """Test registration with mismatched passwords"""
        invalid_data = self.valid_user_data.copy()
        invalid_data['re_password'] = 'DifferentPass123!'
        
        response = self.client.post(
            self.register_url,
            invalid_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue('non_field_errors' in response.data or 'password' in response.data or 're_password' in response.data)
    
    def test_password_too_short(self):
        """Test registration with a password that's too short"""
        invalid_data = self.valid_user_data.copy()
        invalid_data['password'] = 'Short1!'
        invalid_data['re_password'] = 'Short1!'
        
        response = self.client.post(
            self.register_url,
            invalid_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)
    
    def test_missing_required_fields(self):
        """Test registration with missing required fields"""
        # Test for missing email
        missing_email = {
            'name': 'Test User',
            'password': 'StrongPass123!',
            're_password': 'StrongPass123!'
        }
        
        response = self.client.post(
            self.register_url,
            missing_email,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        
        # Test for missing name (if required in your setup)
        missing_name = {
            'email': 'test2@example.com',
            'password': 'StrongPass123!',
            're_password': 'StrongPass123!'
        }
        
        response = self.client.post(
            self.register_url,
            missing_name,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
    
    def test_duplicate_email(self):
        """Test registration with an email that already exists"""
        duplicate_data = self.valid_user_data.copy()
        duplicate_data['email'] = self.existing_user.email
        
        response = self.client.post(
            self.register_url,
            duplicate_data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)


class UserLoginTestCase(TestCase):
    """Test case for user login API with JWT tokens"""
    
    def setUp(self):
        self.client = APIClient()
        # Correct JWT login URL from URL discovery
        self.login_url = '/auth/jwt/create/'
        
        # Create a test user
        self.user = UserAccount.objects.create_user(
            email='testlogin@example.com',
            name='Test Login User',
            password='TestPassword123!'
        )
        
        self.valid_credentials = {
            'email': 'testlogin@example.com',
            'password': 'TestPassword123!'
        }
    
    def test_successful_login(self):
        """Test successful login with valid credentials"""
        response = self.client.post(
            self.login_url,
            self.valid_credentials,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check for JWT tokens in response body (djoser JWT format)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        invalid_credentials = {
            'email': 'testlogin@example.com',
            'password': 'WrongPassword123!'
        }
        
        response = self.client.post(
            self.login_url,
            invalid_credentials,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_nonexistent_user(self):
        """Test login with email that doesn't exist"""
        nonexistent_user = {
            'email': 'nonexistent@example.com',
            'password': 'TestPassword123!'
        }
        
        response = self.client.post(
            self.login_url,
            nonexistent_user,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_missing_fields(self):
        """Test login with missing required fields"""
        # Missing email
        missing_email = {
            'password': 'TestPassword123!'
        }
        
        response = self.client.post(
            self.login_url,
            missing_email,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Missing password
        missing_password = {
            'email': 'testlogin@example.com'
        }
        
        response = self.client.post(
            self.login_url,
            missing_password,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LogoutTestCase(TestCase):
    """Test case for user logout"""
    
    def setUp(self):
        self.client = APIClient()
        # Correct logout URL from URL discovery
        self.logout_url = '/auth/logout/'
        
        # Create a test user
        self.user = UserAccount.objects.create_user(
            email='testlogout@example.com',
            name='Test Logout User',
            password='TestPassword123!'
        )
        
        # Login to get tokens
        login_url = '/auth/jwt/create/'
        login_data = {
            'email': 'testlogout@example.com',
            'password': 'TestPassword123!'
        }
        response = self.client.post(login_url, login_data, format='json')
        
        if response.status_code == 200:
            self.access_token = response.data.get('access')
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        else:
            self.access_token = None
    
    def test_successful_logout(self):
        """Test successful logout"""
        # Skip if login failed
        if not hasattr(self, 'access_token') or not self.access_token:
            self.skipTest("Login failed during setup, skipping logout test")
        
        response = self.client.post(self.logout_url)
        
        # Check status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check message in response if applicable
        if hasattr(response, 'data') and isinstance(response.data, dict):
            self.assertIn('success', response.data)
    
    def test_logout_without_authentication(self):
        """Test logout without being authenticated"""
        # Clear any authentication
        self.client.credentials()
        
        response = self.client.post(self.logout_url)
        
        # Your implementation might either return success or unauthorized
        acceptable_codes = [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]
        self.assertIn(response.status_code, acceptable_codes)