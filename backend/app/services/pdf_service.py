from __future__ import annotations

import logging
import re
from typing import Iterable

logger = logging.getLogger(__name__)

try:
    import weasyprint
    _WEASYPRINT_AVAILABLE = True
except ImportError:
    _WEASYPRINT_AVAILABLE = False
    logger.warning("weasyprint not installed; PDF output will be degraded.")


def render_html_to_pdf(html: str) -> bytes:
    if not _WEASYPRINT_AVAILABLE:
        return _fallback_pdf(html)
    return weasyprint.HTML(string=html).write_pdf()


def _fallback_pdf(html: str) -> bytes:
    text = re.sub(r'<[^>]+>', ' ', html).strip()[:2000]
    lines = [line.strip() for line in text.split('\n') if line.strip()][:40]
    return build_simple_pdf("Document", lines)


def build_simple_pdf(title: str, lines: Iterable[str]) -> bytes:
    def _esc(v: str) -> str:
        return v.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    content_lines = ["BT", "/F1 18 Tf", "50 790 Td", f"({_esc(title)}) Tj", "/F1 10 Tf"]
    remaining = 760
    for line in list(lines)[:48]:
        content_lines += [f"50 {remaining} Td", f"({_esc(line)}) Tj"]
        remaining -= 14
    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("latin-1", errors="replace")
    objects = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        b"5 0 obj << /Length %d >> stream\n%s\nendstream endobj" % (len(stream), stream),
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets: list[int] = []
    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj + b"\n")
    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_start}\n%%EOF".encode())
    return bytes(pdf)
