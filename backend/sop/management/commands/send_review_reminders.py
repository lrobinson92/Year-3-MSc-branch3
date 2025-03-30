from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from sop.models import Document
from datetime import timedelta

class Command(BaseCommand):
    help = 'Send email reminders for SOPs that need review'

    def handle(self, *args, **kwargs):
        # Get documents that need review in the next 14 days and haven't had a reminder sent
        cutoff_date = timezone.now().date() + timedelta(days=14)
        docs_to_review = Document.objects.filter(
            review_date__lte=cutoff_date,
            review_date__gt=timezone.now().date(),
            review_reminder_sent=False
        )
        
        self.stdout.write(self.style.SUCCESS(f'Found {docs_to_review.count()} documents needing review reminders'))
        
        for doc in docs_to_review:
            # Send to document owner
            if doc.owner.email:
                send_mail(
                    'SOP Review Reminder',
                    f'Hello {doc.owner.name},\n\n'
                    f'Your SOP "{doc.title}" is due for review on {doc.review_date}.\n\n'
                    f'Please review this document to ensure it remains current and accurate.\n\n'
                    f'You can access it here: {doc.file_url}',
                    'from SOPify Admin',
                    [doc.owner.email],
                    fail_silently=False,
                )
                
                # If document belongs to a team, notify team admins/owners
                if doc.team:
                    admin_emails = doc.team.team_memberships.filter(
                        role__in=['member', 'owner']
                    ).exclude(
                        user=doc.owner  # Exclude the owner who already received notification
                    ).values_list('user__email', flat=True)
                    
                    if admin_emails:
                        send_mail(
                            'Team SOP Review Reminder',
                            f'Hello,\n\n'
                            f'The SOP "{doc.title}" for team {doc.team.name} is due for review on {doc.review_date}.\n\n'
                            f'Please ensure this document is reviewed to maintain accurate procedures.\n\n'
                            f'You can access it here: {doc.file_url}',
                            'from SOPify Admin',
                            list(admin_emails),
                            fail_silently=False,
                        )
                
                # Mark as reminded
                doc.review_reminder_sent = True
                doc.save()
                
                self.stdout.write(self.style.SUCCESS(f'Sent reminder for "{doc.title}"'))