import IncidentDashboard from '@/components/IncidentDashboard'

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Incident Response Dashboard
        </h2>
        <p className="text-gray-600">
          OpsPilot AI automatically investigates, diagnoses, and remediates AWS incidents
          using Bedrock AI, CloudWatch analytics, and automated execution with guardrails.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🔍 Investigation
          </h3>
          <p className="text-sm text-gray-600">
            Analyzes CloudWatch metrics and logs to identify root causes
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🤖 AI Diagnosis
          </h3>
          <p className="text-sm text-gray-600">
            Uses Bedrock to generate intelligent remediation plans
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ✅ Verification
          </h3>
          <p className="text-sm text-gray-600">
            Validates fixes through test invocations and metric checks
          </p>
        </div>
      </div>

      <IncidentDashboard />

      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Key Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">🔄 Agentic Workflows</h4>
            <p className="text-sm text-gray-600">
              Tool chaining with Bedrock for intelligent decision making
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">🛡️ Safety Guardrails</h4>
            <p className="text-sm text-gray-600">
              Rate limiting, rollback plans, and approval workflows
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">📊 Full Audit Trail</h4>
            <p className="text-sm text-gray-600">
              Complete history of all actions in DynamoDB
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">⚡ Auto-Remediation</h4>
            <p className="text-sm text-gray-600">
              Executes fixes via AWS SDK with verification
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-2">
          🏆 AWS Agentic AI Hackathon
        </h3>
        <p className="text-sm text-blue-800">
          This project demonstrates end-to-end agentic workflows with tool chaining,
          using AWS Bedrock for AI-powered incident response, CloudWatch for observability,
          Lambda for execution, and DynamoDB for audit trails.
        </p>
      </div>
    </div>
  )
}
