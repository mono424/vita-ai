import base64
import json
import os

import httpx

SPKY_DB_URL = os.environ.get("SPKY_DB_URL", "http://localhost:8666")
SPKY_DB_USER = os.environ.get("SPKY_DB_USER", "root")
SPKY_DB_PASS = os.environ.get("SPKY_DB_PASS", "root")
SPKY_DB_NS = os.environ.get("SPKY_DB_NS", "vitaai")
SPKY_DB_NAME = os.environ.get("SPKY_DB_NAME", "main")


def _headers() -> dict[str, str]:
    return {
        "surreal-ns": SPKY_DB_NS,
        "surreal-db": SPKY_DB_NAME,
        "Accept": "application/json",
        "Content-Type": "text/plain",
    }


def _auth() -> tuple[str, str]:
    return (SPKY_DB_USER, SPKY_DB_PASS)


async def _query(sql: str) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SPKY_DB_URL}/sql",
            content=sql,
            headers=_headers(),
            auth=_auth(),
            timeout=30,
        )
        resp.raise_for_status()


async def upload_to_bucket(bucket: str, file_key: str, data: bytes) -> None:
    """Upload a file to a SurrealDB bucket via SurrealQL."""
    b64 = base64.b64encode(data).decode("ascii")
    await _query(
        f'f"{bucket}:/{file_key}".put(encoding::base64::decode("{b64}"));'
    )


async def update_record(record_id: str, data: dict) -> None:
    """Merge-update a SurrealDB record via SurrealQL."""
    await _query(f"UPDATE {record_id} MERGE {json.dumps(data)};")
