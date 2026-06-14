from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Task
from app.repositories.base import BaseRepository
from app.modules.tasks.schemas import TaskCreate, TaskUpdate


class TaskRepository(BaseRepository[Task, TaskCreate, TaskUpdate]):
    def __init__(self, session: AsyncSession):
        super().__init__(Task, session)
