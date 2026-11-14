"""Base model for MongoDB documents with attribute-access and Pydantic compatibility."""
import uuid
from datetime import datetime, timezone
from typing import Any, Dict


class MongoModel(dict):
    """
    Dictionary-like document model that supports:
    - Dot attribute access (model.field)
    - Dictionary key access (model["field"])
    - Pydantic from_attributes validation
    - Automatic UUID string generation for 'id'
    - Automatic created_at/updated_at handling
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if "id" not in self or not self.get("id"):
            if "_id" in self and self.get("_id"):
                self["id"] = str(self["_id"])
            else:
                self["id"] = str(uuid.uuid4())
        elif isinstance(self["id"], uuid.UUID):
            self["id"] = str(self["id"])

        if "created_at" not in self or self.get("created_at") is None:
            self["created_at"] = datetime.now(timezone.utc)
        if "updated_at" not in self or self.get("updated_at") is None:
            self["updated_at"] = datetime.now(timezone.utc)

    def __getattr__(self, name: str) -> Any:
        try:
            return self[name]
        except KeyError:
            return None

    def __setattr__(self, name: str, value: Any) -> None:
        self[name] = value

    def __delattr__(self, name: str) -> None:
        if name in self:
            del self[name]

    def to_mongo(self) -> Dict[str, Any]:
        """Return a clean dictionary representation for MongoDB insertion."""
        d = dict(self)
        if "_id" in d and not d.get("_id"):
            del d["_id"]
        return d
