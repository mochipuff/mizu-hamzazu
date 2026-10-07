from mimetypes import guess_type
from pathlib import Path

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import FileResponse, RedirectResponse, Response
from starlette.routing import Route

DIST = Path(__file__).resolve().parent.parent / "dist"

def find_file(url_path: str) -> Path | None:
    target = (DIST / url_path.lstrip("/")).resolve()
    if not target.is_relative_to(DIST):
        return None
    target = target / "index.html" if target.is_dir() else target
    return target if target.is_file() else None


def accepts_gzip(request: Request) -> bool:
    return "gzip" in request.headers.get("accept-encoding", "")


async def serve(request: Request) -> Response:
    path = request.url.path
    file = find_file(path)
    if file is None:
        return Response("Not found", status_code=404)

    if not path.endswith("/") and (DIST / path.lstrip("/")).is_dir():
        return RedirectResponse(f"{path}/", status_code=308)

    gzipped = file.with_name(f"{file.name}.gz")
    if accepts_gzip(request) and gzipped.is_file():
        headers = {"Content-Encoding": "gzip", "Vary": "Accept-Encoding"}
        return FileResponse(gzipped, media_type=guess_type(file.name)[0], headers=headers)

    return FileResponse(file, headers={"Vary": "Accept-Encoding"})


app = Starlette(routes=[Route("/{path:path}", serve)])
