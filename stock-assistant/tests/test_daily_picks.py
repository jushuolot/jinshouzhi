import unittest
from unittest.mock import MagicMock

import pandas as pd

from src.analysis.daily_picks import (
    SIGNAL_BUY,
    SIGNAL_WATCH,
    DailyPick,
    rank_candidates_from_ranking,
    picks_to_markdown,
)


class TestDailyPicks(unittest.TestCase):
    def _ranking(self) -> pd.DataFrame:
        return pd.DataFrame(
            [
                {"代码": "600519", "名称": "贵州茅台", "涨跌幅%": 2.5, "类型": "A", "市场": "SH"},
                {"代码": "000001", "名称": "平安银行", "涨跌幅%": 1.2, "类型": "A", "市场": "SZ"},
                {"代码": "600000", "名称": "ST测试", "涨跌幅%": 5.0, "类型": "A", "市场": "SH"},
            ]
        )

    def test_skips_st(self):
        from src.analysis.quick_analyze import WatchSnapshot

        def fake_analyze(item, fetch_fn, days=60):
            return WatchSnapshot(
                code=item["代码"],
                name=item["名称"],
                pct=2.0,
                score=65.0,
                one_line="ok",
            )

        import src.analysis.daily_picks as dp

        orig = dp.analyze_watch_light
        dp.analyze_watch_light = fake_analyze
        try:
            picks, stats = rank_candidates_from_ranking(
                self._ranking(),
                fetch_fn=MagicMock(),
                max_scan=5,
                max_picks=5,
            )
        finally:
            dp.analyze_watch_light = orig

        codes = [p.code for p in picks]
        self.assertNotIn("600000", codes)
        self.assertGreaterEqual(stats.get("skipped_st", 0), 1)

    def test_rank_with_mock_fetch(self):
        scores = {"600519": 72.0, "000001": 58.0}

        def fake_analyze(item, fetch_fn, days=60):
            from src.analysis.quick_analyze import WatchSnapshot

            code = item["代码"]
            sc = scores.get(code, 50.0)
            return WatchSnapshot(
                code=code,
                name=item["名称"],
                pct=2.0,
                score=sc,
                one_line="测试",
                price=100.0,
            )

        import src.analysis.daily_picks as dp

        orig = dp.analyze_watch_light
        dp.analyze_watch_light = fake_analyze
        try:
            picks, _ = rank_candidates_from_ranking(
                self._ranking(),
                fetch_fn=MagicMock(),
                max_scan=5,
                max_picks=5,
            )
        finally:
            dp.analyze_watch_light = orig

        self.assertTrue(picks)
        self.assertEqual(picks[0].signal, SIGNAL_BUY)
        self.assertIn(picks[0].code, ("600519", "000001"))

    def test_markdown(self):
        md = picks_to_markdown(
            [
                DailyPick(
                    code="600519",
                    name="茅台",
                    score=70,
                    pct=2.1,
                    signal=SIGNAL_BUY,
                    hold_days="3-5天",
                    reason="偏强",
                )
            ],
            day="2025-06-08",
        )
        self.assertIn("600519", md)
        self.assertIn("买入", md)


if __name__ == "__main__":
    unittest.main()
