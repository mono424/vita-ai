import base64
import json
import os

import httpx

SURREAL_URL = os.environ.get("SURREAL_URL", "http://localhost:8666")
SURREAL_USER = os.environ.get("SURREAL_USER", "root")
SURREAL_PASS = os.environ.get("SURREAL_PASS", "root")
SURREAL_NS = os.environ.get("SURREAL_NS", "vitaai")
SURREAL_DB = os.environ.get("SURREAL_DB", "main")


def _headers() -> dict[str, str]:
    return {
        "surreal-ns": SURREAL_NS,
        "surreal-db": SURREAL_DB,
        "Accept": "application/json",
        "Content-Type": "text/plain",
    }


def _auth() -> tuple[str, str]:
    return (SURREAL_USER, SURREAL_PASS)


async def _query(sql: str) -> None:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SURREAL_URL}/sql",
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
