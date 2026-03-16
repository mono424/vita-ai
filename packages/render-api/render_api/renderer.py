import subprocess
import tempfile
from pathlib import Path


def render_yaml_to_pdf(yaml_content: str) -> str:
    """Write YAML to temp file, run rendercv render, return PDF path."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yaml_path = Path(tmpdir) / "cv.yaml"
        yaml_path.write_text(yaml_content)

        result = subprocess.run(
            ["rendercv", "render", str(yaml_path)],
            capture_output=True,
            text=True,
            cwd=tmpdir,
            timeout=60,
        )

        if result.returncode != 0:
            raise RuntimeError(f"rendercv failed: {result.stderr}")

        # rendercv outputs to rendercv_output/ directory
        output_dir = Path(tmpdir) / "rendercv_output"
        pdf_files = list(output_dir.glob("*.pdf"))

        if not pdf_files:
            raise RuntimeError(
                f"No PDF generated. stdout: {result.stdout}, stderr: {result.stderr}"
            )

        # Copy to a persistent temp file (TemporaryDirectory would delete it)
        import shutil

        persistent_pdf = tempfile.NamedTemporaryFile(
            suffix=".pdf", delete=False
        )
        shutil.copy2(pdf_files[0], persistent_pdf.name)
        return persistent_pdf.name
