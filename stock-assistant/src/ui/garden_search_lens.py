"""花园搜索透镜 UI（P121–P123）：搜索置顶 + 体检卡 + 图片识股。"""

from __future__ import annotations

import streamlit as st

from src.analysis.garden_stock_lens import GardenLensCard, build_garden_lens_card
from src.providers import eastmoney, symbol_search
from src.providers.image_ticker_ocr import extract_ticker_candidates, image_to_search_terms
from src.storage.history_store import mark_dirty
from src.ui import app_core as C
from src.util.readonly_mode import is_readonly_mode
from src.util.search_history import normalize_search_history, push_search
from src.util.watchlist_add import add_hit_to_watchlist, is_in_watchlist


def _gemini_key_from_secrets() -> str:
    try:
        v = st.secrets.get("GEMINI_API_KEY") or st.secrets.get("GOOGLE_API_KEY")
        return str(v or "").strip()
    except Exception:
        return ""


def _resolve_hit(keyword: str) -> eastmoney.SearchHit | None:
    kw = (keyword or "").strip()
    if not kw:
        return None
    hits = symbol_search.suggest(kw, limit=12)
    if not hits:
        return None
    kw_u = kw.upper()
    for h in hits:
        if h.code.upper() == kw_u or (h.yahoo or "").upper() == kw_u:
            return h
        if kw in (h.name or ""):
            return h
    return hits[0]


def _render_lens_card(card: GardenLensCard, hit: eastmoney.SearchHit, *, readonly: bool) -> None:
    pct_s = f"{card.pct:+.2f}%" if card.pct is not None else "—"
    score_s = f"{card.score:.0f}" if card.score is not None else "—"
    price_s = f"{card.price:.2f}" if card.price is not None else "—"

    st.markdown(f"#### {card.name} `{card.code}` · {card.market}")
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("现价", price_s)
    c2.metric("今日涨跌", pct_s)
    c3.metric("技术评分", score_s)
    c4.metric("机构持股", card.fund_tags[:12] if card.fund_tags else "—")

    st.caption(f"**一句话：** {card.one_line}")
    st.caption(f"**推荐记忆：** {card.pick_history} · {card.hit_rate_label}")
    if card.cohort_note:
        st.caption(card.cohort_note)
    if card.google_note:
        if card.google_url:
            st.caption(f"**对照：** {card.google_note} · [Google 财经]({card.google_url})")
        else:
            st.caption(f"**对照：** {card.google_note}")

    wl = list(st.session_state.get("watchlist") or [])
    code = str(card.code)
    if not readonly:
        b1, b2 = st.columns(2)
        with b1:
            if not is_in_watchlist(wl, code) and st.button(
                "➕ 加入自选", key=f"garden_lens_add_{code}", use_container_width=True
            ):
                wl, added = add_hit_to_watchlist(wl, hit)
                if added:
                    st.session_state.watchlist = wl
                    mark_dirty()
                    st.success("已加入自选")
                else:
                    st.info("已在自选")
        with b2:
            if st.button("🔬 进专家模式分析", key=f"garden_lens_pro_{code}", use_container_width=True):
                st.session_state.ui_mode = "pro"
                st.session_state.active_tab = "watch"
                st.query_params["tab"] = "watch"
                st.rerun()


def render_garden_search_lens(pick_log: list, *, fetch_fn) -> None:
    """花园第一屏：搜索 + 可选图片识股 → 简化体检卡。"""
    st.markdown("### 🔍 搜一只，看体检卡")
    st.caption("输入名称/代码，或点搜索栏旁 📷 上传截图；展开下方可看今晚明日推荐。")
    st.markdown(
        """
        <style>
        div[data-testid="column"]:has(div[data-testid="stFileUploader"]) div[data-testid="stFileUploader"] section {
            padding: 0.35rem 0.5rem; min-height: 0;
        }
        div[data-testid="column"]:has(div[data-testid="stFileUploader"]) div[data-testid="stFileUploader"] button {
            padding: 0.45rem 0.65rem; font-size: 1.1rem;
        }
        div[data-testid="column"]:has(div[data-testid="stFileUploader"]) div[data-testid="stFileUploader"] small {
            display: none;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

    st.session_state.setdefault("garden_lens_kw", "茅台")
    history = normalize_search_history(st.session_state.get("search_history"))
    if history:
        chips = st.columns(min(len(history), 6))
        for i, term in enumerate(history[:6]):
            with chips[i % len(chips)]:
                if st.button(term, key=f"garden_lens_hist_{i}", use_container_width=True):
                    st.session_state.garden_lens_kw = term
                    st.session_state._garden_lens_pending_kw = term

    col_t, col_img, col_b = st.columns([5, 1, 1])
    with col_t:
        kw = st.text_input(
            "股票",
            key="garden_lens_kw",
            placeholder="茅台、600519、AAPL、0700…",
            label_visibility="collapsed",
        )
    with col_img:
        uploaded = st.file_uploader(
            "📷",
            type=["png", "jpg", "jpeg", "webp"],
            key="garden_lens_image",
            label_visibility="collapsed",
            help="上传 K 线截图识股（需配置 GEMINI_API_KEY）",
        )
    with col_b:
        do_search = st.button("搜索", type="primary", use_container_width=True, key="garden_lens_search")

    pending = st.session_state.pop("_garden_lens_pending_kw", None)
    if pending:
        kw = pending
        do_search = True

    if uploaded is not None:
        sig = f"{uploaded.name}:{uploaded.size}"
        if st.session_state.get("_garden_lens_img_sig") != sig:
            st.session_state._garden_lens_img_sig = sig
            raw = uploaded.getvalue()
            mime = str(uploaded.type or "image/png")
            api_key = _gemini_key_from_secrets()
            with st.spinner("识图中…"):
                candidates, ocr_text = image_to_search_terms(raw, gemini_api_key=api_key, mime=mime)
            if not api_key:
                st.caption("识图需配置 **GEMINI_API_KEY**；也可直接在左侧输入代码搜索。")
            elif ocr_text:
                st.caption(f"识图：{ocr_text[:80]}")
            if candidates:
                st.session_state.garden_lens_kw = candidates[0]
                st.session_state._garden_lens_pending_kw = candidates[0]
                st.rerun()
            elif api_key:
                st.warning("未能识别代码，请换截图或手动输入。")

    readonly = is_readonly_mode()
    if do_search and kw.strip():
        with st.spinner("拉取行情、机构持股与对照价…"):
            hit = _resolve_hit(kw)
            if not hit:
                st.warning("未找到匹配标的，请换关键词。")
            else:
                st.session_state.garden_lens_hit = {
                    "code": hit.code,
                    "name": hit.name,
                    "market": hit.market,
                    "kind": hit.kind,
                    "yahoo": hit.yahoo,
                }
                card = build_garden_lens_card(hit, fetch_fn, pick_log)
                st.session_state.garden_lens_card = card.as_dict()
                st.session_state.search_history = push_search(
                    st.session_state.get("search_history"), kw.strip()
                )
                mark_dirty()

    cached = st.session_state.get("garden_lens_card")
    hit_d = st.session_state.get("garden_lens_hit")
    if cached and hit_d:
        hit = eastmoney.SearchHit(
            code=str(hit_d.get("code") or ""),
            name=str(hit_d.get("name") or ""),
            market=str(hit_d.get("market") or ""),
            kind=str(hit_d.get("kind") or "A"),
            yahoo=str(hit_d.get("yahoo") or "") or None,
        )
        card = GardenLensCard(
            code=str(cached.get("code") or ""),
            name=str(cached.get("name") or ""),
            market=str(cached.get("market") or ""),
            price=cached.get("price"),
            pct=cached.get("pct"),
            score=cached.get("score"),
            one_line=str(cached.get("one_line") or ""),
            fund_tags=str(cached.get("fund_tags") or ""),
            pick_history=str(cached.get("pick_history") or ""),
            hit_rate_label=str(cached.get("hit_rate_label") or ""),
            google_note=str(cached.get("google_note") or ""),
            google_url=str(cached.get("google_url") or ""),
            cohort_note=str(cached.get("cohort_note") or ""),
        )
        st.divider()
        _render_lens_card(card, hit, readonly=readonly)
