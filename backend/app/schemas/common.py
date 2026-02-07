from enum import Enum
from typing import Literal


class Direction(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class ContractStatus(str, Enum):
    OPEN = "OPEN"
    EXECUTED = "EXECUTED"
    CLOSED = "CLOSED"
    CANCELLED = "CANCELLED"


class ShipmentStatus(str, Enum):
    PLANNED = "PLANNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class AssayType(str, Enum):
    PROVISIONAL = "PROVISIONAL"
    FINAL = "FINAL"


class QPConvention(str, Enum):
    MONTH_OF_BL = "MONTH_OF_BL"
    MONTH_PRIOR_BL = "MONTH_PRIOR_BL"
    MONTH_AFTER_BL = "MONTH_AFTER_BL"
    CUSTOM = "CUSTOM"


DirectionLiteral = Literal["BUY", "SELL"]
