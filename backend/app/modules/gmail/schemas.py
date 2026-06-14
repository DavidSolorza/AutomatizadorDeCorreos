from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class AccountCreate(BaseModel):
    email: EmailStr
    provider: str = "gmail"


class AccountResponse(BaseModel):
    id: str
    user_id: str
    email: str
    provider: str
    is_connected: bool
    gmail_user_id: Optional[str] = None
    last_sync_at: Optional[datetime] = None
    synced_on_connect: Optional[int] = None

    model_config = {"from_attributes": True}
