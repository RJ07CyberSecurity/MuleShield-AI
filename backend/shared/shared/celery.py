import os
from celery import Celery
from shared.config.settings import BaseAppSettings
settings = BaseAppSettings()

# Fallback configuration for celery tasks queue
redis_url = os.getenv("REDIS_URL", settings.REDIS_URL)

# For dev environments where Celery runs locally with redis
celery_app = Celery(
    "muleshield",
    broker=redis_url,
    backend=redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1
)
