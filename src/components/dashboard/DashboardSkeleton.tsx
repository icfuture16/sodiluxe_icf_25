'use client'

import React from 'react'

export default function DashboardSkeleton() {
  return (
    <div className="dashboard-fade-in">
      {/* En-tête */}
      <div className="dashboard-header">
        <div className="dashboard-skeleton h-8 w-64 rounded-md"></div>
        <div className="dashboard-header-actions">
          <div className="dashboard-skeleton h-10 w-24 rounded-md"></div>
          <div className="dashboard-skeleton h-10 w-48 rounded-md"></div>
        </div>
      </div>
      
      {/* KPIs principaux */}
      <div className="dashboard-grid">
        {[...Array(6)].map((_, i) => (
          <div key={`kpi-${i}`} className="dashboard-card">
            <div className="flex items-center justify-between mb-2">
              <div className="dashboard-skeleton h-5 w-24 rounded-md"></div>
              <div className="dashboard-skeleton h-8 w-8 rounded-full"></div>
            </div>
            <div className="dashboard-skeleton h-8 w-32 rounded-md mt-2"></div>
            <div className="dashboard-skeleton h-4 w-20 rounded-md mt-2"></div>
          </div>
        ))}
      </div>
      
      {/* Graphiques principaux */}
      <div className="dashboard-grid dashboard-grid-primary">
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-skeleton h-6 w-48 rounded-md"></div>
          </div>
          <div className="dashboard-chart-container">
            <div className="h-full w-full dashboard-skeleton rounded-xl"></div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <div className="dashboard-skeleton h-6 w-48 rounded-md"></div>
          </div>
          <div className="dashboard-chart-container">
            <div className="h-full w-full dashboard-skeleton rounded-xl"></div>
          </div>
        </div>
      </div>
      
      {/* Graphiques secondaires et alertes */}
      <div className="dashboard-secondary-grid">
        {[...Array(3)].map((_, i) => (
          <div key={`secondary-${i}`} className="dashboard-card">
            <div className="dashboard-card-header">
              <div className="dashboard-skeleton h-6 w-36 rounded-md"></div>
            </div>
            <div className="dashboard-chart-container">
              <div className="h-full w-full dashboard-skeleton rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}