from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
import psycopg2
import select

class Command(BaseCommand):
    help = 'Listen for PostgreSQL notifications and send email reminders'

    def handle(self, *args, **kwargs):
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        cursor.execute("LISTEN task_due_soon;")

        self.stdout.write(self.style.SUCCESS('Listening for task_due_soon notifications...'))

        while True:
            if select.select([conn], [], [], 5) == ([], [], []):
                continue
            conn.poll()
            while conn.notifies:
                notify = conn.notifies.pop(0)
                task_id = notify.payload
                self.send_reminder_email(task_id)

    def send_reminder_email(self, task_id):
        from api.models import Task

        try:
            task = Task.objects.get(id=task_id)
            if task.assigned_to and task.assigned_to.email:
                send_mail(
                    'Task Due Soon',
                    f'Hello {task.assigned_to.name},\n\nYour task "{task.description}" is due on {task.due_date}. Login to complete this task.',
                    'from SOPify Admin',
                    [task.assigned_to.email],
                    fail_silently=False,
                )
                self.stdout.write(self.style.SUCCESS(f'Sent reminder email for task {task_id}'))
        except Task.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Task {task_id} does not exist'))