import os
import sys

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import settings based on your project structure
from .settings import *  # If settings.py is in core directory
# OR if your settings are elsewhere, use the correct path:
# from settings import *  # If settings.py is in root directory

# Use in-memory SQLite for faster tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}


# Disable email sending during tests
EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend'