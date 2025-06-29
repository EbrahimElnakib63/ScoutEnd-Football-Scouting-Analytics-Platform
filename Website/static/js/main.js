document.addEventListener("DOMContentLoaded", () => {
  // Import Plotly and marked
  const Plotly = window.Plotly
  const marked = window.marked

  // Theme toggle
  const themeSwitch = document.getElementById("theme-switch")

  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem("theme")
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

  if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
    document.documentElement.setAttribute("data-theme", "dark")
    themeSwitch.checked = true
  }

  themeSwitch.addEventListener("change", function () {
    if (this.checked) {
      document.documentElement.setAttribute("data-theme", "dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.setAttribute("data-theme", "light")
      localStorage.setItem("theme", "light")
    }
  })

  // Navigation
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()

      // Update active link
      document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"))
      this.classList.add("active")

      // Show active section
      const sectionId = this.getAttribute("data-section")
      document.querySelectorAll(".section").forEach((section) => {
        section.classList.remove("active")
      })
      document.getElementById(sectionId).classList.add("active")
    })
  })

  // Load dashboard data
  loadDashboard()

  // Update the loadDashboardData function to include the new dashboard layout structure
  function loadDashboard() {
    // Create dashboard layout structure if it doesn't exist
    const dashboardSection = document.getElementById("dashboard")
    if (dashboardSection) {
      // Add dashboard container with new structure
      dashboardSection.innerHTML = `
      <div class="dashboard-container">
        <div class="dashboard-header">
          <h2>Football Scouting Dashboard</h2>
          <p>Explore player predictions and discover top talents for the 2025 season</p>
        </div>
        
        <div class="dashboard-filters">
          <div class="filter-controls">
            <div class="filter-group">
              <label for="dashboard-view-type">Player Age</label>
              <select id="dashboard-view-type" class="form-select">
                <option value="all">All Players</option>
                <option value="young">Young Players (≤ 23)</option>
                <option value="experienced">Experienced Players (> 23)</option>
              </select>
            </div>
            <div class="filter-group">
              <label for="dashboard-position-filter">Position</label>
              <select id="dashboard-position-filter" class="form-select">
                <option value="all">All Positions</option>
                <option value="FW">Forwards</option>
                <option value="MF">Midfielders</option>
                <option value="DF">Defenders</option>
                <option value="GK">Goalkeepers</option>
              </select>
            </div>
            <button id="apply-dashboard-filters" class="btn btn-primary">Apply Filters</button>
          </div>
        </div>
        
        <div id="dashboard-summary" class="dashboard-summary"></div>
        
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <h3>Top 20 Players by Predicted Goals</h3>
              <span class="dashboard-card-subtitle">2025 Season Projections</span>
            </div>
            <div id="top-goals-chart" class="dashboard-chart">
          </div>
          
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <h3>Top 20 Players by Predicted Assists</h3>
              <span class="dashboard-card-subtitle">2025 Season Projections</span>
            </div>
            <div id="top-assists-chart" class="dashboard-chart">
          </div>
          
          <div class="dashboard-card">
            <div class="dashboard-card-header">
              <h3>Average Predictions by Position</h3>
              <span class="dashboard-card-subtitle">Goals and Assists by Position</span>
            </div>
            <div id="position-predictions-chart" class="dashboard-chart">
          </div>
          
          <div class="dashboard-card full-width">
            <div class="dashboard-card-header">
              <h3>Rising Stars</h3>
              <span class="dashboard-card-subtitle">Young Players with High Potential</span>
            </div>
            <div id="rising-stars" class="dashboard-rising-stars">
              <div class="loading"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </div>
    `

      // Add CSS for the new dashboard design
      const style = document.createElement("style")
      style.textContent = `
      .dashboard-container {
        max-width: 100%;
        margin: 0 auto;
        padding: 0.5rem;
      }
      
      .dashboard-header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid var(--border);
      }
      
      .dashboard-header h2 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        background: linear-gradient(90deg, var(--primary) 0%, #10b981 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .dashboard-header p {
        color: var(--text-secondary);
        font-size: 1.1rem;
      }
      
      .dashboard-filters {
        margin-bottom: 2rem;
      }
      
      .filter-controls {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        padding: 1.5rem;
        background-color: var(--card-bg);
        border-radius: 1rem;
        border: 1px solid var(--border);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }
      
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
        min-width: 200px;
      }
      
      .filter-group label {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--text-secondary);
      }
      
      .form-select {
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        border: 1px solid var(--border);
        background-color: var(--input-bg);
        color: var(--text-primary);
        font-size: 0.95rem;
        transition: all 0.2s ease;
      }
      
      .form-select:focus {
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
        outline: none;
      }
      
      .btn-primary {
        background-color: var(--primary);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        align-self: flex-end;
        margin-top: auto;
      }
      
      .btn-primary:hover {
        background-color: var(--primary-dark, #4338ca);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
      }
      
      .dashboard-summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
      }
      
      .summary-card {
        background-color: var(--card-bg);
        border-radius: 1rem;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 1px solid var(--border);
        text-align: center;
        transition: all 0.3s ease;
      }
      
      .summary-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        border-color: var(--primary);
      }
      
      .summary-card h3 {
        font-size: 1rem;
        margin-bottom: 0.75rem;
        color: var(--text-secondary);
      }
      
      .summary-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        background: linear-gradient(90deg, var(--primary) 0%, #10b981 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .summary-detail {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 600px), 1fr));
        gap: 1.5rem;
      }
      
      .dashboard-card {
        background-color: var(--card-bg);
        border-radius: 1rem;
        overflow: hidden;
        border: 1px solid var(--border);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
      }
      
      .dashboard-card:hover {
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        border-color: var(--primary);
      }
      
      .full-width {
        grid-column: 1 / -1;
      }
      
      .dashboard-card-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--border);
      }
      
      .dashboard-card-header h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.25rem;
        color: var(--text-primary);
      }
      
      .dashboard-card-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
      }
      
      .dashboard-chart {
        padding: 1rem;
        min-height: 400px;
      }
      
      .dashboard-rising-stars {
        padding: 1.5rem;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
      }
      
      .player-card {
        background-color: var(--card-bg);
        border-radius: 0.75rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        border: 1px solid var(--border);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      
      .player-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
        border-color: var(--primary);
      }
      
      .player-card-header {
        padding: 1.25rem;
        display: flex;
        gap: 1rem;
        align-items: center;
        border-bottom: 1px solid var(--border);
      }
      
      .player-card-image {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid var(--primary);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      
      .player-card-info h3 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
      }
      
      .player-card-info p {
        margin-bottom: 0.25rem;
        font-size: 0.9rem;
        color: var(--text-secondary);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .player-card-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
        padding: 1rem;
      }
      
      .stat-card {
        background-color: rgba(0, 0, 0, 0.03);
        border-radius: 0.5rem;
        padding: 0.75rem;
        text-align: center;
        transition: all 0.2s ease;
      }
      
      [data-theme="dark"] .stat-card {
        background-color: rgba(255, 255, 255, 0.05);
      }
      
      .stat-card:hover {
        background-color: rgba(79, 70, 229, 0.1);
      }
      
      .stat-value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--primary);
        margin-bottom: 0.25rem;
      }
      
      .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
      
      .nation-flag, .team-logo {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        object-fit: cover;
        vertical-align: middle;
      }
      
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(79, 70, 229, 0.1);
        border-radius: 50%;
        border-top-color: var(--primary);
        animation: spin 1s ease-in-out infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      @media (max-width: 768px) {
        .filter-controls {
          flex-direction: column;
        }
        
        .btn-primary {
          width: 100%;
          margin-top: 1rem;
        }
        
        .dashboard-header h2 {
          font-size: 1.5rem;
        }
        
        .dashboard-header p {
          font-size: 0.95rem;
        }
      }
    `
      document.head.appendChild(style)

      // Add event listener for filter button
      document.getElementById("apply-dashboard-filters").addEventListener("click", () => {
        // Show loading indicators
        document.getElementById("top-goals-chart").innerHTML = '<div class="loading"><div class="spinner"></div></div>'
        document.getElementById("top-assists-chart").innerHTML =
          '<div class="loading"><div class="spinner"></div></div>'

        // Fetch dashboard data with filters
        fetchDashboardData()
      })
    }

    // Fetch dashboard data from the server
    fetchDashboardData()
  }

  function createTopGoalsChart(topGoalsData) {
    // Use provided data or fallback to sample data
    let players = []
    let goals = []
    let teams = []
    let colors = []

    if (topGoalsData && topGoalsData.length > 0) {
      // Sort by predicted goals (descending)
      topGoalsData.sort((a, b) => b.predicted_goals_ensemble_2025 - a.predicted_goals_ensemble_2025)

      // Get top 20 players
      const top20 = topGoalsData.slice(0, 20)

      players = top20.map((player) => player.player)
      goals = top20.map((player) => player.predicted_goals_ensemble_2025)
      teams = top20.map((player) => player.team)

      // Generate colors based on teams for visual grouping
      const teamColors = {}
      const baseColors = [
        "#4f46e5",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#ec4899",
        "#06b6d4",
        "#84cc16",
        "#3b82f6",
        "#14b8a6",
        "#f97316",
        "#dc2626",
        "#a855f7",
        "#d946ef",
        "#0ea5e9",
        "#22c55e",
      ]

      teams.forEach((team) => {
        if (!teamColors[team]) {
          const colorIndex = Object.keys(teamColors).length % baseColors.length
          teamColors[team] = baseColors[colorIndex]
        }
      })

      colors = teams.map((team) => teamColors[team])
    } else {
      // Sample data as fallback
      players = ["Erling Haaland", "Kylian Mbappé", "Harry Kane", "Mohamed Salah", "Robert Lewandowski"]
      goals = [38.5, 35.2, 32.8, 30.1, 29.7]
      colors = Array(5).fill("#4f46e5")
    }

    const data = [
      {
        x: players,
        y: goals,
        type: "bar",
        marker: {
          color: colors,
          line: {
            color: "rgba(0,0,0,0.1)",
            width: 1,
          },
        },
        hovertemplate:
          "<b>%{x}</b><br>Predicted Goals: %{y:.1f}<br>Team: " +
          (teams.length > 0 ? teams.map((team, i) => (players[i] === "%{x}" ? team : "")).join("") : "N/A") +
          "<extra></extra>",
      },
    ]

    const layout = {
      margin: { l: 50, r: 30, t: 50, b: 100 },
      xaxis: {
        title: {
          text: "Players",
          font: {
            size: 14,
          },
        },
        gridcolor: "rgba(0,0,0,0.1)",
        tickangle: -45,
      },
      yaxis: {
        title: {
          text: "Predicted Goals",
          font: {
            size: 14,
          },
        },
        gridcolor: "rgba(0,0,0,0.1)",
      },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      autosize: true,
      height: 600,
      hoverlabel: {
        bgcolor: "#FFF",
        font: { size: 12 },
      },
      bargap: 0.15,
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
    }

    Plotly.newPlot("top-goals-chart", data, layout, config)
  }

  function createTopAssistsChart(topAssistsData) {
    // Use provided data or fallback to sample data
    let players = []
    let assists = []
    let teams = []
    let colors = []

    if (topAssistsData && topAssistsData.length > 0) {
      // Sort by predicted assists (descending)
      topAssistsData.sort((a, b) => b.predicted_assists_ensemble_2025 - a.predicted_assists_ensemble_2025)

      // Get top 20 players
      const top20 = topAssistsData.slice(0, 20)

      players = top20.map((player) => player.player)
      assists = top20.map((player) => player.predicted_assists_ensemble_2025)
      teams = top20.map((player) => player.team)

      // Generate colors based on teams for visual grouping
      const teamColors = {}
      const baseColors = [
        "#10b981",
        "#4f46e5",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#ec4899",
        "#06b6d4",
        "#84cc16",
        "#14b8a6",
        "#3b82f6",
        "#f97316",
        "#dc2626",
        "#a855f7",
        "#d946ef",
        "#0ea5e9",
        "#22c55e",
      ]

      teams.forEach((team) => {
        if (!teamColors[team]) {
          const colorIndex = Object.keys(teamColors).length % baseColors.length
          teamColors[team] = baseColors[colorIndex]
        }
      })

      colors = teams.map((team) => teamColors[team])
    } else {
      // Sample data as fallback
      players = ["Kevin De Bruyne", "Lionel Messi", "Bruno Fernandes", "Thomas Müller", "Trent Alexander-Arnold"]
      assists = [22.3, 20.8, 19.5, 18.2, 17.9]
      colors = Array(5).fill("#10b981")
    }

    const data = [
      {
        x: players,
        y: assists,
        type: "bar",
        marker: {
          color: colors,
          line: {
            color: "rgba(0,0,0,0.1)",
            width: 1,
          },
        },
        hovertemplate:
          "<b>%{x}</b><br>Predicted Assists: %{y:.1f}<br>Team: " +
          (teams.length > 0 ? teams.map((team, i) => (players[i] === "%{x}" ? team : "")).join("") : "N/A") +
          "<extra></extra>",
      },
    ]

    const layout = {
      margin: { l: 50, r: 30, t: 50, b: 100 },
      xaxis: {
        title: {
          text: "Players",
          font: {
            size: 14,
          },
        },
        gridcolor: "rgba(0,0,0,0.1)",
        tickangle: -45,
      },
      yaxis: {
        title: {
          text: "Predicted Assists",
          font: {
            size: 14,
          },
        },
        gridcolor: "rgba(0,0,0,0.1)",
      },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      autosize: true,
      height: 600,
      hoverlabel: {
        bgcolor: "#FFF",
        font: { size: 12 },
      },
      bargap: 0.15,
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
    }

    Plotly.newPlot("top-assists-chart", data, layout, config)
  }

  function loadDashboardData() {
    // Add dashboard summary and filters containers if they don't exist
    const dashboardSection = document.getElementById("dashboard")
    if (dashboardSection) {
      // Check if containers already exist
      if (!document.getElementById("dashboard-filters")) {
        const filtersContainer = document.createElement("div")
        filtersContainer.id = "dashboard-filters"
        dashboardSection.insertBefore(filtersContainer, dashboardSection.firstChild)
      }

      if (!document.getElementById("dashboard-summary")) {
        const summaryContainer = document.createElement("div")
        summaryContainer.id = "dashboard-summary"
        dashboardSection.insertBefore(summaryContainer, document.getElementById("dashboard-filters").nextSibling)
      }
    }

    // Add filter controls to the dashboard
    const dashboardFilters = document.getElementById("dashboard-filters")
    if (dashboardFilters) {
      dashboardFilters.innerHTML = `
      <div class="filter-controls">
        <div class="filter-group">
          <label for="dashboard-view-type">View Type:</label>
          <select id="dashboard-view-type" class="form-select">
            <option value="all">All Players</option>
            <option value="young">Young Players (≤ 23)</option>
            <option value="experienced">Experienced Players (> 23)</option>
          </select>
        </div>
        <div class="filter-group">
          <label for="dashboard-position-filter">Position:</label>
          <select id="dashboard-position-filter" class="form-select">
            <option value="all">All Positions</option>
            <option value="FW">Forwards</option>
            <option value="MF">Midfielders</option>
            <option value="DF">Defenders</option>
            <option value="GK">Goalkeepers</option>
          </select>
        </div>
        <button id="apply-dashboard-filters" class="btn btn-primary">Apply Filters</button>
      </div>
    `

      // Add event listener for filter button
      document.getElementById("apply-dashboard-filters").addEventListener("click", () => {
        // Show loading indicators
        document.getElementById("top-goals-chart").innerHTML = '<div class="loading"><div class="spinner"></div></div>'
        document.getElementById("top-assists-chart").innerHTML =
          '<div class="loading"><div class="spinner"></div></div>'

        // Fetch dashboard data with filters
        fetchDashboardData()
      })
    }

    // Show loading indicators
    document.getElementById("top-goals-chart").innerHTML = '<div class="loading"><div class="spinner"></div></div>'
    document.getElementById("top-assists-chart").innerHTML = '<div class="loading"><div class="spinner"></div></div>'
    document.getElementById("position-predictions-chart").innerHTML =
      '<div class="loading"><div class="spinner"></div></div>'
    document.getElementById("rising-stars").innerHTML = '<div class="loading"><div class="spinner"></div></div>'

    // Fetch dashboard data from the server
    fetchDashboardData()
  }

  function fetchDashboardData() {
    // Get filter values if they exist
    const viewType = document.getElementById("dashboard-view-type")?.value || "all"
    const positionFilter = document.getElementById("dashboard-position-filter")?.value || "all"

    // Fetch dashboard data from the server
    fetch("/dashboard_data")
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error("Error loading dashboard data:", data.error)
          return
        }

        // Apply filters to the data
        let filteredGoalsData = [...data.top_goals]
        let filteredAssistsData = [...data.top_assists]

        // Apply age filter
        if (viewType === "young") {
          filteredGoalsData = filteredGoalsData.filter((player) => player.age <= 23)
          filteredAssistsData = filteredAssistsData.filter((player) => player.age <= 23)
        } else if (viewType === "experienced") {
          filteredGoalsData = filteredGoalsData.filter((player) => player.age > 23)
          filteredAssistsData = filteredAssistsData.filter((player) => player.age > 23)
        }

        // Apply position filter
        if (positionFilter !== "all") {
          filteredGoalsData = filteredGoalsData.filter((player) => player.pos.includes(positionFilter))
          filteredAssistsData = filteredAssistsData.filter((player) => player.pos.includes(positionFilter))
        }

        // Create charts with the filtered data
        createTopGoalsChart(filteredGoalsData)
        createTopAssistsChart(filteredAssistsData)
        createPositionPredictionsChart(data.position_predictions)
        displayRisingStars(data.rising_stars)

        // Add dashboard summary
        updateDashboardSummary(filteredGoalsData, filteredAssistsData)
      })
      .catch((error) => {
        console.error("Error fetching dashboard data:", error)
        // Fallback to sample data if API fails
        createTopGoalsChart()
        createTopAssistsChart()
        createPositionPredictionsChart()
        displayRisingStars()
      })
  }

  function updateDashboardSummary(goalsData, assistsData) {
    const summaryContainer = document.getElementById("dashboard-summary")
    if (!summaryContainer) return

    // Calculate some interesting stats
    const topGoalScorer = goalsData.length > 0 ? goalsData[0] : null
    const topAssistMaker = assistsData.length > 0 ? assistsData[0] : null

    // Count unique teams in top 20
    const uniqueTeams = new Set()
    goalsData.slice(0, 20).forEach((player) => uniqueTeams.add(player.team))
    assistsData.slice(0, 20).forEach((player) => uniqueTeams.add(player.team))

    // Count young players (age <= 23)
    const youngGoalScorers = goalsData.filter((player) => player.age <= 23).length
    const youngAssistMakers = assistsData.filter((player) => player.age <= 23).length

    const html = `
    <div class="dashboard-summary-cards">
      <div class="summary-card">
        <h3>Top Goal Scorer</h3>
        <div class="summary-value">${topGoalScorer ? topGoalScorer.player : "N/A"}</div>
        <div class="summary-detail">${topGoalScorer ? `${topGoalScorer.predicted_goals_ensemble_2025.toFixed(1)} predicted goals` : ""}</div>
      </div>
      
      <div class="summary-card">
        <h3>Top Assist Maker</h3>
        <div class="summary-value">${topAssistMaker ? topAssistMaker.player : "N/A"}</div>
        <div class="summary-detail">${topAssistMaker ? `${topAssistMaker.predicted_assists_ensemble_2025.toFixed(1)} predicted assists` : ""}</div>
      </div>
      
      <div class="summary-card">
        <h3>Teams Represented</h3>
        <div class="summary-value">${uniqueTeams.size}</div>
        <div class="summary-detail">unique teams in top players</div>
      </div>
      
      <div class="summary-card">
        <h3>Young Talents</h3>
        <div class="summary-value">${youngGoalScorers + youngAssistMakers}</div>
        <div class="summary-detail">players age 23 or younger</div>
      </div>
    </div>
  `

    summaryContainer.innerHTML = html

    // Add CSS for summary cards
    const style = document.createElement("style")
    style.textContent = `
    .dashboard-summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    
    .summary-card {
      background-color: var(--card-bg);
      border-radius: 0.75rem;
      padding: 1.25rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border);
      text-align: center;
    }
    
    .summary-card h3 {
      font-size: 1rem;
      margin-bottom: 0.75rem;
      color: var(--text-secondary);
    }
    
    .summary-value {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: var(--primary);
    }
    
    .summary-detail {
      font-size: 0.875rem;
      color: var(--text-secondary);
    }
    
    .filter-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: var(--card-bg);
      border-radius: 0.75rem;
      border: 1px solid var(--border);
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    @media (max-width: 768px) {
      .filter-controls {
        flex-direction: column;
      }
    }
  `
    document.head.appendChild(style)
  }

  function createPositionPredictionsChart(positionData) {
    // Use provided data or fallback to sample data
    let positions = []
    let avgGoals = []
    let avgAssists = []

    if (positionData && positionData.length > 0) {
      positions = positionData.map((pos) => pos.pos)
      avgGoals = positionData.map((pos) => pos.predicted_goals_ensemble_2025)
      avgAssists = positionData.map((pos) => pos.predicted_assists_ensemble_2025)
    } else {
      // Sample data as fallback
      positions = ["FW", "MF", "DF", "GK"]
      avgGoals = [18.5, 6.2, 2.1, 0]
      avgAssists = [7.3, 9.8, 3.2, 0.5]
    }

    const trace1 = {
      x: positions,
      y: avgGoals,
      name: "Avg. Predicted Goals",
      type: "bar",
      marker: {
        color: "#4f46e5",
      },
    }

    const trace2 = {
      x: positions,
      y: avgAssists,
      name: "Avg. Predicted Assists",
      type: "bar",
      marker: {
        color: "#10b981",
      },
    }

    const data = [trace1, trace2]

    const layout = {
      barmode: "group",
      margin: { l: 50, r: 30, t: 50, b: 100 },
      xaxis: {
        title: "Position",
        gridcolor: "rgba(0,0,0,0.1)",
        tickangle: -45,
      },
      yaxis: {
        title: "Average Predictions",
        gridcolor: "rgba(0,0,0,0.1)",
      },
      legend: {
        x: 0,
        y: 1.2,
        orientation: "h",
      },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      autosize: true,
      height: 600,
    }

    const config = {
      responsive: true,
      displayModeBar: false,
    }

    Plotly.newPlot("position-predictions-chart", data, layout, config)
  }

  function displayRisingStars(risingStarsData) {
    const container = document.getElementById("rising-stars")
    let html = ""

    // Use provided data or fallback to sample data
    const stars = risingStarsData || [
      {
        player: "Jude Bellingham",
        age: 19,
        team: "Real Madrid",
        nation: "England",
        pos: "MF",
        Performance_Gls: 8,
        Performance_Ast: 5,
        predicted_goals_ensemble_2025: 15.3,
        predicted_assists_ensemble_2025: 12.8,
        player_img: "/placeholder.svg?height=80&width=80",
      },
      {
        player: "Jamal Musiala",
        age: 20,
        team: "Bayern Munich",
        nation: "Germany",
        pos: "MF,FW",
        Performance_Gls: 11,
        Performance_Ast: 9,
        predicted_goals_ensemble_2025: 18.5,
        predicted_assists_ensemble_2025: 14.2,
        player_img: "/placeholder.svg?height=80&width=80",
      },
      {
        player: "Florian Wirtz",
        age: 20,
        team: "Bayer Leverkusen",
        nation: "Germany",
        pos: "MF",
        Performance_Gls: 7,
        Performance_Ast: 12,
        predicted_goals_ensemble_2025: 14.2,
        predicted_assists_ensemble_2025: 17.5,
        player_img: "/placeholder.svg?height=80&width=80",
      },
      {
        player: "Gavi",
        age: 18,
        team: "Barcelona",
        nation: "Spain",
        pos: "MF",
        Performance_Gls: 4,
        Performance_Ast: 8,
        predicted_goals_ensemble_2025: 9.5,
        predicted_assists_ensemble_2025: 13.8,
        player_img: "/placeholder.svg?height=80&width=80",
      },
    ]

    stars.forEach((player) => {
      // Get player image if available
      const playerImg = player.player_img || `/placeholder.svg?height=80&width=80`

      // Get nation flag if available
      const nationFlag = player.nation_img
        ? `<img src="${player.nation_img}" alt="${player.nation} flag" class="nation-flag">`
        : ""

      // Get team logo if available
      const teamLogo = player.team_img
        ? `<img src="${player.team_img}" alt="${player.team} logo" class="team-logo">`
        : ""

      html += `
        <div class="player-card">
          <div class="player-card-header">
            <img src="${playerImg}" alt="${player.player}" class="player-card-image">
            <div class="player-card-info">
              <h3>${player.player}</h3>
              <p>${nationFlag} ${player.nation} | ${player.age} yrs</p>
              <p>${teamLogo} ${player.team}</p>
              <p><strong>Position:</strong> ${player.pos}</p>
            </div>
          </div>
          
          <div class="player-card-stats">
            <div class="stat-card">
              <div class="stat-value">${player.Performance_Gls}</div>
              <div class="stat-label">Goals</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${player.Performance_Ast}</div>
              <div class="stat-label">Assists</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${player.predicted_goals_ensemble_2025.toFixed(1)}</div>
              <div class="stat-label">Pred. Goals 2025</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${player.predicted_assists_ensemble_2025.toFixed(1)}</div>
              <div class="stat-label">Pred. Assists 2025</div>
            </div>
          </div>
        </div>
      `
    })

    container.innerHTML = html
  }

  // Range slider value display
  document.querySelectorAll(".range-slider").forEach((slider) => {
    const valueDisplay = document.getElementById(`${slider.id}-value`)
    if (valueDisplay) {
      valueDisplay.textContent = slider.value

      slider.addEventListener("input", function () {
        valueDisplay.textContent = this.value
      })
    }
  })

  // Market value range sliders
  const marketMinSlider = document.getElementById("market-value-min-range")
  const marketMaxSlider = document.getElementById("market-value-max-range")
  const marketMinDisplay = document.getElementById("market-value-min")
  const marketMaxDisplay = document.getElementById("market-value-max")

  if (marketMinSlider && marketMaxSlider) {
    // Update min value display
    marketMinSlider.addEventListener("input", function () {
      const minVal = Number.parseFloat(this.value)
      const maxVal = Number.parseFloat(marketMaxSlider.value)

      if (minVal >= maxVal) {
        this.value = maxVal - 0.5
        marketMinDisplay.textContent = (maxVal - 0.5).toFixed(1)
      } else {
        marketMinDisplay.textContent = minVal.toFixed(1)
      }
    })

    // Update max value display
    marketMaxSlider.addEventListener("input", function () {
      const maxVal = Number.parseFloat(this.value)
      const minVal = Number.parseFloat(marketMinSlider.value)

      if (maxVal <= minVal) {
        this.value = minVal + 0.5
        marketMaxDisplay.textContent = (minVal + 0.5).toFixed(1)
      } else {
        marketMaxDisplay.textContent = maxVal.toFixed(1)
      }
    })
  }

  // Multi-select handling
  setupMultiSelect("player-skills", "selected-skills")
  setupMultiSelect("positions", "selected-positions")

  function setupMultiSelect(selectId, containerId) {
    const select = document.getElementById(selectId)
    const container = document.getElementById(containerId)

    if (select && container) {
      // Initial render
      updateSelectedOptions(select, container)

      // Update on change
      select.addEventListener("change", () => {
        updateSelectedOptions(select, container)
      })
    }
  }

  function updateSelectedOptions(select, container) {
    container.innerHTML = ""

    Array.from(select.selectedOptions).forEach((option) => {
      const tag = document.createElement("div")
      tag.className = "selected-option"
      tag.innerHTML = `
        ${option.textContent}
        <button type="button" data-value="${option.value}">&times;</button>
      `
      container.appendChild(tag)

      // Add remove button functionality
      tag.querySelector("button").addEventListener("click", function () {
        const value = this.getAttribute("data-value")
        Array.from(select.options).forEach((opt) => {
          if (opt.value === value) {
            opt.selected = false
          }
        })
        updateSelectedOptions(select, container)
      })
    })
  }

  // Initialize NiceSelect2 for searchable dropdowns
  if (typeof NiceSelect !== 'undefined') {
    NiceSelect.bind(document.getElementById("player-search"), {searchable: true});
    NiceSelect.bind(document.getElementById("player1"), {searchable: true});
    NiceSelect.bind(document.getElementById("player2"), {searchable: true});
    NiceSelect.bind(document.getElementById("player3"), {searchable: true});
    NiceSelect.bind(document.getElementById("team-select"), {searchable: true});
    NiceSelect.bind(document.getElementById("compatibility-player"), {searchable: true});
    NiceSelect.bind(document.getElementById("youth-league-filter"), {searchable: true});
    NiceSelect.bind(document.getElementById("sort-by"), {searchable: true});
  }

  // Player Scout Search
  const playerSearchSelect = document.getElementById("player-search")
  if (playerSearchSelect) {
    playerSearchSelect.addEventListener("change", (event) => {
      const playerName = event.target.value
      if (playerName) {
        fetchPlayerInfo(playerName)
      } else {
        document.getElementById("player-info-container").classList.add("hidden")
      }
    })
  }

  function fetchPlayerInfo(playerName) {
    // Show loading
    document.getElementById("player-info").innerHTML = '<div class="loading"><div class="spinner"></div></div>'
    document.getElementById("performance-stats").innerHTML = '<div class="loading"><div class="spinner"></div></div>'
    document.getElementById("similar-players").innerHTML = '<div class="loading"><div class="spinner"></div></div>'
    document.getElementById("player-info-container").classList.remove("hidden")

    fetch("/player_info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ player_name: playerName }),
    })
      .then((response) => response.json())
      .then((data) => {
        displayPlayerInfo(data.player_data, "player-info")
        displayPerformanceStats(data.player_data, "performance-stats")
        displaySimilarPlayers(data.similar_players, "similar-players")

        // Render radar chart
        const radarChart = JSON.parse(data.radar_chart)
        Plotly.newPlot("radar-chart", radarChart.data, radarChart.layout)
      })
      .catch((error) => {
        document.getElementById("player-info").innerHTML = `
          <div class="alert error">
            <i class="fas fa-exclamation-circle"></i>
            <div>Error loading player information: ${error.message}</div>
          </div>
        `
      })
  }

  function displayPlayerInfo(playerData, containerId) {
    let html = ""
    const container = document.getElementById(containerId)

    if (!playerData) {
      container.innerHTML = "<p>No player data available.</p>"
      return
    }

    // Get player image if available
    const playerImg = playerData.player_img || `/placeholder.svg?height=150&width=150`

    // Get nation flag if available
    const nationFlag = playerData.nation_img || ""

    // Get team logo if available
    const teamLogo = playerData.team_img || ""

    html += `
      <div class="player-info">
        <div class="player-info-header">
          <img src="${playerImg}" alt="${playerData.player}" class="player-image">
          <div>
            <h2>${playerData.player}</h2>
            <p>
              ${nationFlag ? `<img src="${nationFlag}" alt="${playerData.nation} flag" class="nation-flag">` : ""}
              <strong>Nation:</strong> ${playerData.nation}
            </p>
            <p>
              ${teamLogo ? `<img src="${teamLogo}" alt="${playerData.team} logo" class="team-logo">` : ""}
              <strong>Team:</strong> ${playerData.team}
            </p>
            <p><strong>Position:</strong> ${playerData.pos}</p>
            <p><strong>Age:</strong> ${playerData.age}</p>
    `

    // Add foot if available
    if (playerData.foot) {
      html += `<p><strong>Foot:</strong> ${playerData.foot}</p>`
    }

    // Add height and weight if available
    if (playerData.height_cm) {
      html += `<p><strong>Height:</strong> ${playerData.height_cm} cm</p>`
    }

    if (playerData.weight_kg) {
      html += `<p><strong>Weight:</strong> ${playerData.weight_kg} kg</p>`
    }

    // Add market value if available
    if (playerData.market_value) {
      // Ensure market value has 'M' suffix
      const marketValue = playerData.market_value
      const formattedValue =
        typeof marketValue === "string" && marketValue.includes("M") ? marketValue : `${marketValue}M`

      html += `<p><strong>Market Value:</strong> ${formattedValue}</p>`
    }

    html += `
          </div>
        </div>
      </div>
    `

    container.innerHTML = html
  }

  function displayPerformanceStats(playerData, containerId) {
    let html = ""
    const container = document.getElementById(containerId)

    if (!playerData) {
      container.innerHTML = "<p>No player data available.</p>"
      return
    }

    // Create an array of stats to display
    const stats = [
      { label: "Goals", value: playerData.Performance_Gls || 0 },
      { label: "Assists", value: playerData.Performance_Ast || 0 },
      { label: "G+A", value: playerData.Performance_G_A || playerData["Performance_G+A"] || 0 },
      {
        label: "Expected Goals",
        value: playerData.Expected_xG !== undefined ? playerData.Expected_xG.toFixed(2) : "N/A",
      },
      {
        label: "Expected Assists",
        value: playerData.Expected_xAG !== undefined ? playerData.Expected_xAG.toFixed(2) : "N/A",
      },
      { label: "Key Passes", value: playerData.KP || 0 },
      { label: "Tackles Won", value: playerData.Tackles_TklW || 0 },
      { label: "Interceptions", value: playerData.Int || 0 },
      {
        label: "Pred. Goals 2025",
        value:
          playerData.predicted_goals_ensemble_2025 !== undefined
            ? playerData.predicted_goals_ensemble_2025.toFixed(1)
            : "N/A",
      },
      {
        label: "Pred. Assists 2025",
        value:
          playerData.predicted_assists_ensemble_2025 !== undefined
            ? playerData.predicted_assists_ensemble_2025.toFixed(1)
            : "N/A",
      },
      { label: "Matches Played", value: playerData["Playing Time_MP"] || 0 },
      { label: "Minutes", value: playerData["Playing Time_Min"] || 0 },
    ]

    stats.forEach((stat) => {
      html += `
        <div class="stat-card">
          <div class="stat-value">${stat.value}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
      `
    })

    container.innerHTML = html
  }

  function displaySimilarPlayers(players, containerId) {
    const container = document.getElementById(containerId)

    if (!players || players.length === 0) {
      container.innerHTML = "<p>No similar players found.</p>"
      return
    }

    let html = ""

    // Display only top 6 similar players
    const topPlayers = players.slice(0, 6)

    topPlayers.forEach((player) => {
      // Get player image if available
      const playerImg = player.player_img || `/placeholder.svg?height=60&width=60`

      // Get nation flag if available
      const nationFlag = player.nation_img
        ? `<img src="${player.nation_img}" alt="${player.nation} flag" class="nation-flag">`
        : ""

      // Get team logo if available
      const teamLogo = player.team_img
        ? `<img src="${player.team_img}" alt="${player.team} logo" class="team-logo">`
        : ""

      html += `
        <div class="similar-player-card">
          <div class="similar-player-header">
            <img src="${playerImg}" alt="${player.player}" class="similar-player-image">
            <div>
              <div class="similar-player-name">${player.player}</div>
              <div class="similar-player-info">${nationFlag} ${player.nation} | ${player.age} yrs</div>
              <div class="similar-player-info">${teamLogo} ${player.team} | ${player.pos}</div>
            </div>
          </div>
          <div class="similar-player-stats">
            <div class="stat-card">
              <div class="stat-value">${player.Performance_Gls}</div>
              <div class="stat-label">Goals</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${player.Performance_Ast}</div>
              <div class="stat-label">Assists</div>
            </div>
          </div>
        </div>
      `
    })

    container.innerHTML = html
  }

  // Generate Scouting Report
  const generateReportBtn = document.getElementById("generate-report-btn")
  if (generateReportBtn) {
    generateReportBtn.addEventListener("click", () => {
      const playerName = document.getElementById("player-search").value

      if (!playerName) {
        alert("Please select a player first.")
        return
      }

      // Show loading
      document.getElementById("scouting-report").innerHTML = '<div class="loading"><div class="spinner"></div></div>'

      fetch("/generate_scouting_report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          player_name: playerName,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            document.getElementById("scouting-report").innerHTML = `
              <div class="alert error">
                <i class="fas fa-exclamation-circle"></i>
                <div>${data.error}</div>
              </div>
            `
          } else {
            document.getElementById("scouting-report").innerHTML = marked.parse(data.report)
          }
        })
        .catch((error) => {
          document.getElementById("scouting-report").innerHTML = `
            <div class="alert error">
              <i class="fas fa-exclamation-circle"></i>
              <div>Error generating report: ${error.message}</div>
            </div>
          `
        })
    })
  }

  // Team Builder Submit
  const teamBuilderSubmit = document.getElementById("team-builder-submit")
  if (teamBuilderSubmit) {
    teamBuilderSubmit.addEventListener("click", () => {
      const gameStyle = document.getElementById("game-style").value
      const playerExperience = document.getElementById("player-experience").value
      const league = document.getElementById("league").value
      const generalPosition = document.getElementById("general-position").value
      const nation = document.getElementById("nation").value
      const preferredFoot = document.getElementById("preferred-foot").value
      const marketValueMin = document.getElementById("market-value-min-range").value
      const marketValueMax = document.getElementById("market-value-max-range").value

      // Get selected skills
      const skillsSelect = document.getElementById("player-skills")
      const selectedSkills = Array.from(skillsSelect.selectedOptions).map((option) => option.value)

      if (selectedSkills.length === 0) {
        alert("Please select at least one player skill.")
        return
      }

      // Display selected options
      const selectedOptionsContainer = document.getElementById("selected-options")
      selectedOptionsContainer.classList.remove("hidden")

      let selectedOptionsHTML = `
        <div class="alert info">
          <i class="fas fa-info-circle"></i>
          <div>
            <strong>Selected Options:</strong><br>
            Game Style: ${gameStyle}<br>
            Player Type: ${playerExperience}<br>
            League: ${league}<br>
      `

      if (generalPosition) {
        selectedOptionsHTML += `Position: ${generalPosition}<br>`
      }

      if (nation) {
        selectedOptionsHTML += `Nation: ${nation}<br>`
      }

      if (preferredFoot) {
        selectedOptionsHTML += `Preferred Foot: ${preferredFoot}<br>`
      }

      selectedOptionsHTML += `Market Value Range: ${marketValueMin} - ${marketValueMax} million<br>`
      selectedOptionsHTML += `Skills: ${selectedSkills.join(", ")}`
      selectedOptionsHTML += `</div></div>`

      selectedOptionsContainer.innerHTML = selectedOptionsHTML

      // Show loading
      document.getElementById("team-builder-report").innerHTML =
        '<div class="loading"><div class="spinner"></div></div>'
      document.getElementById("recommended-player-info").classList.add("hidden")
      document.getElementById("filtered-players").classList.add("hidden")

      fetch("/team_builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          game_style: gameStyle,
          player_experience: playerExperience,
          league: league,
          position: generalPosition,
          nation: nation,
          preferred_foot: preferredFoot,
          market_value_min: marketValueMin,
          market_value_max: marketValueMax,
          player_skills: selectedSkills,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            document.getElementById("team-builder-report").innerHTML = `
              <div class="alert error">
                <i class="fas fa-exclamation-circle"></i>
                <div>${data.error}</div>
              </div>
            `
          } else {
            document.getElementById("team-builder-report").innerHTML = marked.parse(data.report)

            // Display recommended player if available
            if (data.recommended_player_data) {
              document.getElementById("recommended-player-info").classList.remove("hidden")
              displayPlayerInfo(data.recommended_player_data, "recommended-player-details")
            }

            // Display filtered players
            if (data.filtered_players && data.filtered_players.length > 0) {
              document.getElementById("filtered-players").classList.remove("hidden")
              displayFilteredPlayers(data.filtered_players, "filtered-players-list")
            }
          }
        })
        .catch((error) => {
          document.getElementById("team-builder-report").innerHTML = `
            <div class="alert error">
              <i class="fas fa-exclamation-circle"></i>
              <div>Error generating report: ${error.message}</div>
            </div>
          `
        })
    })
  }

  function displayFilteredPlayers(players, containerId) {
    const container = document.getElementById(containerId)

    if (!players || players.length === 0) {
      container.innerHTML = "<p>No players found matching the criteria.</p>"
      return
    }

    let html = ""

    players.forEach((player) => {
      // Get player image if available
      const playerImg = player.player_img || `/placeholder.svg?height=80&width=80`

      // Get nation flag if available
      const nationFlag = player.nation_img
        ? `<img src="${player.nation_img}" alt="${player.nation} flag" class="nation-flag">`
        : ""

      // Get team logo if available
      const teamLogo = player.team_img
        ? `<img src="${player.team_img}" alt="${player.team} logo" class="team-logo">`
        : ""

      html += `
        <div class="player-card">
          <div class="player-card-header">
            <img src="${playerImg}" alt="${player.player}" class="player-card-image">
            <div class="player-card-info">
              <h3>${player.player}</h3>
              <p>${nationFlag} ${player.nation} | ${player.age} yrs</p>
              <p>${teamLogo} ${player.team}</p>
              <p><strong>Position:</strong> ${player.pos}</p>
              ${player.foot ? `<p><strong>Foot:</strong> ${player.foot}</p>` : ""}
              ${player.market_value ? `<p><strong>Value:</strong> ${typeof player.market_value === "string" && player.market_value.includes("M") ? player.market_value : `${player.market_value}M`}</p>` : ""}
            </div>
          </div>
          
          <div class="player-card-stats">
            <div class="stat-card">
              <div class="stat-value">${player.Performance_Gls || 0}</div>
              <div class="stat-label">Goals</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${player.Performance_Ast || 0}</div>
              <div class="stat-label">Assists</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${player.predicted_goals_ensemble_2025 ? player.predicted_goals_ensemble_2025.toFixed(1) : "N/A"}</div>
              <div class="stat-label">Pred. Goals 2025</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${player.predicted_assists_ensemble_2025 ? player.predicted_assists_ensemble_2025.toFixed(1) : "N/A"}</div>
              <div class="stat-label">Pred. Assists 2025</div>
            </div>
          </div>
        </div>
      `
    })

    container.innerHTML = html
  }

  // Player Comparison Section
  const comparePlayersBtn = document.getElementById("compare-players-btn")
  if (comparePlayersBtn) {
    comparePlayersBtn.addEventListener("click", () => {
      const player1 = document.getElementById("player1").value
      const player2 = document.getElementById("player2").value
      const player3 = document.getElementById("player3").value

      if (!player1 || !player2) {
        alert("Please select at least two players to compare.")
        return
      }

      // Collect players
      const players = [player1, player2]
      if (player3 && player3 !== "None") {
        players.push(player3)
      }

      // Default metrics for comparison
      const metrics = [
        "Performance_Gls",
        "Performance_Ast",
        "KP",
        "GCA_GCA",
        "Int",
        "Tackles_TklW",
        "Expected_xG",
        "Expected_xAG",
      ]

      // Show loading
      document.getElementById("comparison-results").classList.remove("hidden")
      document.getElementById("comparison-table").innerHTML = '<div class="loading"><div class="spinner"></div></div>'

      fetch("/player_comparison", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          players: players,
          metrics: metrics,
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            document.getElementById("comparison-table").innerHTML = `
              <div class="alert error">
                <i class="fas fa-exclamation-circle"></i>
                <div>${data.error}</div>
              </div>
            `
          } else {
            displayComparisonTable(data.players_data)
            displayComparisonDifferences(data.differences)

            // Render radar chart
            const radarChart = JSON.parse(data.radar_chart)
            Plotly.newPlot("comparison-radar", radarChart.data, radarChart.layout)
          }
        })
        .catch((error) => {
          document.getElementById("comparison-table").innerHTML = `
            <div class="alert error">
              <i class="fas fa-exclamation-circle"></i>
              <div>Error comparing players: ${error.message}</div>
            </div>
          `
        })
    })
  }

  function displayComparisonTable(playersData) {
    const container = document.getElementById("comparison-table")

    if (!playersData || playersData.length === 0) {
      container.innerHTML = "<p>No player data available for comparison.</p>"
      return
    }

    // Define categories and metrics
    const categories = {
      "Basic Info": ["age", "pos", "team", "nation", "foot", "market_value"],
      Performance: ["Performance_Gls", "Performance_Ast", "Performance_G+A", "Performance_G-PK"],
      "Expected Stats": ["Expected_xG", "Expected_npxG", "Expected_xAG", "Expected_xA"],
      Progression: ["Progression_PrgC", "Progression_PrgP", "Progression_PrgR"],
      Tackles: ["Tackles_Tkl", "Tackles_TklW"],
      "Chance Creation": ["SCA_SCA", "GCA_GCA"],
      Predictions: ["predicted_goals_ensemble_2025", "predicted_assists_ensemble_2025"],
    }

    let html = "<table>"

    // Table header with player names
    html += "<tr><th>Metric</th>"
    playersData.forEach((player) => {
      // Get player image if available
      const playerImg = player.player_img
        ? `<img src="${player.player_img}" alt="${player.player}" width="30" height="30" style="border-radius: 50%; margin-right: 8px; vertical-align: middle;">`
        : ""

      html += `<th>${playerImg}${player.player}</th>`
    })
    html += "</tr>"

    // Add rows for each category and metric
    for (const [category, metrics] of Object.entries(categories)) {
      // Category header
      html += `<tr><td colspan="${playersData.length + 1}" style="background-color: var(--input-bg); font-weight: bold;">${category}</td></tr>`

      // Metrics
      metrics.forEach((metric) => {
        // Check if at least one player has this metric
        const hasMetric = playersData.some((player) => metric in player)

        if (hasMetric) {
          html += `<tr><td>${metric}</td>`

          playersData.forEach((player) => {
            const value = player[metric] !== undefined ? player[metric] : "N/A"
            html += `<td>${value}</td>`
          })

          html += "</tr>"
        }
      })
    }

    html += "</table>"
    container.innerHTML = html
  }

  function displayComparisonDifferences(differences) {
    const container = document.getElementById("comparison-differences")

    if (!differences || differences.length === 0) {
      container.innerHTML = "<p>No significant statistical differences found between these players.</p>"
      return
    }

    let html = "<ul class='comparison-differences'>"
    differences.forEach((diff) => {
      html += `<li>${diff}</li>`
    })
    html += "</ul>"

    container.innerHTML = html
  }

  // Youth Talent Scout Section
  const findTalentsBtn = document.getElementById("find-talents-btn")
  if (findTalentsBtn) {
    // Add event listener for display mode radio buttons
    const displayModeRadios = document.querySelectorAll('input[name="display-mode"]')
    displayModeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const currentDisplayMode = this.value
            const talentsResults = document.getElementById("talents-results")
            if (talentsResults && talentsResults.dataset.talents) {
                const talents = JSON.parse(talentsResults.dataset.talents)
                displayTalents(talents, currentDisplayMode)
            }
        })
    })

    findTalentsBtn.addEventListener("click", () => {
        const maxAge = document.getElementById("max-age").value
        const minGoals = document.getElementById("min-goals").value
        const minAssists = document.getElementById("min-assists").value
        const minPredictedGoals = document.getElementById("min-predicted-goals").value
        const minPredictedAssists = document.getElementById("min-predicted-assists").value
        const sortBy = document.getElementById("sort-by").value

        // Get selected positions
        const positionsSelect = document.getElementById("positions")
        const selectedPositions = Array.from(positionsSelect.selectedOptions).map((option) => option.value)

        // Get league filter if available
        const leagueFilter = document.getElementById("youth-league-filter")
        const league = leagueFilter ? leagueFilter.value : null

        // Get display mode
        const displayMode = document.querySelector('input[name="display-mode"]:checked').value

        // Show loading
        document.getElementById("talents-results").innerHTML = '<div class="loading"><div class="spinner"></div></div>'
        document.getElementById("hidden-gems").innerHTML = '<div class="loading"><div class="spinner"></div></div>'

        fetch("/youth_talent_scout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                max_age: Number.parseInt(maxAge),
                positions: selectedPositions,
                min_goals: Number.parseInt(minGoals),
                min_assists: Number.parseInt(minAssists),
                min_predicted_goals: Number.parseInt(minPredictedGoals),
                min_predicted_assists: Number.parseInt(minPredictedAssists),
                sort_by: sortBy,
                sort_ascending: sortBy === "age", // Only age is sorted ascending
                league: league,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    document.getElementById("talents-results").innerHTML = `
                        <div class="alert error">
                            <i class="fas fa-exclamation-circle"></i>
                            <div>${data.error}</div>
                        </div>
                    `
                } else {
                    // Store the talents data in the container's dataset
                    const talentsResults = document.getElementById("talents-results")
                    talentsResults.dataset.talents = JSON.stringify(data.talents)
                    displayTalents(data.talents, displayMode)
                    displayHiddenGems(data.hidden_gems)
                }
            })
            .catch((error) => {
                document.getElementById("talents-results").innerHTML = `
                    <div class="alert error">
                        <i class="fas fa-exclamation-circle"></i>
                        <div>Error finding talents: ${error.message}</div>
                    </div>
                `
            })
    })
  }

  function displayTalents(talents, displayMode) {
    const container = document.getElementById("talents-results")

    if (!talents || talents.length === 0) {
        container.innerHTML = "<p>No talents found matching your criteria.</p>"
        return
    }

    // Remove any remaining duplicates (in case they weren't caught by the backend)
    const uniqueTalents = talents.reduce((acc, current) => {
        const isDuplicate = acc.find(item => 
            item.player === current.player && 
            item.age === current.age && 
            item.Performance_Gls === current.Performance_Gls && 
            item.Performance_Ast === current.Performance_Ast
        );
        if (!isDuplicate) {
            acc.push(current);
        }
        return acc;
    }, []);

    if (displayMode === "table") {
        // Table view
        let html = `<h4>Found ${uniqueTalents.length} Unique Talents</h4>`
        html += "<table>"
        html += `
            <tr>
                <th>Player</th>
                <th>Age</th>
                <th>Team</th>
                <th>Nation</th>
                <th>Position</th>
                <th>Goals</th>
                <th>Assists</th>
                <th>Pred. Goals 2025</th>
                <th>Pred. Assists 2025</th>
            </tr>
        `

        uniqueTalents.forEach((player) => {
            // Get nation flag if available
            const nationFlag = player.nation_img
                ? `<img src="${player.nation_img}" alt="${player.nation} flag" class="nation-flag">`
                : ""

            // Get team logo if available
            const teamLogo = player.team_img
                ? `<img src="${player.team_img}" alt="${player.team} logo" class="team-logo">`
                : ""

            html += `
                <tr>
                    <td>${player.player}</td>
                    <td>${player.age}</td>
                    <td>${teamLogo}${player.team}</td>
                    <td>${nationFlag}${player.nation}</td>
                    <td>${player.pos}</td>
                    <td>${player.Performance_Gls}</td>
                    <td>${player.Performance_Ast}</td>
                    <td>${player.predicted_goals_ensemble_2025 !== undefined ? player.predicted_goals_ensemble_2025.toFixed(1) : "N/A"}</td>
                    <td>${player.predicted_assists_ensemble_2025 !== undefined ? player.predicted_assists_ensemble_2025.toFixed(1) : "N/A"}</td>
                </tr>
            `
        })

        html += "</table>"
        container.innerHTML = html
    } else {
        // Card view
        let html = `<h4>Found ${uniqueTalents.length} Unique Talents</h4>`
        html += '<div class="player-cards-grid">'

        uniqueTalents.forEach((player) => {
            // Get player image if available, otherwise use unknown player image
            const playerImg = player.player_img || '/static/images/unknown-player.svg'

            // Get nation flag if available
            const nationFlag = player.nation_img
                ? `<img src="${player.nation_img}" alt="${player.nation} flag" class="nation-flag">`
                : ""

            // Get team logo if available
            const teamLogo = player.team_img
                ? `<img src="${player.team_img}" alt="${player.team} logo" class="team-logo">`
                : ""

            html += `
                <div class="player-card">
                    <div class="player-card-header">
                        <img src="${playerImg}" alt="${player.player}" class="player-card-image" onerror="this.src='/static/images/unknown-player.svg'">
                        <div class="player-card-info">
                            <h3>${player.player}</h3>
                            <p>${nationFlag}${player.nation} | ${player.age} yrs</p>
                            <p>${teamLogo}${player.team}</p>
                            <p><strong>Position:</strong> ${player.pos}</p>
                        </div>
                    </div>
                    
                    <div class="player-card-stats">
                        <div class="stat-card">
                            <div class="stat-value">${player.Performance_Gls}</div>
                            <div class="stat-label">Goals</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${player.Performance_Ast}</div>
                            <div class="stat-label">Assists</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${player.predicted_goals_ensemble_2025 !== undefined ? player.predicted_goals_ensemble_2025.toFixed(1) : "N/A"}</div>
                            <div class="stat-label">Pred. Goals 2025</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${player.predicted_assists_ensemble_2025 !== undefined ? player.predicted_assists_ensemble_2025.toFixed(1) : "N/A"}</div>
                            <div class="stat-label">Pred. Assists 2025</div>
                        </div>
                    </div>
                </div>
            `
        })

        html += "</div>"
        container.innerHTML = html
    }
  }

  function displayHiddenGems(gems) {
    const container = document.getElementById("hidden-gems")

    if (!gems || gems.length === 0) {
      container.innerHTML = "<p>No hidden gems found matching your criteria.</p>"
      return
    }

    // Remove any remaining duplicates (in case they weren't caught by the backend)
    const uniqueGems = gems.reduce((acc, current) => {
        const isDuplicate = acc.find(item => 
            item.player === current.player && 
            item.age === current.age && 
            item.Performance_Gls === current.Performance_Gls && 
            item.Performance_Ast === current.Performance_Ast
        );
        if (!isDuplicate) {
            acc.push(current);
        }
        return acc;
    }, []);

    let html = `<h4>Found ${uniqueGems.length} Unique Hidden Gems</h4>`
    html += "<table>"
    html += `
      <tr>
        <th>Player</th>
        <th>Age</th>
        <th>Team</th>
        <th>Position</th>
        <th>Current Goals</th>
        <th>Predicted Goals 2025</th>
        <th>Current Assists</th>
        <th>Predicted Assists 2025</th>
      </tr>
    `

    uniqueGems.forEach((player) => {
      // Get nation flag if available
      const nationFlag = player.nation_img
        ? `<img src="${player.nation_img}" alt="${player.nation} flag" class="nation-flag">`
        : ""

      // Get team logo if available
      const teamLogo = player.team_img
        ? `<img src="${player.team_img}" alt="${player.team} logo" class="team-logo">`
        : ""

      html += `
        <tr>
          <td>${player.player}</td>
          <td>${player.age}</td>
          <td>${teamLogo}${player.team}</td>
          <td>${player.pos}</td>
          <td>${player.Performance_Gls}</td>
          <td>${player.predicted_goals_ensemble_2025 !== undefined ? player.predicted_goals_ensemble_2025.toFixed(1) : "N/A"}</td>
          <td>${player.Performance_Ast}</td>
          <td>${player.predicted_assists_ensemble_2025 !== undefined ? player.predicted_assists_ensemble_2025.toFixed(1) : "N/A"}</td>
        </tr>
      `
    })

    html += "</table>"
    container.innerHTML = html
  }

  // Team Chemistry Section
  const teamSelect = document.getElementById("team-select")
  if (teamSelect) {
    teamSelect.addEventListener("change", function () {
      const teamName = this.value
      if (teamName) {
        fetchTeamChemistry(teamName)
      } else {
        document.getElementById("team-chemistry-results").classList.add("hidden")
      }
    })
  }

  function fetchTeamChemistry(teamName) {
    // Show loading
    document.getElementById("team-chemistry-results").classList.remove("hidden")
    document.getElementById("team-players").innerHTML = '<div class="loading"><div class="spinner"></div></div>'

    fetch("/team_chemistry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ team_name: teamName }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("team-players").innerHTML = `
            <div class="alert error">
              <i class="fas fa-exclamation-circle"></i>
              <div>${data.error}</div>
            `
        } else {
          displayTeamPlayers(data.team_players)

          // Render charts
          const nationChart = JSON.parse(data.nation_chart)
          Plotly.newPlot("nation-chart", nationChart.data, nationChart.layout)

          const positionChart = JSON.parse(data.position_chart)
          Plotly.newPlot("position-chart", positionChart.data, positionChart.layout)

          // Display shared nationalities
          displaySharedNationalities(data.shared_nationality_players)

          // Update player compatibility dropdown
          updateCompatibilityPlayerDropdown(data.team_players)
        }
      })
      .catch((error) => {
        document.getElementById("team-players").innerHTML = `
          <div class="alert error">
            <i class="fas fa-exclamation-circle"></i>
            <div>Error loading team chemistry: ${error.message}</div>
          </div>
        `
      })
  }

  function displayTeamPlayers(players) {
    const container = document.getElementById("team-players")

    if (!players || players.length === 0) {
      container.innerHTML = "<p>No players found for this team.</p>"
      return
    }

    let html = "<table>"
    html += `
      <tr>
        <th>Player</th>
        <th>Age</th>
        <th>Position</th>
        <th>Nation</th>
        <th>Goals</th>
        <th>Assists</th>
      </tr>
    `

    players.forEach((player) => {
      // Get player image if available
      const playerImg = player.player_img
        ? `<img src="${player.player_img}" alt="${player.player}" width="30" height="30" style="border-radius: 50%; margin-right: 8px; vertical-align: middle;">`
        : ""

      // Get nation flag if available
      const nationFlag = player.nation_img
        ? `<img src="${player.nation_img}" alt="${player.nation} flag" class="nation-flag">`
        : ""

      html += `
        <tr>
          <td>${playerImg}${player.player}</td>
          <td>${player.age}</td>
          <td>${player.pos}</td>
          <td>${nationFlag}${player.nation}</td>
          <td>${player.Performance_Gls}</td>
          <td>${player.Performance_Ast}</td>
        </tr>
      `
    })

    html += "</table>"
    container.innerHTML = html
  }

  function displaySharedNationalities(sharedNationalities) {
    const container = document.getElementById("shared-nationalities")

    if (!sharedNationalities || Object.keys(sharedNationalities).length === 0) {
      container.innerHTML = "<p>No shared nationalities found in this team.</p>"
      return
    }

    let html = "<ul class='shared-nationalities-list'>"
    for (const [nation, players] of Object.entries(sharedNationalities)) {
      html += `<li><strong>${nation}:</strong> ${players.join(", ")}</li>`
    }
    html += "</ul>"

    container.innerHTML = html
  }

  function updateCompatibilityPlayerDropdown(players) {
    const dropdown = document.getElementById("compatibility-player")

    // Clear existing options
    dropdown.innerHTML = '<option value="">Select a player</option>'

    // Add players to dropdown
    players.forEach((player) => {
      const option = document.createElement("option")
      option.value = player.player
      option.textContent = player.player
      dropdown.appendChild(option)
    })

    // Add event listener
    dropdown.addEventListener("change", function () {
      const playerName = this.value
      if (playerName) {
        const teamName = document.getElementById("team-select").value
        fetchPlayerCompatibility(teamName, playerName)
      } else {
        document.getElementById("player-compatibility").classList.add("hidden")
      }
    })
  }

  function fetchPlayerCompatibility(teamName, playerName) {
    fetch("/team_chemistry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        team_name: teamName,
        player_name: playerName,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          document.getElementById("player-compatibility").classList.add("hidden")
          alert(data.error)
        } else if (data.player_compatibility) {
          displayPlayerCompatibility(playerName, data.player_compatibility)
        }
      })
      .catch((error) => {
        document.getElementById("player-compatibility").classList.add("hidden")
        alert(`Error: ${error.message}`)
      })
  }

  function displayPlayerCompatibility(playerName, compatibilityData) {
    document.getElementById("player-compatibility").classList.remove("hidden")
    document.getElementById("compatibility-player-name").textContent = playerName

    // Nationality compatibility
    const nationalityContainer = document.getElementById("nationality-compatibility")
    if (compatibilityData.same_nation_teammates && compatibilityData.same_nation_teammates.length > 0) {
      nationalityContainer.innerHTML = `<p>Shares nationality with: ${compatibilityData.same_nation_teammates.join(", ")}</p>`
    } else {
      nationalityContainer.innerHTML = "<p>No teammates share the same nationality.</p>"
    }

    // Position compatibility
    const positionContainer = document.getElementById("position-compatibility")
    if (compatibilityData.complementary_players && compatibilityData.complementary_players.length > 0) {
      positionContainer.innerHTML = `<p>Has good position chemistry with: ${compatibilityData.complementary_players.join(", ")}</p>`
    } else {
      positionContainer.innerHTML = "<p>No teammates with strong positional chemistry found.</p>"
    }

    // Potential targets
    const targetsContainer = document.getElementById("potential-targets")
    if (compatibilityData.potential_targets && compatibilityData.potential_targets.length > 0) {
      let html = "<table>"
      html += `
        <tr>
          <th>Player</th>
          <th>Age</th>
          <th>Team</th>
          <th>Position</th>
          <th>Goals</th>
          <th>Assists</th>
        </tr>
      `

      compatibilityData.potential_targets.forEach((player) => {
        // Get player image if available
        const playerImg = player.player_img
          ? `<img src="${player.player_img}" alt="${player.player}" width="30" height="30" style="border-radius: 50%; margin-right: 8px; vertical-align: middle;">`
          : ""

        // Get nation flag if available
        const nationFlag = player.nation_img
          ? `<img src="${player.nation_img}" alt="${player.nation} flag" class="nation-flag">`
          : ""

        // Get team logo if available
        const teamLogo = player.team_img
          ? `<img src="${player.team_img}" alt="${player.team} logo" class="team-logo">`
          : ""

        html += `
          <tr>
            <td>${playerImg}${player.player}</td>
            <td>${player.age}</td>
            <td>${teamLogo}${player.team}</td>
            <td>${player.pos}</td>
            <td>${player.Performance_Gls}</td>
            <td>${player.Performance_Ast}</td>
          </tr>
        `
      })

      html += "</table>"
      targetsContainer.innerHTML = html
    } else {
      targetsContainer.innerHTML = "<p>No potential targets found with good chemistry.</p>"
    }
  }

  // Handle flash messages
  const flashMessages = document.querySelectorAll(".alert, .flash-message"); // Select both old and new classes
  flashMessages.forEach((message) => {
    const closeBtn = message.querySelector(".close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        message.style.opacity = "0";
        message.style.transition = "opacity 0.5s ease-out";
        setTimeout(() => {
          message.remove();
        }, 500); // Wait for transition to finish before removing
      });
    }
  });

  // Call functions on page load
  // ... existing code ...

  // Market Value Range Sliders
  const marketValueMinRange = document.getElementById('market-value-min-range');
  const marketValueMaxRange = document.getElementById('market-value-max-range');
  const marketValueMinDisplay = document.getElementById('market-value-min');
  const marketValueMaxDisplay = document.getElementById('market-value-max');

  if (marketValueMinRange && marketValueMaxRange) {
      // Update min range when max range changes
      marketValueMaxRange.addEventListener('input', function() {
          const maxValue = parseFloat(this.value);
          const minValue = parseFloat(marketValueMinRange.value);
          
          if (maxValue < minValue) {
              marketValueMinRange.value = maxValue;
              marketValueMinDisplay.textContent = maxValue;
          }
          
          marketValueMaxDisplay.textContent = maxValue;
      });

      // Update max range when min range changes
      marketValueMinRange.addEventListener('input', function() {
          const minValue = parseFloat(this.value);
          const maxValue = parseFloat(marketValueMaxRange.value);
          
          if (minValue > maxValue) {
              marketValueMaxRange.value = minValue;
              marketValueMaxDisplay.textContent = minValue;
          }
          
          marketValueMinDisplay.textContent = minValue;
      });
  }

  // ... existing code ...
})
