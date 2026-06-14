from app.core.config import settings


class SupabaseConfig:
    @staticmethod
    def get_connection_parameters() -> dict:
        return {
            "url": settings.database_url,
            "pool_size": settings.database_pool_size,
            "max_overflow": settings.database_max_overflow,
            "ssl": "require" if settings.is_production else "prefer",
        }
