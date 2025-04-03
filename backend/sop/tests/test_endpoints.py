from django.test import TestCase
from django.urls import get_resolver
from rest_framework.test import APIClient
from rest_framework import status

class EndpointDiscoveryTest(TestCase):
    """Test to discover auth endpoint URLs"""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_discover_urls(self):
        """Print all available URLs in the project"""
        resolver = get_resolver(None)
        url_patterns = resolver.url_patterns
        
        print("\n=== Available URL patterns ===")
        def print_patterns(patterns, prefix=''):
            for pattern in patterns:
                if hasattr(pattern, 'url_patterns'):
                    # This is an include - print its sub-patterns
                    print(f"{prefix}[Include] {pattern.pattern}")
                    print_patterns(pattern.url_patterns, prefix + '  ')
                else:
                    # This is a URL pattern
                    name = f" name='{pattern.name}'" if pattern.name else ""
                    print(f"{prefix}URL: {pattern.pattern}{name}")
        
        print_patterns(url_patterns)
        
        # Test a few common auth endpoints to find which ones exist
        test_urls = [
            '/api/auth/users/',
            '/api/auth/users/create/',
            '/api/auth/token/',
            '/api/auth/token/obtain/',
            '/api/auth/token/refresh/',
            '/api/auth/jwt/create/',
            '/api/auth/jwt/refresh/',
            '/api/auth/login/',
            '/api/auth/logout/',
            '/api/users/',
            '/api/users/register/',
            '/api/token/',
            '/api/token/refresh/',
            '/auth/users/',
            '/auth/jwt/create/'
        ]
        
        print("\n=== Testing endpoints ===")
        for url in test_urls:
            # Try GET and POST
            get_response = self.client.get(url)
            post_response = self.client.post(url, {}, format='json')
            
            get_status = get_response.status_code
            post_status = post_response.status_code
            
            # Only show non-404 responses
            if get_status != 404 or post_status != 404:
                print(f"URL: {url}")
                print(f"  GET: {get_status}")
                print(f"  POST: {post_status}")