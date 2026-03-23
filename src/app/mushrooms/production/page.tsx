import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MushroomProductionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/mushrooms" className="hover:text-gray-700">Mushrooms</Link>
            <span>›</span><span>Production Costing</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">🍄 Production Costing</h1>
          <p className="text-gray-500 text-sm mt-0.5">Facility costs, labour rates, and overhead allocation</p>
        </div>
        <Link href="/mushrooms" className="text-sm text-orange-600 hover:underline font-medium">
          ← Back to Batches
        </Link>
      </div>

      {/* Production cost factors */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <h2 className="font-bold text-gray-900 text-lg">🏭 Production Cost Factors</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Labour Rate</p>
            <p className="text-2xl font-bold text-gray-900">R45<span className="text-sm font-normal text-gray-500">/hour</span></p>
            <p className="text-xs text-gray-400 mt-1">Standard Cape Town rate</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Electricity</p>
            <p className="text-2xl font-bold text-gray-900">R2.50<span className="text-sm font-normal text-gray-500">/kWh</span></p>
            <p className="text-xs text-gray-400 mt-1">Cape Town municipal rate</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Overhead</p>
            <p className="text-2xl font-bold text-gray-900">5<span className="text-sm font-normal text-gray-500">% of materials</span></p>
            <p className="text-xs text-gray-400 mt-1">Facility, admin, misc</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">Loss Rate</p>
            <p className="text-2xl font-bold text-gray-900">10<span className="text-sm font-normal text-gray-500">%</span></p>
            <p className="text-xs text-gray-400 mt-1">Contamination, spoilage (target: 5%)</p>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-bold text-gray-900 text-sm mb-3">📊 Cost Breakdown per Batch (10 bags)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Substrate (20 kg × R16.95)</span>
                <span className="font-medium">R339.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Spawn (1 kg × R110)</span>
                <span className="font-medium">R110.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Grow bags (10 × R10)</span>
                <span className="font-medium">R100.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Labour (2 hrs × R45)</span>
                <span className="font-medium">R90.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overhead (5% of R549)</span>
                <span className="font-medium">R27.45</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total Cost</span>
                <span className="text-orange-600">R666.45</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expected yield (R1)</span>
                <span className="font-medium text-green-600">5.0 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Expected yield (R2)</span>
                <span className="font-medium text-green-600">3.0 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total yield (40% BE)</span>
                <span className="font-bold text-gray-900">8.0 kg</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2">
                <span className="text-gray-900">Cost per kg harvested</span>
                <span className="text-orange-600">R83.31</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yield assumptions */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
        <h3 className="font-bold text-amber-800 text-sm mb-2">🎯 Yield Assumptions</h3>
        <ul className="text-xs text-amber-700 space-y-1">
          <li><strong>Biological Efficiency:</strong> 40% total (25% Round 1 + 60% of R1 for Round 2)</li>
          <li><strong>Substrate:</strong> 2 kg per bag, 5% spawn inoculation rate</li>
          <li><strong>Cycle time:</strong> 35–50 days (inoculation → second flush complete)</li>
          <li><strong>Experienced target:</strong> 5% loss rate, 45–50% BE achievable</li>
        </ul>
      </div>

      {/* Labour breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 text-lg mb-4">⏱️ Labour Hours per Batch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Inoculation</p>
            <p className="text-sm text-gray-700">0.5 hrs/batch</p>
            <p className="text-xs text-gray-400">Sterilize, cool, inoculate bags</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Incubation Monitoring</p>
            <p className="text-sm text-gray-700">0.25 hrs/batch</p>
            <p className="text-xs text-gray-400">Check temps, humidity, contamination</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Harvesting</p>
            <p className="text-sm text-gray-700">1.25 hrs/batch</p>
            <p className="text-xs text-gray-400">Two flushes, weigh, pack, log</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Total Labour</span>
            <span className="text-gray-900 font-bold">~2 hours per 10-bag batch</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href="/mushrooms/costing" className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-medium text-sm text-center hover:bg-gray-50 transition-colors">
          View Batch Costings
        </Link>
        <Link href="/mushrooms/prices" className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-xl font-medium text-sm text-center hover:shadow-lg transition-all">
          View Price List
        </Link>
      </div>
    </div>
  )
}