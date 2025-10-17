'use client'

import { useState } from 'react'

interface Incident {
  id: string
  timestamp: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  resourceArn: string
  description: string
  status: 'open' | 'investigating' | 'remediating' | 'resolved' | 'failed'
}

export default function IncidentDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'demo-incident-1',
      timestamp: new Date().toISOString(),
      severity: 'high',
      resourceArn: 'arn:aws:lambda:us-east-1:123456789:function:my-function',
      description: 'Lambda function timeout errors increasing',
      status: 'resolved'
    },
    {
      id: 'demo-incident-2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      severity: 'critical',
      resourceArn: 'arn:aws:lambda:us-east-1:123456789:function:api-handler',
      description: 'High error rate detected in API handler',
      status: 'investigating'
    }
  ])

  const [showForm, setShowForm] = useState(false)
  const [newIncident, setNewIncident] = useState({
    severity: 'medium' as const,
    resourceArn: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const incident: Incident = {
      id: `incident-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...newIncident,
      status: 'open'
    }
    
    setIncidents([incident, ...incidents])
    setNewIncident({ severity: 'medium', resourceArn: '', description: '' })
    setShowForm(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'badge-critical'
      case 'high': return 'badge-high'
      case 'medium': return 'badge-medium'
      case 'low': return 'badge-low'
      default: return 'badge-info'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'badge-success'
      case 'failed': return 'badge-critical'
      case 'investigating': return 'badge-info'
      case 'remediating': return 'badge-medium'
      default: return 'badge-info'
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Active Incidents</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : 'Report Incident'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={newIncident.severity}
                onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource ARN
              </label>
              <input
                type="text"
                value={newIncident.resourceArn}
                onChange={(e) => setNewIncident({ ...newIncident, resourceArn: e.target.value })}
                placeholder="arn:aws:lambda:us-east-1:123456789:function:my-function"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newIncident.description}
                onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                placeholder="Describe the incident..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Submit Incident
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {incidents.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No incidents reported</p>
        ) : (
          incidents.map((incident) => (
            <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`badge ${getSeverityColor(incident.severity)}`}>
                      {incident.severity.toUpperCase()}
                    </span>
                    <span className={`badge ${getStatusColor(incident.status)}`}>
                      {incident.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{incident.description}</h3>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(incident.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-mono mt-2">
                {incident.resourceArn}
              </p>
              <div className="mt-3 flex space-x-2">
                <button className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition">
                  View Details
                </button>
                <button className="text-xs px-3 py-1 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition">
                  Audit Trail
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
