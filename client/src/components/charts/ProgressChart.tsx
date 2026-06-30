import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from 'recharts'
import { GlassCard } from '@components/ui/GlassCard'

interface ProgressData {
  name: string
  score: number
  date?: string
}

interface ScoreDistribution {
  range: string
  count: number
}

interface ProgressChartProps {
  data: ProgressData[]
  title?: string
  height?: number
}

const chartTooltipStyle = {
  backgroundColor: '#0F1535',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#cbd5e1',
  boxShadow: '0 8px 32px rgba(0,0,0,0.37)',
}

const chartAxisTick = { fill: 'rgba(255,255,255,0.5)', fontSize: 12 }
const chartGrid = { stroke: 'rgba(255,255,255,0.05)' }

export const ProgressChart = ({ data, title = 'Évolution des scores', height = 300 }: ProgressChartProps) => {
  if (data.length === 0) {
    return (
      <GlassCard className="flex items-center justify-center" style={{ height }}>
        <p className="text-slate-500 text-sm">Aucune donnée disponible</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      {title && (
        <h3 className="text-white font-semibold tracking-tight mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartGrid.stroke}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={chartAxisTick}
            axisLine={false}
            angle={-25}
            textAnchor="end"
            height={60}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={chartAxisTick}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            formatter={(value: any) => [`${value}%`, 'Score']}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#00E5FF"
            fill="url(#scoreGradient)"
            strokeWidth={2}
            dot={{ fill: '#00E5FF', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#00E5FF', stroke: '#0F1535', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}

interface SubjectData {
  subject: string
  score: number
  type: 'quiz' | 'exam'
  color?: string
}

interface SubjectComparisonChartProps {
  quizData: SubjectData[]
  examData: SubjectData[]
  title?: string
  height?: number
}

export const SubjectComparisonChart = ({ quizData, examData, title = 'Comparaison par matière', height = 280 }: SubjectComparisonChartProps) => {
  // Merge and normalize: quiz data uses percent directly, exam uses grade/20 * 100
  const merged: SubjectData[] = [
    ...quizData.map(d => ({ ...d, type: 'quiz' as const })),
    ...examData.map(d => ({ ...d, type: 'exam' as const })),
  ]

  // Take the most recent entry per subject (highest score wins if same)
  const latestBySubject: Record<string, SubjectData> = {}
  for (const d of merged) {
    if (!latestBySubject[d.subject] || d.score > latestBySubject[d.subject].score) {
      latestBySubject[d.subject] = d
    }
  }

  const chartData = Object.values(latestBySubject)
    .sort((a, b) => b.score - a.score)
    .map((d) => ({
      name: d.subject.length > 18 ? d.subject.substring(0, 16) + '...' : d.subject,
      score: Math.round(d.score),
      fill: d.type === 'exam' ? '#7C5CFF' : '#00E5FF',
      type: d.type === 'exam' ? 'Épreuve' : 'Quiz',
    }))

  if (chartData.length === 0) {
    return null
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload
      return (
        <div className="glass-panel p-3 rounded-xl text-xs space-y-1" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white font-medium text-sm">{label}</p>
          <p className="text-slate-400">Score: <span className="text-white font-bold">{entry.score}%</span></p>
          <p className="text-slate-500">Type: {entry.type}</p>
        </div>
      )
    }
    return null
  }

  return (
    <GlassCard>
      <h3 className="text-white font-semibold tracking-tight mb-4">{title}</h3>
      <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#00E5FF' }} />
          Quiz
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#7C5CFF' }} />
          Épreuves
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }} layout="vertical">
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartGrid.stroke}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={chartAxisTick}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
            axisLine={false}
            width={130}
          />
          <Tooltip content={customTooltip} />
          <Bar
            dataKey="score"
            radius={[0, 4, 4, 0]}
            barSize={20}
            maxBarSize={24}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}

export const ScoreDistributionChart = ({ data }: { data: ScoreDistribution[] }) => {
  if (data.length === 0) {
    return (
      <GlassCard className="flex items-center justify-center" style={{ height: 250 }}>
        <p className="text-slate-500 text-sm">Aucune donnée disponible</p>
      </GlassCard>
    )
  }

  return (
    <GlassCard>
      <h3 className="text-white font-semibold tracking-tight mb-4">Distribution des scores</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={chartGrid.stroke}
            vertical={false}
          />
          <XAxis
            dataKey="range"
            tick={chartAxisTick}
            axisLine={false}
          />
          <YAxis
            tick={chartAxisTick}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={chartTooltipStyle}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Bar
            dataKey="count"
            fill="#7C5CFF"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
