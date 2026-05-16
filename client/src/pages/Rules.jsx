import { Link } from 'react-router-dom';
import TopNav from '../components/TopNav';

export default function Rules() {
  return (
    <div className="page">
      <header className="header">
        <h1>平台规则</h1>
        <p>金手指 · 演示版 MVP</p>
      </header>
      <TopNav />

      <div className="card">
        <h3>一、产品定位</h3>
        <p>成熟男士（40 周岁以上）邀请制社区；高等教育在读女士经认证后免费使用；交流由系统分配，女士信息不对外公开。</p>
      </div>

      <div className="card">
        <h3>二、男士用户</h3>
        <ul className="rules-list">
          <li>须年满 <strong>40 周岁</strong>（以实名认证为准）</li>
          <li>须使用有效 <strong>邀请码</strong> 完成绑定后方可开户</li>
          <li>须缴纳 <strong>人民币 10,000 元</strong> 文明互动保证金（本演示为模拟支付）</li>
          <li>开户后获得专属邀请码（<strong>一人一码</strong>），仅用于邀请符合条件用户</li>
          <li>开户后 <strong>无需再邀请他人</strong> 即可正常使用</li>
          <li>系统分配：每日最多 <strong>3 次</strong>（自然日重置）</li>
        </ul>
      </div>

      <div className="card">
        <h3>三、女士用户</h3>
        <ul className="rules-list">
          <li>须年满 18 周岁，且为 <strong>高等教育机构在读</strong> 学生（演示环境验证码：MOCK_OK）</li>
          <li><strong>免费注册</strong>，无需缴纳保证金</li>
          <li>可开启/关闭「暂停接收新的系统分配」</li>
          <li>学校、真实姓名等 <strong>不会向对方展示</strong></li>
        </ul>
      </div>

      <div className="card">
        <h3>四、保证金与扣罚</h3>
        <ul className="rules-list">
          <li>保证金用于约束骚扰、威胁、诈骗引流等违规行为</li>
          <li>违规可从保证金中扣罚；<strong>不设单次扣罚上限</strong>，以当前余额为限</li>
          <li>每次扣罚将告知依据，可在期限内申诉</li>
        </ul>
      </div>

      <div className="card">
        <h3>五、退还保证金</h3>
        <ul className="rules-list">
          <li>开户成功满 <strong>30 个自然日</strong> 起，在符合条件时可申请退还剩余保证金</li>
          <li>审核通过后 <strong>7 个工作日内</strong> 原路退回（演示环境为模拟流程）</li>
          <li>存在未结工单、永久封禁、余额为 0 等情形不可申请</li>
        </ul>
      </div>

      <div className="card">
        <h3>六、隐私与安全</h3>
        <ul className="rules-list">
          <li>不提供女士公开列表或搜索</li>
          <li>请勿向他人透露住址、银行卡等敏感信息</li>
          <li>本系统为 <strong>演示 MVP</strong>，不得对外收取真实大额费用</li>
        </ul>
      </div>

      <Link to="/" className="btn btn-secondary">
        返回首页
      </Link>
    </div>
  );
}
