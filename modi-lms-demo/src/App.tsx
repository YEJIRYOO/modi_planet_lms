import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell, RequireAuth } from './components/AppShell';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CourseListPage from './pages/CourseListPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LearningPage from './pages/LearningPage';
import MyPage from './pages/MyPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 게이트 (레일 밖) */}
        <Route path="/login" element={<LoginPage />} />

        {/* 브라우징 페이지: 로그인 가드 + 레일 셸 */}
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CourseListPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>

        {/* 학습화면: 로그인 가드만(풀스크린, 레일 없음) */}
        <Route element={<RequireAuth />}>
          <Route path="/learning/:id" element={<LearningPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
