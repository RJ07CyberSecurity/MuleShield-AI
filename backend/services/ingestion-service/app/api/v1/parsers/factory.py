from .base import BaseStatementParser
from .csv_excel import CSVExcelParser
from .pdf_parser import PDFParser
from .docx_parser import DOCXParser

class StatementParserFactory:
    @staticmethod
    def get_parser(filename: str, file_bytes: bytes) -> BaseStatementParser:
        """
        Returns the appropriate parser based on file extension and format detection.
        In the future, this can be extended to sniff file contents and return 
        bank-specific parsers (e.g., HDFCParser, SBIParser).
        """
        filename = filename.lower()
        if filename.endswith(".csv"):
            return CSVExcelParser(is_excel=False)
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            return CSVExcelParser(is_excel=True)
        elif filename.endswith(".pdf"):
            return PDFParser()
        elif filename.endswith(".docx") or filename.endswith(".doc"):
            return DOCXParser()
        else:
            raise ValueError("Unsupported statement format. Upload only CSV, XLSX, PDF, or DOCX format Statements.")
