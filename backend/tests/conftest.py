import os
import tempfile

import pytest

_tmp = tempfile.mkdtemp(prefix="firstshift-test-")
os.environ["FS_DB"] = os.path.join(_tmp, "test.db")
os.environ["FS_CACHE_DIR"] = os.path.join(_tmp, "cache")
os.environ["FS_MODE"] = "mock"


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient

    from backend.app import app
    from backend.seed import seed

    with TestClient(app) as c:
        seed()
        yield c
