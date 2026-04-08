import uuid

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from .db import upload_to_bucket, update_record
from .renderer import render_yaml_to_pdf

app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok"}


class RenderRequest(BaseModel):
    yaml_content: str
    cv_id: str


@app.post("/render")
async def render(request: RenderRequest):
    try:
        pdf_path = render_yaml_to_pdf(request.yaml_content)

        file_key = f"{uuid.uuid4()}.pdf"

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        await upload_to_bucket("chat_documents", file_key, pdf_bytes)
        await update_record(request.cv_id, {"pdf_url": file_key})

        return {"success": True, "file_key": file_key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
