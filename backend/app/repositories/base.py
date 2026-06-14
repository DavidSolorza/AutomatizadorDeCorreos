from typing import Any, Generic, Optional, TypeVar

from pydantic import BaseModel
from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import Select

from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def create(self, schema: CreateSchemaType) -> ModelType:
        instance = self.model(**schema.model_dump())
        self.session.add(instance)
        await self.session.flush()
        return instance

    async def get(self, id: str) -> Optional[ModelType]:
        result = await self.session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict[str, Any]] = None,
        order_by: Optional[str] = None,
        descending: bool = False,
    ) -> tuple[list[ModelType], int]:
        query = select(self.model)
        count_query = select(func.count()).select_from(self.model)

        if filters:
            for field, value in filters.items():
                column = getattr(self.model, field, None)
                if column is not None:
                    query = query.where(column == value)
                    count_query = count_query.where(column == value)

        count_result = await self.session.execute(count_query)
        total = count_result.scalar() or 0

        if order_by:
            column = getattr(self.model, order_by, None)
            if column is not None:
                query = query.order_by(column.desc() if descending else column.asc())

        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def update(self, id: str, schema: UpdateSchemaType) -> Optional[ModelType]:
        instance = await self.get(id)
        if not instance:
            return None
        update_data = schema.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(instance, field, value)
        await self.session.flush()
        return instance

    async def delete(self, id: str) -> bool:
        instance = await self.get(id)
        if not instance:
            return False
        await self.session.delete(instance)
        await self.session.flush()
        return True

    async def delete_many(self, ids: list[str]) -> int:
        result = await self.session.execute(
            sa_delete(self.model).where(self.model.id.in_(ids))
        )
        await self.session.flush()
        return result.rowcount
