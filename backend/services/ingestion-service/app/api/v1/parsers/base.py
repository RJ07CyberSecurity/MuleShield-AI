from abc import ABC, abstractmethod

class BaseStatementParser(ABC):
    """
    Abstract base class for all bank statement parsers.
    """
    
    @abstractmethod
    def parse(self, file_bytes: bytes) -> tuple[list[dict], list[dict]]:
        """
        Parses the statement file bytes and returns a tuple of (valid_rows, invalid_rows).
        Each valid row is a dict containing the required fields.
        """
        pass
