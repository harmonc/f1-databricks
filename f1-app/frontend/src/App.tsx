import { useState, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import './App.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface ApiResponse {
  message: string
}

interface DataPoint {
  x: number
  y: number
}

interface ChartData {
  data: DataPoint[]
  title: string
  x_title: string
  y_title: string
}

interface YearData {
  years: number[]
}

interface RaceOption{
  name: string
  id: number
}

interface RaceData{
  races: RaceOption[]
}

function App() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [yearData, setYearData] = useState<YearData | null>(null)
  const [raceData, setRaceData] = useState<RaceData | null>(null)
  const [selectedYear, setSelectedYear] = useState<string | null>(2000)
  const [selectedRace, setSelectedRace] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  function onYearChange(year: string) {
    console.log("year changed:", year)
    setSelectedYear(year)
  }
  function onRaceChange(raceId: string) {
      console.log("race changed:", raceId)
      setSelectedRace(raceId)
  }
  useEffect(() => {
    if (!selectedYear) return  // don't run on initial page load

    setLoading(true)

    fetch(`/api/races/?year=${selectedYear}`)
      .then(res => res.json())
      .then((data) => {
        setRaceData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Race fetch error:", err)
        setLoading(false)
      })
  }, [selectedYear])
  useEffect(() => {
    if (!selectedYear) return  // don't run on initial page load

    setLoading(true)

    fetch(`/api/data/?race_id=${selectedRace}`)
      .then(res => res.json())
      .then((data) => {
        setChartData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Race fetch error:", err)
        setLoading(false)
      })
  }, [selectedRace])
  useEffect(() => {
    // Fetch both hello message and chart data
    Promise.all([
      fetch('/api/hello').then(response => response.json()),
      fetch('/api/years').then(response => response.json())
    ])
      .then(([helloData, yearResponse]) => {
        setApiData(helloData)
        setYearData(yearResponse)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error:', error)
        setLoading(false)
      })
  }, [])

  const totalDuration = 10000;
  const maxPoints = Object.values((chartData?.data ?? {})).reduce(
    (acc, currentValue) => Math.max(acc, currentValue.length),
    1
  ) || 1;  
  var delayBetweenPoints = totalDuration / maxPoints;
  const animation =       
    {
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN, // the point is initially skipped
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0;
            }
            ctx.xStarted = true;
            return ctx.index * delayBetweenPoints;
          }
        }
      }
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
      },
      title: {
        display: false,
      },
    },
    scales: {
      x: {
        type: "linear",
        display: true,
        title: {
          display: true,
          text: 'Lap'
        }
      },
      y: {
        reverse: true,
        display: true,
        title: {
          display: true,
          text: 'Position'
        }
      }
    },
    animation
  }

  function leading_zero_array(n_zeros, last_number){
    var result = Array(n_zeros+1).fill(0)
    result[n_zeros] = last_number
    return result
  }

  var datasets = []
  const l =  Object.keys(chartData?.data || []).length
  for (const [i,key] of Object.keys(chartData?.data || []).entries()) {
    datasets.push({
        data: chartData?.data[key] || [],
        backgroundColor: `hsla(${Math.floor((360*i)/l)},90%,70%,0.8)`,
        borderColor: `hsla(${Math.floor((360*i)/l)},90%,70%,1)`,
        pointRadius: leading_zero_array(chartData?.data[key].length-1||0,5)
    })
  }

  const scatterData = {
    datasets: datasets
  }

  return (
    <div className="App">
      <header className="App-header">        
          <div className="content">
            <div className="chart-container">
            <select id="year" onChange={(e) => onYearChange(e.target.value)}>
            {yearData ? yearData.years.map((year) => (
              <option key={year} value={year} selected={year == selectedYear}>
                {year}
              </option>
            )):
              null}
            </select>
            <select id="race" onChange={(e) => onRaceChange(e.target.value)}>
            {raceData ? raceData.races.map((race) => (
              <option key={race.id} value={race.id}>
                {race.name}
              </option>
            )):
              null}
            </select>    
            {chartData && (
                <Line data={scatterData} options={chartOptions} />
              )}
            </div>
          </div>
      </header>
    </div>
  )
}

export default App 