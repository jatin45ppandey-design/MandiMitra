import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { App } from './App'

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })))
const ComparePage = lazy(() => import('./pages/ComparePage').then((module) => ({ default: module.ComparePage })))
const AlertsPage = lazy(() => import('./pages/AlertsPage').then((module) => ({ default: module.AlertsPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })))

function page(element: React.ReactNode) {
  return <Suspense fallback={<div className="min-h-72 animate-pulse rounded-3xl bg-sage-100" aria-label="Loading page" />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: page(<HomePage />) },
      { path: 'compare', element: page(<ComparePage />) },
      { path: 'alerts', element: page(<AlertsPage />) },
      { path: 'profile', element: page(<ProfilePage />) },
      { path: '*', element: page(<NotFoundPage />) },
    ],
  },
])

