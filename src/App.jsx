import { useState } from 'react'
import Header from './components/Header.jsx'
import TabContent from './components/TabContent.jsx'
import './styles/app.css'

// 탭 메뉴 설정 — 여기서 탭 추가/수정
const TABS = [
  { id: 'home',     label: '홈' },
  { id: 'about',    label: '소개' },
  { id: 'service',  label: '서비스' },
  { id: 'contact',  label: '문의' },
]

function App() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)

  return (
    <div className="app">
      <Header
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="main-content">
        <TabContent activeTab={activeTab} />
      </main>
    </div>
  )
}

export default App
