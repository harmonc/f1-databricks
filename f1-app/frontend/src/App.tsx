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

function App() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch both hello message and chart data
    Promise.all([
      fetch('/api/hello').then(response => response.json()),
      fetch('/api/data').then(response => response.json())
    ])
      .then(([helloData, dataResponse]) => {
        setApiData(helloData)
        setChartData(dataResponse)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error:', error)
        setLoading(false)
      })
  }, [])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: chartData?.title || 'Hello world!',
        font: {
          size: 20
        }
      },
    },
    scales: {
      x: {
        type: "linear",
        display: true,
        title: {
          display: true,
          text: chartData?.x_title || 'Apps'
        }
      },
      y: {
        reverse: true,
        display: true,
        title: {
          display: true,
          text: chartData?.y_title || 'Fun with data'
        }
      }
    }
  }

  const scatterData = {
    datasets: [
      {
        data: chartData?.data || [],
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        pointRadius: 4,
      },
      {
        data: [{"x":0,"y":22},{"x":1,"y":21},{"x":2,"y":20},{"x":3,"y":19},{"x":4,"y":18},{"x":5,"y":17},{"x":6,"y":16},{"x":7,"y":15},{"x":8,"y":14},{"x":9,"y":13},{"x":10,"y":12},{"x":11,"y":11},{"x":12,"y":10},{"x":13,"y":9},{"x":14,"y":8},{"x":15,"y":7},{"x":16,"y":6},{"x":17,"y":5},{"x":18,"y":4},{"x":19,"y":3},{"x":20,"y":2},{"x":21,"y":1},{"x":22,"y":0}],
        backgroundColor: 'rgba(99, 255, 122, 0.8)',
        borderColor: 'rgba(99, 255, 122, 1)',
        pointRadius: 4,
      },
    ],
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Node.js + FastAPI Hello World</h1>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="content">
            {apiData ? (
              <div className="api-info">
                <p className="message">{apiData.message}</p>
              </div>
            ) : (
              <p>Failed to connect to API</p>
            )}
            
            {chartData && (
              <div className="chart-container">
                <Line data={scatterData} options={chartOptions} />
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  )
}

export default App 