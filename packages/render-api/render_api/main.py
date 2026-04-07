from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .renderer import render_yaml_to_pdf

app = FastAPI()


@app.get("/health")
async def health():
    return {"status": "ok"}


class RenderRequest(BaseModel):
    yaml_content: str


@app.post("/render")
async def render(request: RenderRequest):
    try:
        pdf_path = render_yaml_to_pdf(request.yaml_content)
        return FileResponse(
            pdf_path,
            media_type="application/pdf",
            filename="cv.pdf",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
