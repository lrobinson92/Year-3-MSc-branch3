from django.test import TestCase
from django.urls import get_resolver
from rest_framework.test import APIClient
from rest_framework import status

class EndpointDiscoveryTest(TestCase):
    """Test to discover auth endpoint URLs"""
    
    def setUp(self):
        self.client = APIClient()
    
    def get_all_urls(self):
        """Retrieve all available URLs in the project"""
        resolver = get_resolver(None)
        url_patterns = resolver.url_patterns
        
        urls = []
        def collect_patterns(patterns, prefix=''):
            for pattern in patterns:
                if hasattr(pattern, 'url_patterns'):
                    # This is an include - collect its sub-patterns
                    collect_patterns(pattern.url_patterns, prefix + '  ')
                else:
                    # This is a URL pattern
                    urls.append(str(pattern.pattern))
        
        collect_patterns(url_patterns)
        return urls
    
    def test_discover_urls(self):
        """Print all available URLs in the project"""
        urls = self.get_all_urls()
        print("\nDiscovered URLs:")
        for url in urls:
            # Skip the root URL to avoid template issues
            if url == '/':
                print(f"  Skipping {url} (requires template)")
                continue
                
            print(f"  Testing {url}")
            get_response = self.client.get(url)
            print(f"    GET: {get_response.status_code}")