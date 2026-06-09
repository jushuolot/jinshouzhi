import unittest
from unittest.mock import MagicMock

import pandas as pd

from src.storage.cloud_pick_log import (
    load_cloud_pick_log,
    pct_map_from_ranking,
    save_cloud_pick_log,
    sync_cloud_pick_log,
)


class TestCloudPickLog(unittest.TestCase):
    def test_append_and_summary(self):
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "cloud_pick_log.json"
            ranking = pd.DataFrame(
                [{"代码": "600519", "名称": "茅台", "涨跌幅%": 3.0}]
            )

            def fetch_ranking():
                return ranking, "test"

            picks = [
                {
                    "code": "600519",
                    "name": "茅台",
                    "signal": "明日偏多",
                    "score": 80,
                    "pct": 1.0,
                    "hold_days": "1",
                    "reason": "[趋势延续] test",
                    "pattern": "趋势延续",
                }
            ]
            meta = sync_cloud_pick_log(
                picks,
                pick_day="2020-01-01",
                fetch_ranking=fetch_ranking,
                path=path,
            )
            self.assertEqual(len(meta["log"]), 1)
            self.assertIn("hit_summary", meta)
            loaded = load_cloud_pick_log(path=path)
            self.assertEqual(len(loaded), 1)
            save_cloud_pick_log(loaded, path=path)
            self.assertTrue(path.is_file())

    def test_pct_map(self):
        df = pd.DataFrame([{"代码": "000001", "涨跌幅%": 2.5}])
        m = pct_map_from_ranking(df)
        self.assertEqual(m["000001"], 2.5)


if __name__ == "__main__":
    unittest.main()
