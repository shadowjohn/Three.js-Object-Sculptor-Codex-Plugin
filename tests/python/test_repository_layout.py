from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]


class RepositoryLayoutTest(unittest.TestCase):
    def test_runtime_directories_exist(self):
        self.assertTrue((ROOT / "runtime").is_dir())
        self.assertTrue((ROOT / "generators").is_dir())
        self.assertTrue((ROOT / "schemas").is_dir())
