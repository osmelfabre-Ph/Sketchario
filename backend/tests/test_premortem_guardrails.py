import importlib.util
import sys
import uuid
from pathlib import Path

import pytest


SERVER_PATH = Path(__file__).resolve().parents[1] / "server.py"


def load_server_module(monkeypatch, tmp_path):
    monkeypatch.setenv("MONGO_URL", "mongodb://localhost:27017")
    monkeypatch.setenv("DB_NAME", "sketchario_test")
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    monkeypatch.setenv("UPLOADS_DIR", str(tmp_path / "uploads"))
    module_name = f"sketchario_server_{uuid.uuid4().hex}"
    spec = importlib.util.spec_from_file_location(module_name, SERVER_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_collect_cors_origins_rejects_wildcards(monkeypatch, tmp_path):
    server = load_server_module(monkeypatch, tmp_path)
    monkeypatch.setenv("FRONTEND_URL", "https://app.sketchario.app,https://*.evil.example")
    with pytest.raises(RuntimeError):
        server._collect_cors_origins()


def test_frontend_base_prefers_app_url(monkeypatch, tmp_path):
    monkeypatch.setenv("APP_URL", "https://app.sketchario.app")
    monkeypatch.setenv("FRONTEND_URL", "https://www.sketchario.app")
    server = load_server_module(monkeypatch, tmp_path)
    assert server._frontend_base() == "https://app.sketchario.app"
