import unittest
from unittest.mock import patch

from src.analysis.stock_quality import evaluate_stock_quality
from src.providers.eastmoney_shareholder import ShareholderSnapshot


class TestStockQuality(unittest.TestCase):
    def test_reject_locked_top1(self):
        sh = ShareholderSnapshot(
            code="301418",
            holder_count=8000,
            hold_focus="非常集中",
            top1_name="测试",
            top1_ratio=35.0,
            top1_locked=True,
            top3_ratio=60.0,
            free_top_ratio=17.0,
            holder_chg_pct=3.0,
        )
        v = evaluate_stock_quality("301418", shareholder=sh, fetch_shareholder=False, fetch_f10=False)
        self.assertFalse(v.ok)
        self.assertIn("限售", v.reject_reason)

    def test_main_board_bonus(self):
        sh = ShareholderSnapshot(
            code="600519",
            holder_count=200000,
            hold_focus="非常分散",
            top1_name="集团",
            top1_ratio=54.0,
            top1_locked=False,
            top3_ratio=70.0,
            free_top_ratio=68.0,
            holder_chg_pct=-2.0,
        )
        v = evaluate_stock_quality("600519", shareholder=sh, fetch_shareholder=False, fetch_f10=False)
        self.assertTrue(v.ok)
        self.assertGreater(v.score_delta, 0)


if __name__ == "__main__":
    unittest.main()
