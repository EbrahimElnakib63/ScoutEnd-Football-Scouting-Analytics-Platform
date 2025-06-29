/*****************************************************************************
                    Load-Read -> CsvFile
******************************************************************************/
let countryMapping = {};
// Load country mapping JSON
async function loadCountryMapping() {
    try {
        const response = await fetch("/static/data/countries.json");
        if (!response.ok) throw new Error("Error loading country mapping");
        countryMapping = await response.json();
    } catch (error) {
        console.error("Error loading country mapping:", error);
    }
}
// Extract player details from the URL query parameters
function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        playerName: urlParams.get('player'), // Get the player name from the URL
        season: urlParams.get('season')      // Get the season if provided
    };
}
// Load the CSV data and filter by season
async function loadCSVData(season) {
    try {
        showLoading();
        const response = await fetch('/static/data/FBREF_FIFA_Merged.csv');
        if (!response.ok) throw new Error("Failed to fetch CSV data");
        const csvData = await response.text();
        const parsedData = Papa.parse(csvData, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        }).data;
        if (season) {
            return parsedData.filter(row => row.season == season);
        }
        return parsedData;
    } catch (error) {
        console.error('Error loading CSV data:', error);
        alert("Failed to load data. Please try again later.");
        return [];
    } finally {
        hideLoading();
    }
}
// Load player data based on the extracted parameters
async function loadPlayerDetails() {
    const { playerName, season } = getQueryParams();
    if (!playerName) {
        console.error('No player name provided in the URL.');
        return;
    }
    // Load all players data (for historical performance)
    const allPlayers = await loadCSVData(); // Load all data (no season filter)
    // Load filtered players data (for main player details)
    const filteredPlayers = await loadCSVData(season); // Filter by selected season
    console.log("All Players Data (For Historical Performance):", allPlayers);
    console.log("Filtered Players Data (For Main Details):", filteredPlayers);
    // Find the player in the filtered dataset (for main details)
    const player = filteredPlayers.find(p => p.player.toLowerCase() === playerName.toLowerCase());
    // Debug: Log the player being searched for
    console.log("Searching for Player:", playerName);
    console.log("Player Found:", player);
    if (player) {
        // Display main player details using filtered data (for the selected season)
        await displayPlayerDetails(player, season, allPlayers); // Pass allPlayers for historical performance
    } else {
        console.error('Player not found in the dataset.');
        document.getElementById('playerName').textContent = 'Player Not Found';
    }
}
/*****************************************************************************
                    Load-Read -> CsvFile
******************************************************************************/
/*****************************************************************************
                    Diplay_Data-Table
******************************************************************************/
// Display player details on the page
async function displayPlayerDetails(player, season, allPlayers) {
    // Ensure country mapping is loaded
    if (Object.keys(countryMapping).length === 0) {
        await loadCountryMapping();
    }
    const seasonElement = document.getElementById('playerSeason');
    if (seasonElement) {
        // const formattedSeason = `${season.slice(0, 2)}/${season.slice(2)}`;
        seasonElement.textContent = `${season}`;
    } else {
        console.error("Element with ID 'playerSeason' not found.");
    }
    // Display basic player information
    document.getElementById('playerName').textContent = player.player;
    const leagueLogoPath = `/static/imgs/leagues/${encodeURIComponent(player.league.toLowerCase())}.png`;
    const teamLogoPath = `/static/imgs/logos/${encodeURIComponent(player.team.toLowerCase())}.webp`;
    const leagueElement = document.getElementById('playerLeague');
    if (leagueElement) {
        leagueElement.innerHTML = `
            <img src="${leagueLogoPath}" alt="${player.league} Logo">`;
    } else {
        console.error("Element with ID 'playerLeague' not found.");
    }
    // Display team logo
    const teamElement = document.getElementById('playerTeam');
    if (teamElement) {
        teamElement.innerHTML = `
            <img src="${teamLogoPath}" alt="${player.team} Logo">`;
    } else {
        console.error("Element with ID 'playerTeam' not found.");
    }
    // Set player image
    const playerImage = document.getElementById('playerImage');
    if (playerImage) {
        playerImage.src = `${player.player_img}`;
        playerImage.alt = `${player.player} Image`;
    } else {
        console.error("Element with ID 'playerImage' not found.");
    }
    // Display main statistics
    const mainStats = [
        { name: "Pace", value: `${player.pace} <span style='color: gray; font-size:15px; margin-left:5px'>Km/h</span>` },
        { name: "Shooting", value: `${player['Standard_SoT%']} <span style='color: gray; font-size:15px; margin-left:5px'>%</span>` },
        { name: "Passing", value: `${player['Total_Cmp%']} <span style='color: gray; font-size:15px; margin-left:5px'>%</span>` },
    ];
    const mainStatsContainer = document.querySelector(".main-stats");
    if (mainStatsContainer) {
        mainStatsContainer.innerHTML = mainStats.map(stat => `
            <div class="stat-item">
                <div class="stat-name">${stat.name}</div>
                <div class="stat-value">${stat.value}</div>
                <div class="stat-bar">
                    <div class="stat-bar-fill" style="width: ${parseFloat(stat.value) || 0}%"></div>
                </div>
            </div>`).join('');
    } else {
        console.error("Element with class 'main-stats' not found.");
    }

    // Right-Side
    // Inside your displayPlayerDetails function, after setting other player details:
    document.getElementById('playerGoals').textContent = player.Performance_Gls || '0';
    document.getElementById('playerAssists').textContent = player.Performance_Ast || '0';
    document.getElementById('playerMarketValue').textContent = player.market_value ? `${player.market_value} €` : 'N/A';
    document.getElementById('playerBestPosition').textContent = player.best_position || 'N/A';
    // Display detailed statistics
    const detailedStats = [
        { type: "header", name: "Personal Information" },
        { name: "Nationality", value: `<div id="playerNationality"><img style="width: 40px; height: 40px; object-fit:contain" src="${player.nation_img}" alt="${player.nation}"> ${player.nation}</div>` },
        { name: "Height <span id='AddedValue'>(cm)</span>", value: player.height_cm },
        { name: "Weight <span id='AddedValue'>(kg)</span>", value: player.weight_kg },
        { name: "Preferred Foot", value: player.foot },
        { name: "Date Of Birth", value: `${player.born} (${player.age})` },
        { name: "All Positions", value: player.All_Positions === player.best_position ? player.All_Positions : `${player.All_Positions}` || "N/A" },

        { type: "header", name: "Attack" },
        { name: "Goals per Match", value: player['Playing Time_MP'] ? (player.Performance_Gls / player['Playing Time_MP']).toFixed(2) : "N/A" },
        { name: "Penalties <span id='AddedValue'>(Scored)</span>", value: `${player.Standard_PKatt} <span id='AddedValue'>(${player.Standard_PK})</span>` },
        { name: "Free Kicks", value: player.Standard_FK },
        { name: "Shots <span id='AddedValue'>(on Target)</span>", value: `${player.Standard_Sh} <span id='AddedValue'>(${player.Standard_SoT})</span>` },

        { type: "header", name: "Team Play" },
        { name: "Appearances <span id='AddedValue'>(Subs)</span>", value: `${player['Playing Time_MP']} <span id='AddedValue'>(${player['Playing Time_MP'] - player['Playing Time_Starts']})</span>` },
        { name: "Assists per Match", value: player['Playing Time_MP'] ? (player.Performance_Ast / player['Playing Time_MP']).toFixed(2) : "N/A" },
        { name: "Passes <span id='AddedValue'>(Completed)</span>", value: `${player.Total_Att} <span id='AddedValue'>(${player.Total_Cmp})</span>` },
        { name: "Touches <span id='AddedValue'>(on Area)</span>", value: player['Touches_Att Pen'] },
        { name: "Key Passes", value: player.KP },

        { type: "header", name: "Performance" },
        { name: "Minutes Played", value: player.Playing_Time_Min },
        { name: "Expected Goals (xG)", value: player.Expected_xG },
        { name: "Expected Assists (xA)", value: player.Expected_xAG },
        { name: "xG+xAG", value: player['Expected_npxG+xAG'] },

        { type: "header", name: "Discipline" },
        { name: "Yellow Cards", value: player['Performance_CrdY'] },
        { name: "Red Cards", value: player['Performance_CrdR'] },
    ];
    const detailedStatsContainer = document.querySelector(".detailed-stats");
    if (detailedStatsContainer) {
        detailedStatsContainer.innerHTML = '';
        let currentGroup = null;
        detailedStats.forEach(stat => {
            if (stat.type === "header") {
                // Close the previous group if it exists
                if (currentGroup) {
                    detailedStatsContainer.appendChild(currentGroup);
                }
                // Create a new group for the header and its stats
                currentGroup = document.createElement('div');
                currentGroup.className = 'stats-group';
                // Add the header
                const headerElement = document.createElement('div');
                headerElement.className = 'detailed-stat-header';
                headerElement.innerHTML = `<h3>${stat.name}</h3>`;
                currentGroup.appendChild(headerElement);
            } else {
                // Add the stat to the current group
                const statElement = document.createElement('div');
                statElement.className = 'detailed-stat-item';
                statElement.innerHTML = `
                    <span class="detailed-stat-name">${stat.name}</span>
                    <span class="detailed-stat-value">${stat.value}</span>`;
                currentGroup.appendChild(statElement);
            }
        });
        // Append the last group
        if (currentGroup) {
            detailedStatsContainer.appendChild(currentGroup);
        }
    } else {
        console.error("Element with class 'detailed-stats' not found.");
    }
    // Create the spider chart
    createSpiderChart(player);
    createTouchesBarChart(player);
    // Display historical performance using all seasons
    displayHistoricalPerformance(player, allPlayers);
    // Generate AI player report
    generateAIPlayerReport(player, allPlayers);
}
/*****************************************************************************
                    Diplay_Data-Table
******************************************************************************/
/*****************************************************************************
                    Charts , Historical Performance
******************************************************************************/
// Create a spider chart for player performance stats
function createSpiderChart(player) {
    console.log("Player Data for Spider Chart:", player);
    // Check if the required fields exist in the player object
    const requiredFields = ['Total_Cmp%', 'Standard_SoT%', 'Short_Cmp%', 'Medium_Cmp%', 'Long_Cmp%', 'Challenges_Tkl%', 'Playing Time_Min%'];
    requiredFields.forEach(field => {
        if (!(field in player)) {
            console.error(`Missing field in player data: ${field}`);
        }
    });
    const ctx = document.getElementById('player-spider-chart').getContext('2d');
    const stats = {
        Passing: parseFloat(player['Total_Cmp%']) || 0,
        Shooting: parseFloat(player['Standard_SoT%']) || 0,
        Short_Passes: parseFloat(player['Short_Cmp%']) || 0,
        Medium_Passes: parseFloat(player['Medium_Cmp%']) || 0,
        Long_Passes: parseFloat(player['Long_Cmp%']) || 0,
        Challenges: parseFloat(player['Challenges_Tkl%']) || 0,
        Playing_Time: parseFloat(player['Playing Time_Min%']) || 0,
    };
    console.log("Chart Stats:", stats);
    const data = {
        labels: ['Passing', 'Short_Passes', 'Medium_Passes', 'Long_Passes', 'Shooting', 'Challenges', 'Playing_Time'],
        datasets: [{
            label: `${player.player} - Performance Stats`,
            data: Object.values(stats),
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        }]
    };
    const options = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: '#e0e0e0'
                }
            }
        },
        scales: {
            r: {
                angleLines: {
                    color: '#555'
                },
                grid: {
                    color: '#555'
                },
                pointLabels: {
                    color: '#e0e0e0'
                },
                ticks: {
                    color: '#e0e0e0',
                    backdropColor: 'transparent'
                }
            }
        }
    };
    if (window.playerSpiderChart) window.playerSpiderChart.destroy();
    window.playerSpiderChart = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: options
    });
}
// Generate radio buttons for selecting features in the line chart
function generateRadioButtonsFromTable() {
    const table = document.querySelector('#historical-performance-container table');
    if (!table) {
        console.error("Table not found!");
        return;
    }
    const headerCells = table.querySelectorAll('thead th');
    const container = document.getElementById('radio-buttons-container');
    container.innerHTML = '';
    headerCells.forEach((header) => {
        const feature = header.textContent.trim();
        if (feature === "Season" || feature === "Team") return;
        const input = document.createElement('input');
        input.type = 'radio';
        input.id = feature.toLowerCase().replace(/\s+/g, '-');
        input.name = 'feature';
        input.value = feature;
        const label = document.createElement('label');
        label.setAttribute('for', input.id);
        label.textContent = feature;
        const radioContainer = document.createElement('div');
        radioContainer.classList.add('radio-container');
        radioContainer.appendChild(input);
        radioContainer.appendChild(label);
        container.appendChild(radioContainer);
    });
}
async function displayHistoricalPerformance(player, allPlayers) {
    console.log("Player Data for Historical Performance:", player);
    console.log("All Players Data:", allPlayers);
    const historicalStatsContainer = document.createElement("div");
    historicalStatsContainer.classList.add("historical-stats-container");
    const table = document.createElement("table");
    table.classList.add("historical-stats-table");
    const tableHeader = `
        <thead>
            <tr>
                <th>Season</th>
                <th>Team</th>
                <th>Appearances</th>
                <th>Goals</th>
                <th>Assists</th>
                <th>Passes</th>
                <th>Key_Passes</th>
                <th>Minutes Played</th>
                <th>xG</th>
                <th>Market Value(m)</th>
            </tr>
        </thead>
    `;
    table.innerHTML = tableHeader;
    const tableBody = document.createElement("tbody");
    // Get all the unique seasons for the player from the data and sort them in ascending order
    const playerSeasons = [...new Set(allPlayers.filter(p => p.player === player.player).map(p => p.season))];
    playerSeasons.sort((a, b) => String(a).localeCompare(String(b)));  // Sort seasons in ascending order
    console.log("Player Seasons:", playerSeasons);
    // Prepare the chart data
    const chartData = {
        labels: playerSeasons,
        teams: [],
        appearances: [],
        goals: [],
        assists: [],
        passes: [],
        key_passes: [],
        minutesPlayed: [],
        xG: [],
        market_values: [],
    };
    playerSeasons.forEach((season) => {
        const playerStats = allPlayers.find(
            (p) => p.player === player.player && p.season === season
        );
        if (playerStats) {
            console.log(`Player Stats for Season ${season}:`, playerStats);
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${season}</td>
                <td>${playerStats.team}</td>
                <td>${playerStats['Playing Time_MP']}</td>
                <td>${playerStats.Performance_Gls}</td>
                <td>${playerStats.Performance_Ast}</td>
                <td>${playerStats.Total_Att}</td>
                <td>${playerStats.KP}</td>
                <td>${playerStats.Playing_Time_Min}</td>
                <td>${playerStats.Expected_xG}</td>
                <td>${playerStats.market_value}</td>
            `;
            tableBody.appendChild(row);
            // Collect data for chart, including appearances
            chartData.teams.push(playerStats.team || "N/A"); // Add team name
            chartData.appearances.push(playerStats['Playing Time_MP'] || 0);
            chartData.goals.push(playerStats.Performance_Gls || 0);
            chartData.assists.push(playerStats.Performance_Ast || 0);
            chartData.passes.push(playerStats.Total_Att || 0);
            chartData.key_passes.push(playerStats.KP || 0);
            chartData.minutesPlayed.push(playerStats.Playing_Time_Min || 0);
            chartData.xG.push(playerStats.Expected_xG || 0);
            chartData.market_values.push(playerStats.market_value);
        }
    });
    table.appendChild(tableBody);
    historicalStatsContainer.appendChild(table);
    document.getElementById("historical-performance-container").appendChild(historicalStatsContainer);
    // Generate radio buttons based on table headers
    generateRadioButtonsFromTable();
    // Load team logos and wait for them to load
    const teamLogos = await loadTeamLogos(chartData.teams);
    // Initialize the chart with "Goals" as the default feature
    renderLineChart(chartData, "Goals", teamLogos);
    // Add event listener for radio button selection
    document.querySelectorAll("input[name='feature']").forEach((radio) => {
        radio.addEventListener("change", (e) => {
            const selectedFeature = e.target.value;
            renderLineChart(chartData, selectedFeature, teamLogos);
        });
    });
}
function loadTeamLogos(teams) {
    const logos = {};
    const logoPromises = teams.map(team => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = `/static/imgs/logos/${team.toLowerCase()}.webp`; // Adjust the path as needed
            img.onload = () => {
                const resizedLogo = resizeLogo(img, 50, 50);
                logos[team] = resizedLogo;
                resolve();
            };
            img.onerror = () => {
                console.error(`Failed to load logo for team: ${team}`);
                resolve(); // Resolve even if the logo fails to load
            };
        });
    });
    // Wait for all logos to load
    return Promise.all(logoPromises).then(() => logos);
}
function resizeLogo(image, targetWidth, targetHeight) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // Calculate the aspect ratio of the image
    const imageAspectRatio = image.width / image.height;
    const targetAspectRatio = targetWidth / targetHeight;
    let drawWidth, drawHeight, offsetX, offsetY;
    // Maintain aspect ratio (object-fit: contain behavior)
    if (imageAspectRatio > targetAspectRatio) {
        // Image is wider than the target area
        drawWidth = targetWidth;
        drawHeight = targetWidth / imageAspectRatio;
        offsetX = 0;
        offsetY = (targetHeight - drawHeight) / 2;
    } else {
        // Image is taller than the target area
        drawHeight = targetHeight;
        drawWidth = targetHeight * imageAspectRatio;
        offsetX = (targetWidth - drawWidth) / 2;
        offsetY = 0;
    }
    // Set canvas dimensions to the target size
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    // Draw the image onto the canvas, maintaining aspect ratio
    ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    // Convert the canvas to an image
    const resizedImage = new Image();
    resizedImage.src = canvas.toDataURL(); // Convert canvas to data URL
    return resizedImage;
}
// Render the line chart for historical performance
function renderLineChart(chartData, feature, teamLogos) {
    console.log("Chart Data for Line Chart:", chartData);
    console.log("Selected Feature:", feature);
    const featureDataMap = {
        Appearances: chartData.appearances,
        Goals: chartData.goals,
        Assists: chartData.assists,
        "Minutes Played": chartData.minutesPlayed,
        xG: chartData.xG,
        Passes: chartData.passes,
        Key_Passes: chartData.key_passes,
        "Market Value(m)": chartData.market_values,
    };
    const ctx = document.getElementById('line-chart').getContext('2d');
    if (window.lineChart) {
        window.lineChart.destroy();
    }
    window.lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: feature,
                data: featureDataMap[feature],
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                pointStyle: chartData.teams.map(team => teamLogos[team]),
                pointRadius: 5,
                pointHoverRadius: 7,
                borderWidth: 1,
                fill: true,
            }]
        },
        plugins: {
            filler: {
                propagate: true
            },
            legend: {
                labels: {
                    color: '#e0e0e0'
                }
            }
        },
        elements: {
            line: {
                tension: 0.5
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#555'
                }
            },
            x: {
                grid: {
                    color: '#555'
                }
            },
        },
        options: {
            elements: {
                line: {
                    tension: 0.5
                }
            }
        }
    });
}
function createTouchesBarChart(player) {
    const ctx = document.getElementById('touches-bar-chart').getContext('2d');
    const data = {
        labels: ['Def Pen', 'Def 3rd', 'Mid 3rd', 'Att 3rd', 'Att Pen'],
        datasets: [{
            label: 'Touches by Area',
            data: [
                player['Touches_Def Pen'] || 0,
                player['Touches_Def 3rd'] || 0,
                player['Touches_Mid 3rd'] || 0,
                player['Touches_Att 3rd'] || 0,
                player['Touches_Att Pen'] || 0,
            ],
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
        }]
    };

    // Chart options (same as before)
    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: false // We'll use our custom heatmap instead
            }
        },
        // ... rest of your chart options
    };

    new Chart(ctx, {
        type: 'bar',
        data: data,
        options: options
    });

    // Create football pitch heatmap
    createPitchHeatmap();
}

function createPitchHeatmap() {
    const container = document.getElementById('pitch-heatmap');
    container.innerHTML = '';

    // Create canvas for the pitch
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');

    // Draw football pitch
    drawPitch(ctx, canvas.width, canvas.height);

    // Define zones with their colors and positions
    const zones = [
        {
            name: 'Def Pen',
            description: 'Defensive Penalty Area',
            color: 'rgba(255, 99, 132, 0.5)',
            coords: { x1: 0.05, y1: 0.25, x2: 0.15, y2: 0.75 }
        },
        {
            name: 'Def 3rd',
            description: 'Defensive Third',
            color: 'rgba(54, 162, 235, 0.5)',
            coords: { x1: 0.15, y1: 0, x2: 0.35, y2: 1 }
        },
        {
            name: 'Mid 3rd',
            description: 'Middle Third',
            color: 'rgba(75, 192, 192, 0.5)',
            coords: { x1: 0.35, y1: 0, x2: 0.65, y2: 1 }
        },
        {
            name: 'Att 3rd',
            description: 'Attacking Third',
            color: 'rgba(153, 102, 255, 0.5)',
            coords: { x1: 0.65, y1: 0, x2: 0.85, y2: 1 }
        },
        {
            name: 'Att Pen',
            description: 'Attacking Penalty Area',
            color: 'rgba(255, 159, 64, 0.5)',
            coords: { x1: 0.85, y1: 0.25, x2: 0.95, y2: 0.75 }
        }
    ];

    // Draw zones
    zones.forEach(zone => {
        const x1 = zone.coords.x1 * canvas.width;
        const y1 = zone.coords.y1 * canvas.height;
        const x2 = zone.coords.x2 * canvas.width;
        const y2 = zone.coords.y2 * canvas.height;

        // Draw zone
        ctx.fillStyle = zone.color;
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

        // Add label
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, (x1 + x2) / 2, (y1 + y2) / 2);
    });

    // Add legend
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.flexWrap = 'wrap';
    legend.style.justifyContent = 'center';
    legend.style.marginTop = '10px';

    zones.forEach(zone => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.margin = '5px 10px';

        const colorBox = document.createElement('div');
        colorBox.style.width = '20px';
        colorBox.style.height = '20px';
        colorBox.style.backgroundColor = zone.color;
        colorBox.style.marginRight = '5px';
        colorBox.style.border = '1px solid #fff';

        const text = document.createElement('span');
        text.style.color = '#e0e0e0';
        text.textContent = zone.description;

        item.appendChild(colorBox);
        item.appendChild(text);
        legend.appendChild(item);
    });

    container.appendChild(legend);
}

function drawPitch(ctx, width, height) {
    // Pitch background
    ctx.fillStyle = '#2a5c2a';
    ctx.fillRect(0, 0, width, height);

    // Outline
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 10);
    ctx.lineTo(width / 2, height - 10);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas (simplified)
    ctx.strokeRect(10, height / 2 - 70, 100, 140); // Left penalty area
    ctx.strokeRect(width - 110, height / 2 - 70, 100, 140); // Right penalty area

    // Small penalty areas
    ctx.strokeRect(10, height / 2 - 30, 40, 60); // Left small area
    ctx.strokeRect(width - 50, height / 2 - 30, 40, 60); // Right small area
}

/*****************************************************************************
                    AI Player Report Generation
******************************************************************************/
// Enhanced AI Player Report Generation with position-based analysis
async function generateAIPlayerReport(player, allPlayers) {
    try {
        showLoading();

        // Get all seasons for this player
        const playerSeasons = [...new Set(allPlayers.filter((p) => p.player === player.player).map((p) => p.season))];
        playerSeasons.sort((a, b) => String(a).localeCompare(String(b)));

        // Get current season stats
        const currentSeason = player.season;
        const currentStats = allPlayers.find((p) => p.player === player.player && p.season === currentSeason);

        // Get previous season stats if available
        const prevSeasonIndex = playerSeasons.indexOf(currentSeason) - 1;
        const prevSeason = prevSeasonIndex >= 0 ? playerSeasons[prevSeasonIndex] : null;
        const prevStats = prevSeason ? allPlayers.find((p) => p.player === player.player && p.season === prevSeason) : null;

        // Calculate performance metrics
        const goalsPerMatch = currentStats["Playing Time_MP"]
            ? (currentStats.Performance_Gls / currentStats["Playing Time_MP"]).toFixed(2)
            : 0;
        const assistsPerMatch = currentStats["Playing Time_MP"]
            ? (currentStats.Performance_Ast / currentStats["Playing Time_MP"]).toFixed(2)
            : 0;
        const passAccuracy = currentStats["Total_Cmp%"] || 0;
        const shotAccuracy = currentStats["Standard_SoT%"] || 0;
        const minutesPerGoal =
            currentStats.Performance_Gls > 0
                ? (currentStats.Playing_Time_Min / currentStats.Performance_Gls).toFixed(0)
                : "N/A";
        const xGDifference = (currentStats.Performance_Gls - currentStats.Expected_xG).toFixed(2);
        const xADifference = (currentStats.Performance_Ast - currentStats.Expected_xAG).toFixed(2);

        // Generate the report
        let report = `
          <div class="ai-report-card">
            <div class="report-section report-overview">
              <h3><i class="fas fa-chart-line"></i> Performance Overview</h3>
              <p>${player.player} is a ${getPlayerAgeCategory(player.age)} ${player.best_position || "versatile"} player currently playing for ${player.team} in the ${player.league}. 
              In the ${currentSeason} season, ${player.player.split(" ")[0]} has demonstrated ${getPerformanceAdjective(goalsPerMatch, assistsPerMatch)} performance with 
              ${currentStats.Performance_Gls || 0} goals and ${currentStats.Performance_Ast || 0} assists in ${currentStats["Playing Time_MP"] || 0} appearances.</p>
              
              <p>With a market value of ${player.market_value || "undisclosed"}, ${player.player.split(" ")[0]} 
              ${getValueAssessment(player.market_value, player.age, currentStats.Performance_Gls, currentStats.Performance_Ast)}</p>
            </div>
            
            <div class="report-section report-stats">
              <h3><i class="fas fa-calculator"></i> Advanced Statistics</h3>
              ${generatePositionBasedAdvancedStats(currentStats, player)}
            </div>
        `;

        // Add comparison if previous season data exists
        if (prevStats) {
            const prevGoals = prevStats.Performance_Gls || 0;
            const prevAssists = prevStats.Performance_Ast || 0;
            const prevPassAccuracy = prevStats["Total_Cmp%"] || 0;
            const prevShotAccuracy = prevStats["Standard_SoT%"] || 0;

            const goalsChange = currentStats.Performance_Gls - prevGoals;
            const assistsChange = currentStats.Performance_Ast - prevAssists;
            const passAccuracyChange = passAccuracy - prevPassAccuracy;
            const shotAccuracyChange = shotAccuracy - prevShotAccuracy;

            report += `
            <div class="report-section report-comparison">
              <h3><i class="fas fa-exchange-alt"></i> Season Comparison (vs ${prevSeason})</h3>
              <div class="comparison-grid">
                <div class="comparison-item">
                  <div class="comparison-label">Goals</div>
                  <div class="comparison-values">
                    <span class="prev-value">${prevGoals}</span>
                    <span class="arrow">${getChangeArrow(goalsChange)}</span>
                    <span class="current-value">${currentStats.Performance_Gls || 0}</span>
                  </div>
                  <div class="comparison-change ${getChangeClass(goalsChange)}">
                    ${getChangeText(goalsChange)}
                  </div>
                </div>
                <div class="comparison-item">
                  <div class="comparison-label">Assists</div>
                  <div class="comparison-values">
                    <span class="prev-value">${prevAssists}</span>
                    <span class="arrow">${getChangeArrow(assistsChange)}</span>
                    <span class="current-value">${currentStats.Performance_Ast || 0}</span>
                  </div>
                  <div class="comparison-change ${getChangeClass(assistsChange)}">
                    ${getChangeText(assistsChange)}
                  </div>
                </div>
                <div class="comparison-item">
                  <div class="comparison-label">Pass Accuracy</div>
                  <div class="comparison-values">
                    <span class="prev-value">${prevPassAccuracy}%</span>
                    <span class="arrow">${getChangeArrow(passAccuracyChange)}</span>
                    <span class="current-value">${passAccuracy}%</span>
                  </div>
                  <div class="comparison-change ${getChangeClass(passAccuracyChange)}">
                    ${getChangeText(passAccuracyChange, true)}%
                  </div>
                </div>
                <div class="comparison-item">
                  <div class="comparison-label">Shot Accuracy</div>
                  <div class="comparison-values">
                    <span class="prev-value">${prevShotAccuracy}%</span>
                    <span class="arrow">${getChangeArrow(shotAccuracyChange)}</span>
                    <span class="current-value">${shotAccuracy}%</span>
                  </div>
                  <div class="comparison-change ${getChangeClass(shotAccuracyChange)}">
                    ${getChangeText(shotAccuracyChange, true)}%
                  </div>
                </div>
              </div>
              <div class="season-trend-analysis">
                <h4>Trend Analysis</h4>
                <p>${generateTrendAnalysis(player.player.split(" ")[0], goalsChange, assistsChange, passAccuracyChange, shotAccuracyChange)}</p>
              </div>
            </div>
          `;
        }

        // Add position-based strengths and weaknesses analysis
        report += generatePositionBasedStrengthsWeaknessesAnalysis(currentStats, player);

        // Add the strength vs weakness comparison
        report += generateStrengthWeaknessComparison(currentStats, player);

        // Add tactical analysis
        report += generateTacticalAnalysis(currentStats, player);

        // Add potential and future outlook
        report += generateFutureOutlook(player, currentStats, allPlayers);

        // Close the report card div
        report += `</div>`;

        document.getElementById("aiPlayerReport").innerHTML = report;
    } catch (error) {
        console.error("Error generating AI report:", error);
        document.getElementById("aiPlayerReport").innerHTML = `
          <p class="error-message">We couldn't generate the AI report at this time. Please try again later.</p>
        `;
    } finally {
        hideLoading();
    }
}

// Generate position-based advanced stats with enhanced metrics
function generatePositionBasedAdvancedStats(stats, player) {
    // Get the player's position
    const position = player.best_position || player.pos || player.All_Positions || "";

    // Define position categories
    const isForward =
        position.includes("FW") ||
        position.includes("ST") ||
        position.includes("CF") ||
        position.includes("LW") ||
        position.includes("RW");
    const isMidfielder =
        position.includes("MF") ||
        position.includes("CM") ||
        position.includes("CDM") ||
        position.includes("CAM") ||
        position.includes("LM") ||
        position.includes("RM");
    const isDefender =
        position.includes("DF") || position.includes("CB") || position.includes("LB") || position.includes("RB");
    const isGoalkeeper = position.includes("GK");

    // Position-specific metrics
    let statsHTML = '<div class="stats-grid">';

    if (isDefender) {
        // Defender-specific stats - organized by categories
        statsHTML += `
            <div class="stats-category">
                <h4>Defensive Actions</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Tackles_Tkl"] || 0}</div>
                        <div class="stat-label">Tackles</div>
                        ${getPerformanceIndicator(stats["Tackles_Tkl"] || 0, 3, 2, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Tackles_TklW"] || 0}</div>
                        <div class="stat-label">Tackles Won</div>
                        ${getPerformanceIndicator(stats["Tackles_TklW"] || 0, 2.5, 1.5, 0.8)}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Int"] || 0}</div>
                        <div class="stat-label">Interceptions</div>
                        ${getPerformanceIndicator(stats["Int"] || 0, 2, 1.5, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Blocks_Blocks"] || 0}</div>
                        <div class="stat-label">Blocks</div>
                        ${getPerformanceIndicator(stats["Blocks_Blocks"] || 0, 2, 1.2, 0.5)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Clr"] || 0}</div>
                        <div class="stat-label">Clearances</div>
                        ${getPerformanceIndicator(stats["Clr"] || 0, 4, 2.5, 1.5)}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${(stats["Tkl+Int"] || (stats["Tackles_Tkl"] || 0) + (stats["Int"] || 0))}</div>
                        <div class="stat-label">Total Def. Actions</div>
                        ${getPerformanceIndicator((stats["Tkl+Int"] || (stats["Tackles_Tkl"] || 0) + (stats["Int"] || 0)), 5, 3, 2)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Err"] || 0}</div>
                        <div class="stat-label">Errors</div>
                        ${getPerformanceIndicator(stats["Err"] || 0, 0, 1, 2, true)}
                    </div>
                </div>
            </div>
            
            <div class="stats-category">
                <h4>Duels & Physical</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Challenges_Tkl%"] || 0}%</div>
                        <div class="stat-label">Tackle Success %</div>
                        ${getPerformanceIndicator(stats["Challenges_Tkl%"] || 0, 65, 55, 45)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Touches_Def Pen"] || 0}</div>
                        <div class="stat-label">Touches in Box</div>
                        ${getPerformanceIndicator(stats["Touches_Def Pen"] || 0, 5, 3, 1)}
                    </div>
                </div>
            </div>
            
            <div class="stats-category">
                <h4>Build-Up Play</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Total_Cmp%"] || 0}%</div>
                        <div class="stat-label">Pass Accuracy</div>
                        ${getPerformanceIndicator(stats["Total_Cmp%"] || 0, 85, 75, 65)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Progression_PrgP"] || 0}</div>
                        <div class="stat-label">Progressive Passes</div>
                        ${getPerformanceIndicator(stats["Progression_PrgP"] || 0, 5, 3, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Pass Types_Sw"] || 0}</div>
                        <div class="stat-label">Switches</div>
                        ${getPerformanceIndicator(stats["Pass Types_Sw"] || 0, 3, 2, 1)}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Carries_Carries"] || 0}</div>
                        <div class="stat-label">Carries</div>
                        ${getPerformanceIndicator(stats["Carries_Carries"] || 0, 30, 20, 10)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Carries_PrgC"] || 0}</div>
                        <div class="stat-label">Progressive Carries</div>
                        ${getPerformanceIndicator(stats["Carries_PrgC"] || 0, 4, 2, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Carries_Dis"] || 0}</div>
                        <div class="stat-label">Times Dispossessed</div>
                        ${getPerformanceIndicator(stats["Carries_Dis"] || 0, 0.5, 1, 2, true)}
                    </div>
                </div>
            </div>
        `;
    } else if (isMidfielder) {
        // Midfielder-specific stats - organized by categories
        statsHTML += `
            <div class="stats-category">
                <h4>Passing & Playmaking</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Total_Cmp%"] || 0}%</div>
                        <div class="stat-label">Pass Accuracy</div>
                        ${getPerformanceIndicator(stats["Total_Cmp%"] || 0, 85, 75, 65)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["KP"] || 0}</div>
                        <div class="stat-label">Key Passes</div>
                        ${getPerformanceIndicator(stats["KP"] || 0, 2.5, 1.5, 0.5)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.Expected_xAG || 0}</div>
                        <div class="stat-label">Expected Assists</div>
                        ${getPerformanceIndicator(stats.Expected_xAG || 0, 0.3, 0.2, 0.1)}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Progression_PrgP"] || 0}</div>
                        <div class="stat-label">Progressive Passes</div>
                        ${getPerformanceIndicator(stats["Progression_PrgP"] || 0, 8, 5, 3)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["PPA"] || 0}</div>
                        <div class="stat-label">Passes into Box</div>
                        ${getPerformanceIndicator(stats["PPA"] || 0, 2, 1, 0.5)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["CrsPA"] || 0}</div>
                        <div class="stat-label">Crosses into Box</div>
                        ${getPerformanceIndicator(stats["CrsPA"] || 0, 1.5, 1, 0.5)}
                    </div>
                </div>
            </div>
            
            <div class="stats-category">
                <h4>Defensive Contributions</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${(stats["Tkl+Int"] || (stats["Tackles_Tkl"] || 0) + (stats["Int"] || 0))}</div>
                        <div class="stat-label">Tackles + Interceptions</div>
                        ${getPerformanceIndicator((stats["Tkl+Int"] || (stats["Tackles_Tkl"] || 0) + (stats["Int"] || 0)), 4, 3, 2)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Challenges_Tkl%"] || 0}%</div>
                        <div class="stat-label">Tackle Success %</div>
                        ${getPerformanceIndicator(stats["Challenges_Tkl%"] || 0, 65, 55, 45)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Blocks_Pass"] || 0}</div>
                        <div class="stat-label">Passes Blocked</div>
                        ${getPerformanceIndicator(stats["Blocks_Pass"] || 0, 1.5, 1, 0.5)}
                    </div>
                </div>
            </div>
            
            <div class="stats-category">
                <h4>Ball Progression</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Take-Ons_Att"] || 0}</div>
                        <div class="stat-label">Dribble Attempts</div>
                        ${getPerformanceIndicator(stats["Take-Ons_Att"] || 0, 3, 2, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Take-Ons_Succ%"] || 0}%</div>
                        <div class="stat-label">Dribble Success %</div>
                        ${getPerformanceIndicator(stats["Take-Ons_Succ%"] || 0, 70, 60, 50)}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Carries_PrgC"] || 0}</div>
                        <div class="stat-label">Progressive Carries</div>
                        ${getPerformanceIndicator(stats["Carries_PrgC"] || 0, 6, 4, 2)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Carries_PrgDist"] || 0}</div>
                        <div class="stat-label">Prog. Carry Distance</div>
                        ${getPerformanceIndicator(stats["Carries_PrgDist"] || 0, 200, 150, 100)}
                    </div>
                </div>
            </div>
            
            <div class="stats-category">
                <h4>Final Third Impact</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["SCA_SCA90"] || 0}</div>
                        <div class="stat-label">Shot-Creating Actions</div>
                        ${getPerformanceIndicator(stats["SCA_SCA90"] || 0, 3, 2, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["GCA_GCA90"] || 0}</div>
                        <div class="stat-label">Goal-Creating Actions</div>
                        ${getPerformanceIndicator(stats["GCA_GCA90"] || 0, 0.5, 0.3, 0.1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${(stats.Expected_xG || 0) + (stats.Expected_xAG || 0)}</div>
                        <div class="stat-label">xG + xAG</div>
                        ${getPerformanceIndicator((stats.Expected_xG || 0) + (stats.Expected_xAG || 0), 0.5, 0.3, 0.1)}
                    </div>
                </div>
            </div>
        `;
    } else if (isForward) {
        // Forward-specific stats - organized by categories
        statsHTML += `
            <div class="stats-category">
                <h4>Goalscoring Ability</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Per 90 Minutes_Gls"] || 0}</div>
                        <div class="stat-label">Goals per 90</div>
                        ${getPerformanceIndicator(stats["Per 90 Minutes_Gls"] || 0, 0.5, 0.3, 0.1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.Expected_xG || 0}</div>
                        <div class="stat-label">Expected Goals (xG)</div>
                        ${getPerformanceIndicator(stats.Expected_xG || 0, 0.5, 0.3, 0.1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.Expected_npxG || 0}</div>
                        <div class="stat-label">Non-Penalty xG</div>
                        ${getPerformanceIndicator(stats.Expected_npxG || 0, 0.4, 0.25, 0.1)}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Standard_Sh"] || 0}</div>
                        <div class="stat-label">Shots Taken</div>
                        ${getPerformanceIndicator(stats["Standard_Sh"] || 0, 3, 2, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Standard_SoT%"] || 0}%</div>
                        <div class="stat-label">Shots on Target %</div>
                        ${getPerformanceIndicator(stats["Standard_SoT%"] || 0, 50, 35, 25)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Standard_G/SoT"] || 0}</div>
                        <div class="stat-label">Goals per SoT</div>
                        ${getPerformanceIndicator(stats["Standard_G/SoT"] || 0, 0.4, 0.3, 0.2)}
                    </div>
                </div>
            </div>
            
            <div class="stats-category">
                <h4>Dribbling & Chance Creation</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Take-Ons_Att"] || 0}</div>
                        <div class="stat-label">Dribble Attempts</div>
                        ${getPerformanceIndicator(stats["Take-Ons_Att"] || 0, 5, 3, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Take-Ons_Succ%"] || 0}%</div>
                        <div class="stat-label">Dribble Success %</div>
                        ${getPerformanceIndicator(stats["Take-Ons_Succ%"] || 0, 60, 50, 40)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Carries_PrgC"] || 0}</div>
                        <div class="stat-label">Progressive Carries</div>
                        ${getPerformanceIndicator(stats["Carries_PrgC"] || 0, 6, 4, 2)}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["SCA_SCA90"] || 0}</div>
                        <div class="stat-label">Shot-Creating Actions</div>
                        ${getPerformanceIndicator(stats["SCA_SCA90"] || 0, 4, 3, 2)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["GCA_GCA90"] || 0}</div>
                        <div class="stat-label">Goal-Creating Actions</div>
                        ${getPerformanceIndicator(stats["GCA_GCA90"] || 0, 0.6, 0.4, 0.2)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["KP"] || 0}</div>
                        <div class="stat-label">Key Passes</div>
                        ${getPerformanceIndicator(stats["KP"] || 0, 2, 1.5, 1)}
                    </div>
                </div>
            </div>
            
            <div class="stats-category">
                <h4>Off-the-Ball Movement</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Touches_Att Pen"] || 0}</div>
                        <div class="stat-label">Touches in Box</div>
                        ${getPerformanceIndicator(stats["Touches_Att Pen"] || 0, 6, 4, 2)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Carries_CPA"] || 0}</div>
                        <div class="stat-label">Carries into Box</div>
                        ${getPerformanceIndicator(stats["Carries_CPA"] || 0, 2, 1, 0.5)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Progression_PrgR"] || 0}</div>
                        <div class="stat-label">Progressive Runs</div>
                        ${getPerformanceIndicator(stats["Progression_PrgR"] || 0, 3, 2, 1)}
                    </div>
                </div>
            </div>
        `;
    } else if (isGoalkeeper) {
        // Goalkeeper-specific stats - using available data
        statsHTML += `
            <div class="stats-category">
                <h4>Distribution</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Total_Cmp%"] || 0}%</div>
                        <div class="stat-label">Pass Accuracy</div>
                        ${getPerformanceIndicator(stats["Total_Cmp%"] || 0, 85, 75, 65)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Total_Att"] || 0}</div>
                        <div class="stat-label">Pass Attempts</div>
                        ${getPerformanceIndicator(stats["Total_Att"] || 0, 30, 20, 10)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Long_Cmp%"] || 0}%</div>
                        <div class="stat-label">Long Pass Accuracy</div>
                        ${getPerformanceIndicator(stats["Long_Cmp%"] || 0, 60, 50, 40)}
                    </div>
                </div>
            </div>
            
            <div class="stats-category">
                <h4>Defensive Actions</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Touches_Def Pen"] || 0}</div>
                        <div class="stat-label">Penalty Area Touches</div>
                        ${getPerformanceIndicator(stats["Touches_Def Pen"] || 0, 5, 3, 1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Touches_Def 3rd"] || 0}</div>
                        <div class="stat-label">Defensive Third Touches</div>
                        ${getPerformanceIndicator(stats["Touches_Def 3rd"] || 0, 20, 15, 10)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Clr"] || 0}</div>
                        <div class="stat-label">Clearances</div>
                        ${getPerformanceIndicator(stats["Clr"] || 0, 2, 1, 0.5)}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Default stats for versatile or unknown positions
        statsHTML += `
            <div class="stats-category">
                <h4>General Performance</h4>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Per 90 Minutes_Gls"] || 0}</div>
                        <div class="stat-label">Goals per 90</div>
                        ${getPerformanceIndicator(stats["Per 90 Minutes_Gls"] || 0, 0.5, 0.3, 0.1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Per 90 Minutes_Ast"] || 0}</div>
                        <div class="stat-label">Assists per 90</div>
                        ${getPerformanceIndicator(stats["Per 90 Minutes_Ast"] || 0, 0.4, 0.2, 0.1)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Total_Cmp%"] || 0}%</div>
                        <div class="stat-label">Pass Accuracy</div>
                        ${getPerformanceIndicator(stats["Total_Cmp%"] || 0, 85, 75, 65)}
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card">
                        <div class="stat-value">${stats["Standard_SoT%"] || 0}%</div>
                        <div class="stat-label">Shot Accuracy</div>
                        ${getPerformanceIndicator(stats["Standard_SoT%"] || 0, 50, 35, 25)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Take-Ons_Succ%"] || 0}%</div>
                        <div class="stat-label">Dribble Success %</div>
                        ${getPerformanceIndicator(stats["Take-Ons_Succ%"] || 0, 60, 50, 40)}
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats["Challenges_Tkl%"] || 0}%</div>
                        <div class="stat-label">Tackle Success %</div>
                        ${getPerformanceIndicator(stats["Challenges_Tkl%"] || 0, 65, 55, 45)}
                    </div>
                </div>
            </div>
        `;
    }

    statsHTML += "</div>";
    
    return statsHTML;
}

// Generate position-based strengths and weaknesses analysis
function generatePositionBasedStrengthsWeaknessesAnalysis(stats, player) {
    // Get the player's position
    const position = player.best_position || player.pos || player.All_Positions || "";

    // Define position categories
    const isForward =
        position.includes("FW") ||
        position.includes("ST") ||
        position.includes("CF") ||
        position.includes("LW") ||
        position.includes("RW");
    const isMidfielder =
        position.includes("MF") ||
        position.includes("CM") ||
        position.includes("CDM") ||
        position.includes("CAM") ||
        position.includes("LM") ||
        position.includes("RM");
    const isDefender =
        position.includes("DF") || position.includes("CB") || position.includes("LB") || position.includes("RB");
    const isGoalkeeper = position.includes("GK");

    // Define position-specific strength criteria
    let strengthCriteria = [];

    if (isForward) {
        strengthCriteria = [
            {
                name: "clinical finishing",
                condition: stats["Standard_SoT%"] > 45,
                value: stats["Standard_SoT%"],
                detail: "shot-on-target percentage",
            },
            {
                name: "goal threat",
                condition: stats.Performance_Gls > 10 || stats.Expected_xG > 0.5,
                value: stats.Performance_Gls,
                detail: "goals scored",
            },
            {
                name: "attacking positioning",
                condition: stats["Touches_Att Pen"] > 5,
                value: stats["Touches_Att Pen"],
                detail: "touches in attacking penalty area",
            },
            {
                name: "creative playmaking",
                condition: stats["KP"] > 1.5 && stats.Performance_Ast > 5,
                value: stats["KP"],
                detail: "key passes per game",
            },
            {
                name: "dribbling ability",
                condition: stats["Take-Ons_Succ"] > 1.5,
                value: stats["Take-Ons_Succ"] || 0,
                detail: "successful dribbles per game",
            },
            {
                name: "physical presence",
                condition: stats["Challenges_Tkl%"] > 55,
                value: stats["Challenges_Tkl%"],
                detail: "duels won percentage",
            },
        ];
    } else if (isMidfielder) {
        strengthCriteria = [
            {
                name: "passing accuracy",
                condition: stats["Total_Cmp%"] > 85,
                value: stats["Total_Cmp%"],
                detail: "pass completion rate",
            },
            {
                name: "creative playmaking",
                condition: stats["KP"] > 2,
                value: stats["KP"],
                detail: "key passes per game",
            },
            {
                name: "ball progression",
                condition: stats["Progression_PrgP"] > 5 || stats["Progression_PrgC"] > 5,
                value: stats["Progression_PrgP"] || stats["Progression_PrgC"],
                detail: "progressive passes/carries per game",
            },
            {
                name: "defensive contributions",
                condition: stats["Challenges_Tkl%"] > 60,
                value: stats["Challenges_Tkl%"],
                detail: "tackle success rate",
            },
            {
                name: "attacking threat",
                condition: stats.Performance_Gls > 5 || stats.Performance_Ast > 5,
                value: (stats.Performance_Gls || 0) + (stats.Performance_Ast || 0),
                detail: "goal contributions",
            },
            {
                name: "ball carrying",
                condition: stats["Carries_Carries"] > 20,
                value: stats["Carries_Carries"] || 0,
                detail: "progressive carries per game",
            },
        ];
    } else if (isDefender) {
        strengthCriteria = [
            {
                name: "defensive solidity",
                condition: stats["Challenges_Tkl%"] > 65,
                value: stats["Challenges_Tkl%"],
                detail: "tackle success rate",
            },
            {
                name: "defensive awareness",
                condition: stats["Int"] > 1.5,
                value: stats["Int"],
                detail: "interceptions per game",
            },
            {
                name: "ball progression",
                condition: stats["Progression_PrgP"] > 4,
                value: stats["Progression_PrgP"],
                detail: "progressive passes per game",
            },
            {
                name: "passing accuracy",
                condition: stats["Total_Cmp%"] > 80,
                value: stats["Total_Cmp%"],
                detail: "pass completion rate",
            },
            {
                name: "clearances",
                condition: stats["Clr"] > 3,
                value: stats["Clr"],
                detail: "clearances per game",
            },
            {
                name: "attacking contribution",
                condition:
                    (stats.Performance_Gls > 2 || stats.Performance_Ast > 2) &&
                    (position.includes("LB") || position.includes("RB")),
                value: (stats.Performance_Gls || 0) + (stats.Performance_Ast || 0),
                detail: "goal contributions",
            },
        ];
    } else if (isGoalkeeper) {
        strengthCriteria = [
            {
                name: "shot stopping",
                condition: true, // Always include for goalkeepers
                value: 75, // Placeholder - would need actual save percentage
                detail: "save percentage",
            },
            {
                name: "distribution",
                condition: stats["Total_Cmp%"] > 70,
                value: stats["Total_Cmp%"],
                detail: "pass completion rate",
            },
            {
                name: "command of area",
                condition: true,
                value: "High",
                detail: "aerial control",
            },
        ];
    } else {
        // Default criteria for versatile or unknown positions
        strengthCriteria = [
            {
                name: "versatility",
                condition: true,
                value: "High",
                detail: "positional adaptability",
            },
            {
                name: "passing accuracy",
                condition: stats["Total_Cmp%"] > 80,
                value: stats["Total_Cmp%"],
                detail: "pass completion rate",
            },
            {
                name: "ball progression",
                condition: stats["Progression_PrgP"] > 4 || stats["Progression_PrgC"] > 4,
                value: stats["Progression_PrgP"] || stats["Progression_PrgC"],
                detail: "progressive passes/carries per game",
            },
        ];
    }

    // Define position-specific weakness criteria
    let weaknessCriteria = [];

    if (isForward) {
        weaknessCriteria = [
            {
                name: "inefficient shooting",
                condition: stats["Standard_SoT%"] < 30,
                value: stats["Standard_SoT%"],
                detail: "shot-on-target percentage",
            },
            {
                name: "limited creativity",
                condition: stats["KP"] < 1.0 && stats.Performance_Ast < 3,
                value: stats["KP"],
                detail: "key passes per game",
            },
            {
                name: "physical weakness",
                condition: stats["Challenges_Tkl%"] < 45,
                value: stats["Challenges_Tkl%"],
                detail: "duels won percentage",
            },
            {
                name: "underperforming xG",
                condition: stats.Performance_Gls < stats.Expected_xG - 2,
                value: (stats.Performance_Gls - stats.Expected_xG).toFixed(2),
                detail: "goals below expected",
            },
            {
                name: "ball retention issues",
                condition: stats["Carries_Dis"] > 1.5 || stats["Carries_Mis"] > 2,
                value: stats["Carries_Dis"] || stats["Carries_Mis"] || 0,
                detail: stats["Carries_Dis"] > stats["Carries_Mis"] ? "times dispossessed per game" : "poor touches per game",
            },
        ];
    } else if (isMidfielder) {
        weaknessCriteria = [
            {
                name: "inconsistent passing",
                condition: stats["Total_Cmp%"] < 75,
                value: stats["Total_Cmp%"],
                detail: "pass completion rate",
            },
            {
                name: "limited creativity",
                condition: stats["KP"] < 1.0 && stats.Performance_Ast < 3,
                value: stats["KP"],
                detail: "key passes per game",
            },
            {
                name: "defensive frailty",
                condition: stats["Challenges_Tkl%"] < 55,
                value: stats["Challenges_Tkl%"],
                detail: "tackle success rate",
            },
            {
                name: "limited attacking output",
                condition: stats.Performance_Gls < 3 && stats.Performance_Ast < 3,
                value: (stats.Performance_Gls || 0) + (stats.Performance_Ast || 0),
                detail: "goal contributions",
            },
            {
                name: "ball retention issues",
                condition: stats["Take-Ons_Succ%"] < 50 || stats["Carries_Dis"] > 1.5,
                value: stats["Take-Ons_Succ%"] || stats["Carries_Dis"],
                detail: stats["Take-Ons_Succ%"] ? "take-on success rate" : "dispossessions per game",
            },
            {
                name: "disciplinary issues",
                condition: stats["Performance_CrdY"] > 5,
                value: stats["Performance_CrdY"],
                detail: "yellow cards",
            },
        ];
    } else if (isDefender) {
        weaknessCriteria = [
            {
                name: "defensive vulnerability",
                condition: stats["Challenges_Tkl%"] < 60,
                value: stats["Challenges_Tkl%"],
                detail: "tackle success rate",
            },
            {
                name: "positioning issues",
                condition: stats["Int"] < 1.2,
                value: stats["Int"],
                detail: "interceptions per game",
            },
            {
                name: "limited distribution",
                condition: stats["Total_Cmp%"] < 75,
                value: stats["Total_Cmp%"],
                detail: "pass completion rate",
            },
            {
                name: "positional errors",
                condition: stats["Err"] > 1,
                value: stats["Err"],
                detail: "errors leading to shots",
            },
            {
                name: "disciplinary issues",
                condition: stats["Performance_CrdY"] > 5 || stats["Performance_CrdR"] > 0,
                value: stats["Performance_CrdY"] || stats["Performance_CrdR"],
                detail: stats["Performance_CrdR"] > 0 ? "red cards" : "yellow cards",
            },
        ];
    } else if (isGoalkeeper) {
        weaknessCriteria = [
            {
                name: "distribution",
                condition: stats["Total_Cmp%"] < 65,
                value: stats["Total_Cmp%"],
                detail: "pass completion rate",
            },
            {
                name: "command of area",
                condition: false, // Placeholder
                value: "Limited",
                detail: "aerial control",
            },
        ];
    } else {
        // Default criteria for versatile or unknown positions
        weaknessCriteria = [
            {
                name: "positional discipline",
                condition: true,
                value: "Moderate",
                detail: "tactical awareness",
            },
            {
                name: "specialization",
                condition: true,
                value: "Limited",
                detail: "role mastery",
            },
        ];
    }

    // Filter actual strengths and weaknesses based on conditions
    const strengths = strengthCriteria.filter((item) => item.condition);
    const weaknesses = weaknessCriteria.filter((item) => item.condition);

    // Generate position-specific development recommendations
    const developmentRecommendations = generatePositionBasedRecommendations(stats, player, weaknesses);

    // Generate the analysis HTML
    let analysis = `
        <div class="report-section report-analysis">
          <h3><i class="fas fa-balance-scale"></i> Strengths & Development Areas</h3>
          <div class="strengths-weaknesses-grid">
      `;

    // Add strengths section
    analysis += `
        <div class="strengths-section">
          <h4>Key Strengths</h4>
          ${strengths.length > 0
            ? `<ul class="strengths-list">
              ${strengths
                .slice(0, 3) // Limit to top 3 strengths
                .map(
                    (strength) =>
                        `<li>
                  <div class="strength-name">${capitalizeFirstLetter(strength.name)}</div>
                  <div class="strength-detail">${strength.value}${typeof strength.value === "number" && !Number.isInteger(strength.value) ? "%" : ""} ${strength.detail}</div>
                  <div class="strength-bar">
                    <div class="strength-bar-fill" style="width: ${Math.min(100, typeof strength.value === "number" ? strength.value : 50)}%"></div>
                  </div>
                </li>`
                )
                .join("")}
            </ul>`
            : `<p class="no-data">Insufficient data to determine key strengths.</p>`
        }
        </div>
      `;

    // Add weaknesses section
    analysis += `
        <div class="weaknesses-section">
          <h4>Development Areas</h4>
          ${weaknesses.length > 0
            ? `<ul class="weaknesses-list">
              ${weaknesses
                .slice(0, 3) // Limit to top 3 weaknesses
                .map(
                    (weakness) =>
                        `<li>
                  <div class="weakness-name">${capitalizeFirstLetter(weakness.name)}</div>
                  <div class="weakness-detail">${weakness.value}${typeof weakness.value === "number" && !Number.isInteger(weakness.value) ? "%" : ""} ${weakness.detail}</div>
                  <div class="weakness-bar">
                    <div class="weakness-bar-fill" style="width: ${Math.min(100, typeof weakness.value === "number" ? weakness.value : 50)}%"></div>
                  </div>
                </li>`
                )
                .join("")}
            </ul>`
            : `<p class="no-data">No significant development areas identified.</p>`
        }
        </div>
      `;

    // Add development recommendations
    analysis += `
        <div class="development-recommendations">
          <h4>Development Recommendations</h4>
          <ul class="recommendations-list">
            ${developmentRecommendations.map((rec) => `<li>${rec}</li>`).join("")}
          </ul>
        </div>
      `;

    analysis += `
          </div>
        </div>
      `;

    return analysis;
}

// Generate strength vs weakness comparison
function generateStrengthWeaknessComparison(stats, player) {
    // Define key performance attributes based on player position
    const position = player.best_position || player.pos || player.All_Positions || "";
    let attributes = [];

    // These are the attributes we know exist in the dataset
    // Forward-specific attributes
    if (
        position.includes("FW") ||
        position.includes("ST") ||
        position.includes("CF") ||
        position.includes("LW") ||
        position.includes("RW")
    ) {
        attributes = [
            {
                name: "Goal Scoring",
                value: stats.Performance_Gls
                    ? (Number.parseFloat(stats.Performance_Gls) / (Number.parseFloat(stats["Playing Time_MP"]) || 1)) * 5
                    : 0,
                max: 10,
            },
            {
                name: "Creativity",
                value: stats.Performance_Ast
                    ? (Number.parseFloat(stats.Performance_Ast) / (Number.parseFloat(stats["Playing Time_MP"]) || 1)) * 8
                    : 0,
                max: 10,
            },
            {
                name: "Shot Accuracy",
                value: stats["Standard_SoT%"] ? Number.parseFloat(stats["Standard_SoT%"]) / 10 : 0,
                max: 10,
            },
            {
                name: "Penalty Box Presence",
                value: stats["Touches_Att Pen"] ? Math.min(Number.parseFloat(stats["Touches_Att Pen"]) / 1.5, 10) : 0,
                max: 10,
            },
            {
                name: "Dribbling",
                value: stats["Take-Ons_Succ"] ? Math.min(Number.parseFloat(stats["Take-Ons_Succ"]) * 2, 10) : 0,
                max: 10,
            },
            {
                name: "Tackle Success",
                value: stats["Challenges_Tkl%"] ? Number.parseFloat(stats["Challenges_Tkl%"]) / 10 : 0,
                max: 10,
            },
        ];
    }
    // Midfielder-specific attributes
    else if (
        position.includes("MF") ||
        position.includes("CM") ||
        position.includes("CDM") ||
        position.includes("CAM") ||
        position.includes("LM") ||
        position.includes("RM")
    ) {
        attributes = [
            {
                name: "Passing",
                value: stats["Total_Cmp%"] ? Number.parseFloat(stats["Total_Cmp%"]) / 10 : 0,
                max: 10,
            },
            {
                name: "Key Passes",
                value: stats["KP"] ? Math.min(Number.parseFloat(stats["KP"]) * 2, 10) : 0,
                max: 10,
            },
            {
                name: "Defensive Contribution",
                value: stats["Challenges_Tkl%"] ? Number.parseFloat(stats["Challenges_Tkl%"]) / 10 : 0,
                max: 10,
            },
            {
                name: "Goal Threat",
                value: stats.Performance_Gls ? Math.min(Number.parseFloat(stats.Performance_Gls) * 1.5, 10) : 0,
                max: 10,
            },
            {
                name: "Assist Potential",
                value: stats.Expected_xAG ? Math.min(Number.parseFloat(stats.Expected_xAG) * 1.5, 10) : 0,
                max: 10,
            },
            {
                name: "Attacking Third Presence",
                value: stats["Touches_Att 3rd"] ? Math.min(Number.parseFloat(stats["Touches_Att 3rd"]) / 5, 10) : 0,
                max: 10,
            },
        ];
    }
    // Defender-specific attributes
    else if (position.includes("DF") || position.includes("CB") || position.includes("LB") || position.includes("RB")) {
        attributes = [
            {
                name: "Tackling",
                value: stats["Challenges_Tkl%"] ? Number.parseFloat(stats["Challenges_Tkl%"]) / 10 : 0,
                max: 10,
            },
            {
                name: "Interceptions",
                value: stats["Int"] ? Math.min(Number.parseFloat(stats["Int"]) * 2, 10) : 0,
                max: 10,
            },
            {
                name: "Passing",
                value: stats["Total_Cmp%"] ? Number.parseFloat(stats["Total_Cmp%"]) / 10 : 0,
                max: 10,
            },
            {
                name: "Defensive Third Presence",
                value: stats["Touches_Def 3rd"] ? Math.min(Number.parseFloat(stats["Touches_Def 3rd"]) / 3, 10) : 0,
                max: 10,
            },
            {
                name: "Attacking Contribution",
                value:
                    (stats.Performance_Gls || 0) + (stats.Performance_Ast || 0) > 0
                        ? Math.min(((stats.Performance_Gls || 0) + (stats.Performance_Ast || 0)) * 2, 10)
                        : 0,
                max: 10,
            },
            {
                name: "Defensive Positioning",
                value: stats["Touches_Def Pen"] ? Math.min(Number.parseFloat(stats["Touches_Def Pen"]) * 5, 10) : 0,
                max: 10,
            },
        ];
    }
    // Default attributes for other positions
    else {
        attributes = [
            {
                name: "Passing",
                value: stats["Total_Cmp%"] ? Number.parseFloat(stats["Total_Cmp%"]) / 10 : 0,
                max: 10,
            },
            {
                name: "Key Passes",
                value: stats["KP"] ? Math.min(Number.parseFloat(stats["KP"]) * 2, 10) : 0,
                max: 10,
            },
            {
                name: "Shot Accuracy",
                value: stats["Standard_SoT%"] ? Number.parseFloat(stats["Standard_SoT%"]) / 10 : 0,
                max: 10,
            },
            {
                name: "Tackle Success",
                value: stats["Challenges_Tkl%"] ? Number.parseFloat(stats["Challenges_Tkl%"]) / 10 : 0,
                max: 10,
            },
            {
                name: "Defensive Contribution",
                value: stats["Int"] ? Math.min(Number.parseFloat(stats["Int"]) * 2, 10) : 0,
                max: 10,
            },
            {
                name: "Goal Contributions",
                value:
                    (stats.Performance_Gls || 0) + (stats.Performance_Ast || 0) > 0
                        ? Math.min((stats.Performance_Gls || 0) + (stats.Performance_Ast || 0), 10)
                        : 0,
                max: 10,
            },
        ];
    }

    // Normalize values between 0-10
    attributes.forEach((attr) => {
        attr.value = Math.min(Math.max(attr.value, 0), 10);
        attr.value = Math.round(attr.value * 10) / 10; // Round to 1 decimal place
    });

    // Sort attributes by value to identify strengths and weaknesses
    const sortedAttributes = [...attributes].sort((a, b) => b.value - a.value);

    // Get top 3 unique strengths (no duplicates)
    const uniqueAttributes = [];
    const seenNames = new Set();
    for (const attr of sortedAttributes) {
        if (!seenNames.has(attr.name)) {
            uniqueAttributes.push(attr);
            seenNames.add(attr.name);
        }
    }
    const strengths = uniqueAttributes.slice(0, 3);
    const weaknesses = uniqueAttributes.slice(-3).reverse();

    // Generate HTML for the comparison
    return `
        <div class="report-section report-strength-weakness">
          <h3><i class="fas fa-balance-scale"></i> Strengths vs. Weaknesses</h3>
          
          <div class="strength-weakness-grid">
            <div class="strengths-column">
              <h4>Top Strengths</h4>
              <div class="attribute-bars">
                ${strengths
            .map(
                (attr) => `
                  <div class="attribute-bar-container">
                    <div class="attribute-name">${attr.name}</div>
                    <div class="attribute-bar">
                      <div class="attribute-bar-fill strength" style="width: ${(attr.value / attr.max) * 100}%"></div>
                    </div>
                    <div class="attribute-value">${attr.value}/10</div>
                  </div>
                `
            )
            .join("")}
              </div>
            </div>
            
            <div class="weaknesses-column">
              <h4>Areas for Improvement</h4>
              <div class="attribute-bars">
                ${weaknesses
            .map(
                (attr) => `
                  <div class="attribute-bar-container">
                    <div class="attribute-name">${attr.name}</div>
                    <div class="attribute-bar">
                      <div class="attribute-bar-fill weakness" style="width: ${(attr.value / attr.max) * 100}%"></div>
                    </div>
                    <div class="attribute-value">${attr.value}/10</div>
                  </div>
                `
            )
            .join("")}
              </div>
            </div>
          </div>
          
          <div class="player-attribute-summary">
            <p>
              ${player.player.split(" ")[0]}'s game is characterized by ${strengths[0] ? `exceptional <strong>${strengths[0].name.toLowerCase()}</strong>` : "balanced attributes"} 
              ${strengths[1] ? ` and strong <strong>${strengths[1].name.toLowerCase()}</strong>` : ""}.
              ${weaknesses[0] ? `To reach the next level, focus on improving <strong>${weaknesses[0].name.toLowerCase()}</strong>` : ""}
              ${weaknesses[1] ? ` and <strong>${weaknesses[1].name.toLowerCase()}</strong>` : ""}.
            </p>
          </div>
        </div>
      `;
}

// Tactical analysis function
function generateTacticalAnalysis(stats, player) {
    const position = player.best_position || player.pos || player.All_Positions || "";
    const touchesDef = stats["Touches_Def Pen"] || 0;
    const touchesDefThird = stats["Touches_Def 3rd"] || 0;
    const touchesMid = stats["Touches_Mid 3rd"] || 0;
    const touchesAttThird = stats["Touches_Att 3rd"] || 0;
    const touchesAtt = stats["Touches_Att Pen"] || 0;

    // Calculate percentages for visualization
    const totalTouches = touchesDef + touchesDefThird + touchesMid + touchesAttThird + touchesAtt;
    const touchesDefPct = totalTouches > 0 ? ((touchesDef / totalTouches) * 100).toFixed(1) : 0;
    const touchesDefThirdPct = totalTouches > 0 ? ((touchesDefThird / totalTouches) * 100).toFixed(1) : 0;
    const touchesMidPct = totalTouches > 0 ? ((touchesMid / totalTouches) * 100).toFixed(1) : 0;
    const touchesAttThirdPct = totalTouches > 0 ? ((touchesAttThird / totalTouches) * 100).toFixed(1) : 0;
    const touchesAttPct = totalTouches > 0 ? ((touchesAtt / totalTouches) * 100).toFixed(1) : 0;

    // Determine playing style based on position and touch distribution
    let playingStyle = "balanced";
    let tacticalRole = "Versatile Player";

    if (position.includes("FW") || position.includes("ST") || position.includes("CF")) {
        if (touchesAttPct > 20) {
            playingStyle = "penalty box striker";
            tacticalRole = "Poacher";
        } else if (touchesAttThirdPct > 50) {
            playingStyle = "mobile forward";
            tacticalRole = "Complete Forward";
        } else if (touchesMidPct > 30) {
            playingStyle = "deep-lying forward";
            tacticalRole = "False Nine";
        }
    } else if (position.includes("MF")) {
        if (touchesAttThirdPct > 40) {
            playingStyle = "attack-minded";
            tacticalRole = "Advanced Playmaker";
        } else if (touchesDefThirdPct > 40) {
            playingStyle = "defensive";
            tacticalRole = "Defensive Midfielder";
        } else {
            playingStyle = "box-to-box";
            tacticalRole = "Central Midfielder";
        }
    } else if (position.includes("DF")) {
        if (position.includes("CB")) {
            tacticalRole = "Central Defender";
            if (touchesMidPct > 20) {
                playingStyle = "ball-playing defender";
            } else {
                playingStyle = "no-nonsense defender";
            }
        } else {
            // Full-back
            if (touchesAttThirdPct > 30) {
                playingStyle = "attacking full-back";
                tacticalRole = "Wing Back";
            } else {
                playingStyle = "defensive full-back";
                tacticalRole = "Full Back";
            }
        }
    }

    // Heat map data
    const heatMapData = [
        { zone: "Defensive Penalty Area", percentage: touchesDefPct, color: "rgba(255, 99, 132, 0.7)" },
        { zone: "Defensive Third", percentage: touchesDefThirdPct, color: "rgba(54, 162, 235, 0.7)" },
        { zone: "Middle Third", percentage: touchesMidPct, color: "rgba(75, 192, 192, 0.7)" },
        { zone: "Attacking Third", percentage: touchesAttThirdPct, color: "rgba(153, 102, 255, 0.7)" },
        { zone: "Attacking Penalty Area", percentage: touchesAttPct, color: "rgba(255, 159, 64, 0.7)" },
    ];

    let tacticalAnalysisHTML = `
      <div class="report-section report-tactical">
        <h3><i class="fas fa-chess"></i> Tactical Analysis</h3>
        
        <div class="tactical-overview">
          <p>This player typically adopts a <strong>${playingStyle}</strong> approach, with most touches occurring in the 
          ${getPrimaryTouchArea(touchesDef + touchesDefThird, touchesMid, touchesAttThird + touchesAtt)}. 
          Their primary tactical role is as a <strong>${tacticalRole}</strong>.</p>
        </div>

        <div class="tactical-details-grid">
          <div class="touch-distribution">
            <h4>Touch Distribution</h4>
            <div class="touch-bars">
              ${heatMapData
            .map(
                (zone) => `
                <div class="touch-bar-container">
                  <div class="touch-zone">${zone.zone}</div>
                  <div class="touch-bar">
                    <div class="touch-bar-fill" style="width: ${zone.percentage}%; background-color: ${zone.color}"></div>
                  </div>
                  <div class="touch-percentage">${zone.percentage}%</div>
                </div>
              `
            )
            .join("")}
            </div>
          </div>
          
          <div class="role-analysis">
            <h4>Role Analysis: ${tacticalRole}</h4>
            <p>${getRoleDescription(tacticalRole)}</p>
            
            <div class="key-metrics">
              <h5>Key Role Metrics</h5>
              <div class="metrics-grid">
                ${getRoleMetrics(tacticalRole, stats)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="tactical-fit">
          <h4>System Compatibility</h4>
          <p>${getSystemCompatibility(tacticalRole, playingStyle)}</p>
        </div>
      </div>
    `;

    return tacticalAnalysisHTML;
}

// Generate future outlook
function generateFutureOutlook(player, currentStats, allPlayers) {
    const age = Number.parseInt(player.age) || 25;
    const marketValue = player.market_value || "undisclosed";

    // Determine career stage and potential
    let careerStage, potential, developmentTrajectory;

    if (age < 21) {
        careerStage = "early development";
        potential = "significant";
        developmentTrajectory = "upward";
    } else if (age < 24) {
        careerStage = "development";
        potential = "considerable";
        developmentTrajectory = "upward";
    } else if (age < 28) {
        careerStage = "prime";
        potential = "at or near peak";
        developmentTrajectory = "stable";
    } else if (age < 32) {
        careerStage = "experienced";
        potential = "stable";
        developmentTrajectory = "maintaining";
    } else {
        careerStage = "veteran";
        potential = "limited physical";
        developmentTrajectory = "declining";
    }

    // Generate future projection based on age and position
    const futureProjection = generateFutureProjection(player, age, currentStats);

    // Generate development focus areas
    const developmentFocus = generateDevelopmentFocus(player, age, currentStats);

    return `
      <div class="report-section report-future">
        <h3><i class="fas fa-chart-line"></i> Future Outlook</h3>
        
        <div class="future-overview">
          <p>At ${age} years old with a market value of ${marketValue}, ${player.player} is in the <strong>${careerStage} stage</strong> of their career with <strong>${potential} potential</strong> for future development. The current performance trajectory appears to be <strong>${developmentTrajectory}</strong>.</p>
        </div>
        
        <div class="future-details-grid">
          <div class="future-projection">
            <h4>3-Year Projection</h4>
            <p>${futureProjection}</p>
          </div>
          
          <div class="development-focus">
            <h4>Development Focus Areas</h4>
            <ul>
              ${developmentFocus.map((area) => `<li>${area}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    `;
}

// Analyze player's key strengths based on stats
function analyzePlayerKeyStrengths(stats, position) {
    const strengths = [];
    
    // Position-specific strength analysis
    if (position.includes("FW") || position.includes("ST") || position.includes("CF")) {
        if (stats["Standard_SoT%"] > 45) {
            strengths.push("Design attacking patterns that create clear shooting opportunities for the player");
        }
        if (stats["Take-Ons_Succ"] > 2) {
            strengths.push("Create isolation situations in wide areas or transition moments to exploit dribbling ability");
        }
        if (stats["Touches_Att Pen"] > 6) {
            strengths.push("Ensure consistent service into the box where the player excels at finding space");
        }
        if (stats.Performance_Ast > 5) {
            strengths.push("Allow freedom to drop deeper and connect with midfielders to utilize creative passing ability");
        }
    } else if (position.includes("MF")) {
        if (stats["Total_Cmp%"] > 85) {
            strengths.push("Build play through the player's excellent passing range and accuracy");
        }
        if (stats["KP"] > 2) {
            strengths.push("Position advanced runners to capitalize on the player's vision and creative passing");
        }
        if (stats["Progression_PrgP"] > 5) {
            strengths.push("Create passing lanes for progressive passes that break opposition lines");
        }
        if (stats["Carries_PrgC"] > 5) {
            strengths.push("Allow space to carry the ball forward and commit defenders");
        }
        if (stats["Challenges_Tkl%"] > 65) {
            strengths.push("Utilize defensive pressing ability to win possession in advantageous areas");
        }
    } else if (position.includes("DF")) {
        if (stats["Total_Cmp%"] > 85) {
            strengths.push("Initiate build-up play through the player's distribution from defense");
        }
        if (stats["Int"] > 2) {
            strengths.push("Maintain a defensive shape that allows the player to read and intercept opposition passes");
        }
        if (stats["Clr"] > 4) {
            strengths.push("Position the player centrally for aerial dominance and clearing dangerous situations");
        }
        if (position.includes("LB") || position.includes("RB")) {
            if (stats["Touches_Att 3rd"] > 20) {
                strengths.push("Allow overlapping runs to utilize attacking contribution from wide areas");
            }
        }
    }
    
    // Add general strengths if specific ones are limited
    if (strengths.length < 2) {
        if (stats["Challenges_Tkl%"] > 60) {
            strengths.push("Utilize strong tackling ability in defensive transitions");
        }
        if (stats["Total_Cmp%"] > 80) {
            strengths.push("Incorporate into possession phases to maintain ball control");
        }
        strengths.push("Design set-piece routines that maximize the player's specific attributes");
    }
    
    // Limit to 3-4 strengths
    return strengths.slice(0, 4);
}

// Determine optimal system based on position and stats
function determineOptimalSystem(stats, position) {
    // Default system
    let system = {
        name: "Balanced 4-3-3",
        description: "A versatile formation that balances defensive solidity with attacking threat.",
        role: "Versatile Team Player",
        roleDescription: "Contributing in multiple phases of play with balanced responsibilities."
    };
    
    // Forward-specific systems
    if (position.includes("FW") || position.includes("ST") || position.includes("CF")) {
        if (stats["Take-Ons_Succ"] > 2 && stats.Performance_Ast > 5) {
            system = {
                name: "Fluid 4-2-3-1",
                description: "A system with interchanging attacking players and positional freedom in the final third.",
                role: "Creative Forward",
                roleDescription: "Leading the attack while dropping into pockets of space to create for others and connect with midfield."
            };
        } else if (stats["Take-Ons_Succ"] > 2) {
            system = {
                name: "Counter-attacking 4-3-3",
                description: "A system designed to transition quickly and create one-on-one situations in wide areas.",
                role: "Dynamic Winger",
                roleDescription: "Exploiting space in transition with dribbling ability and direct attacking runs."
            };
        } else if (stats["Touches_Att Pen"] > 6 && stats["Standard_SoT%"] > 40) {
            system = {
                name: "Crossing-focused 4-4-2",
                description: "A system that emphasizes wide play and service into the box for forwards.",
                role: "Penalty Box Striker",
                roleDescription: "Focusing on movement and finishing within the penalty area to convert crosses and through balls."
            };
        } else {
            system = {
                name: "Direct 4-2-3-1",
                description: "A system that prioritizes vertical progression and quick attacks.",
                role: "Complete Forward",
                roleDescription: "Leading the line with a combination of hold-up play, running channels, and finishing ability."
            };
        }
    } 
    // Midfielder-specific systems
    else if (position.includes("MF")) {
        if (stats["KP"] > 2 && stats.Performance_Ast > 5) {
            system = {
                name: "Possession-based 4-3-3",
                description: "A patient build-up system that values ball retention and creative passing.",
                role: "Advanced Playmaker",
                roleDescription: "Operating between the lines to create chances and dictate attacking play in the final third."
            };
        } else if (stats["Challenges_Tkl%"] > 65 && stats["Int"] > 2) {
            system = {
                name: "High-pressing 4-2-3-1",
                description: "An aggressive system focused on winning the ball high up the pitch through coordinated pressing.",
                role: "Ball-winning Midfielder",
                roleDescription: "Disrupting opposition play through pressing, tackling, and intercepting in central areas."
            };
        } else if (stats["Progression_PrgP"] > 5 && stats["Progression_PrgC"] > 5) {
            system = {
                name: "Transition-focused 4-3-3",
                description: "A system designed to progress the ball quickly through midfield into attacking areas.",
                role: "Box-to-Box Midfielder",
                roleDescription: "Contributing to all phases of play with progressive passing, carrying, and supporting both defense and attack."
            };
        } else {
            system = {
                name: "Structured 4-4-2",
                description: "A balanced system with clear positional responsibilities and defensive organization.",
                role: "Central Midfielder",
                roleDescription: "Maintaining positional discipline while connecting defense to attack with reliable passing."
            };
        }
    } 
    // Defender-specific systems
    else if (position.includes("DF")) {
        if (stats["Total_Cmp%"] > 85 && (position.includes("CB"))) {
            system = {
                name: "Build-from-back 3-4-3",
                description: "A system that utilizes center-backs in the first phase of build-up play.",
                role: "Ball-playing Center-back",
                roleDescription: "Initiating attacks with progressive passing while maintaining defensive solidity."
            };
        } else if (position.includes("LB") || position.includes("RB")) {
            if (stats["Touches_Att 3rd"] > 20) {
                system = {
                name: "Wing-back 3-5-2",
                description: "A system that provides width through attacking full-backs/wing-backs.",
                role: "Attacking Wing-back",
                roleDescription: "Providing width in attack while recovering defensively to form a back five when needed."
                };
            } else {
                system = {
                name: "Compact 4-4-2",
                description: "A defensively solid system with full-backs primarily focused on defensive duties.",
                role: "Defensive Full-back",
                roleDescription: "Maintaining defensive shape and providing safe passing options in build-up."
                };
            }
        } else {
            system = {
                name: "Zonal 4-3-3",
                description: "A defensively organized system with clear zonal responsibilities.",
                role: "Defensive Organizer",
                roleDescription: "Leading the defensive line with positioning, communication, and defensive actions."
            };
        }
    }
    
    return system;
}

// Generate tactical instructions based on position and stats
function generateTacticalInstructions(stats, position) {
    const instructions = [];
    
    // Forward-specific instructions
    if (position.includes("FW") || position.includes("ST") || position.includes("CF")) {
        instructions.push({
            title: "Attacking Movement",
            detail: stats["Touches_Att Pen"] > 6 
                ? "Make diagonal runs behind the defensive line to exploit space in the box" 
                : "Drop into half-spaces between defensive lines to receive and turn"
        });
        
        instructions.push({
            title: "Pressing Approach",
            detail: stats["Challenges_Tkl%"] > 60 
                ? "Lead the press by cutting passing lanes to force play wide" 
                : "Apply selective pressure to force defenders into rushed clearances"
        });
        
        instructions.push({
            title: "Positional Play",
            detail: stats.Performance_Ast > 5 
                ? "Freedom to roam across the front line to create passing angles" 
                : "Maintain central position to occupy center-backs and attack crosses"
        });
        
        if (stats["Take-Ons_Succ"] > 2) {
            instructions.push({
                title: "Ball Retention",
                detail: "Seek 1v1 situations in transition moments to exploit dribbling ability"
            });
        } else {
            instructions.push({
                title: "Combination Play",
                detail: "Focus on quick one-touch combinations with midfielders to break defensive lines"
            });
        }
    } 
    // Midfielder-specific instructions
    else if (position.includes("MF")) {
        instructions.push({
            title: "Defensive Positioning",
            detail: stats["Int"] > 2 
                ? "Position between opposition passing lanes to maximize interception opportunities" 
                : "Maintain compact shape with defensive line to limit space between the lines"
        });
        
        instructions.push({
            title: "Ball Circulation",
            detail: stats["Total_Cmp%"] > 85 
                ? "Dictate tempo through varied passing range and ball retention" 
                : "Focus on safe ball circulation with minimal risk in build-up phases"
        });
        
        instructions.push({
            title: "Attacking Contribution",
            detail: stats["KP"] > 2 
                ? "Look for penetrative passes to forwards making runs behind the defense" 
                : "Support attacks with late runs into the box when appropriate"
        });
        
        if (stats["Progression_PrgC"] > 5) {
            instructions.push({
                title: "Ball Carrying",
                detail: "Utilize progressive carries to break lines and advance play into dangerous areas"
            });
        } else {
            instructions.push({
                title: "Positional Discipline",
                detail: "Maintain positional balance to prevent counter-attacks and provide passing options"
            });
        }
    } 
    // Defender-specific instructions
    else if (position.includes("DF")) {
        instructions.push({
            title: "Defensive Shape",
            detail: stats["Int"] > 2 
                ? "Maintain a compact defensive block, focusing on denying central penetration" 
                : "Prioritize covering teammates and shifting as a unit to close down space"
        });
        
        instructions.push({
            title: "Distribution",
            detail: stats["Total_Cmp%"] > 85 
                ? "Initiate attacks with accurate long-range passes to switch play or find forwards" 
                : "Focus on short, secure passes to build possession from the back"
        });
        
        instructions.push({
            title: "Aerial Duels",
            detail: stats["Aerials_Won%"] > 60 
                ? "Aggressively challenge for aerial balls in both defensive and attacking thirds" 
                : "Focus on proper positioning and timing for defensive headers"
        });
        
        if (position.includes("LB") || position.includes("RB")) {
            instructions.push({
                title: "Attacking Overlaps",
                detail: stats["Touches_Att 3rd"] > 20 
                    ? "Make overlapping runs to provide width and deliver crosses into the box" 
                    : "Maintain defensive discipline, joining attacks only when cover is assured"
            });
        }
    }
    
    return instructions.slice(0, 4);
}

// Generate training focus recommendations
function generateTrainingFocus(stats, position, age) {
    const trainingFocus = [];
    
    // General training aspects
    trainingFocus.push({
        area: "Decision Making",
        detail: "Small-sided games with limited touches to improve quick decision-making under pressure"
    });
    
    trainingFocus.push({
        area: "Physical Conditioning",
        detail: "High-intensity interval training to improve stamina and burst acceleration"
    });
    
    // Position-specific training
    if (position.includes("FW") || position.includes("ST") || position.includes("CF")) {
        if (stats["Standard_SoT%"] < 40) {
            trainingFocus.push({
                area: "Finishing Drills",
                detail: "Repetitive shooting practice from various angles and distances under game-like pressure"
            });
        }
        
        if (stats["Take-Ons_Succ"] < 50) {
            trainingFocus.push({
                area: "Dribbling & Ball Control",
                detail: "Cone drills and 1v1 situations to improve close control and change of direction"
            });
        }
        
        trainingFocus.push({
            area: "Movement Patterns",
            detail: "Shadow play focusing on timing of runs and positioning between defensive lines"
        });
    } 
    else if (position.includes("MF")) {
        if (stats["Total_Cmp%"] < 85) {
            trainingFocus.push({
                area: "Passing Range",
                detail: "Technical passing drills under pressure with emphasis on weight and accuracy"
            });
        }
        
        if (stats["Challenges_Tkl%"] < 65) {
            trainingFocus.push({
                area: "Defensive Positioning",
                detail: "Tactical sessions on reading the game and timing of defensive interventions"
            });
        }
        
        trainingFocus.push({
            area: "Spatial Awareness",
            detail: "Rondo sessions to improve scanning and decision-making in tight spaces"
        });
    } 
    else if (position.includes("DF")) {
        if (stats["Challenges_Tkl%"] < 65) {
            trainingFocus.push({
                area: "Defensive Technique",
                detail: "1v1 defending drills with focus on body position and timing of challenges"
            });
        }
        
        if (stats["Total_Cmp%"] < 80) {
            trainingFocus.push({
                area: "Build-up Play",
                detail: "Technical sessions on playing out from the back under pressure"
            });
        }
        
        trainingFocus.push({
            area: "Defensive Organization",
            detail: "Unit training on maintaining defensive shape and communication"
        });
    }
    
    // Limit to 3-4 areas
    return trainingFocus.slice(0, 4);
}

// Generate match preparation advice
function generateMatchPreparation(stats, position) {
    const preparation = [];
    
    // General preparation aspects
    preparation.push({
        aspect: "Video Analysis",
        detail: "Review opposition defensive/attacking patterns to identify exploitable weaknesses"
    });
    
    preparation.push({
        aspect: "Set-Piece Strategy",
        detail: "Specific role in attacking and defensive set-pieces based on strengths"
    });
    
    // Position-specific preparation
    if (position.includes("FW") || position.includes("ST") || position.includes("CF")) {
        preparation.push({
            aspect: "Opposition Analysis",
            detail: "Study individual defender tendencies and weaknesses to exploit during the match"
        });
        
        preparation.push({
            aspect: "Mental Preparation",
            detail: "Visualization exercises focusing on goal-scoring opportunities and composure in the final third"
        });
    } 
    else if (position.includes("MF")) {
        preparation.push({
            aspect: "Tactical Briefing",
            detail: "Review of opposition midfield structure and pressing triggers to identify space exploitation"
        });
        
        preparation.push({
            aspect: "Energy Management",
            detail: "Pacing strategy to maintain consistent performance levels throughout the match"
        });
    } 
    else if (position.includes("DF")) {
        preparation.push({
            aspect: "Opposition Forward Analysis",
            detail: "Study movement patterns and preferences of opposition attackers to anticipate threats"
        });
        
        preparation.push({
            aspect: "Communication Plan",
            detail: "Establish clear communication protocols with defensive unit for different game scenarios"
        });
    }
    
    return preparation;
}

// Helper functions for player traits analysis
function analyzePlayerTraits(stats, player) {
    const traits = [];

    // Identify traits based on stats
    if (stats["Take-Ons_Succ"] > 2) {
        traits.push("Skilled Dribbler");
    }

    if (stats["Int"] > 2) {
        traits.push("Ball Winner");
    }

    if (stats["Clr"] > 3) {
        traits.push("Defensive Anchor");
    }

    if (stats["Blocks_Blocks"] > 1.5) {
        traits.push("Defensive Stopper");
    }

    if (stats["Carries_Carries"] > 25) {
        traits.push("Ball Carrier");
    }

    if (stats["Carries_Mis"] < 1 && stats["Carries_Dis"] < 1) {
        traits.push("Secure in Possession");
    }

    if (stats["KP"] > 2) {
        traits.push("Playmaker");
    }

    if (stats.Performance_Gls > 10) {
        traits.push("Clinical Finisher");
    }

    if (stats.Performance_Ast > 8) {
        traits.push("Creative Provider");
    }

    if (stats["Total_Cmp%"] > 85) {
        traits.push("Precise Passer");
    }

    // Return top 3 traits
    return traits.slice(0, 3);
}

// Helper function for trait-based system recommendations
function getTraitBasedSystem(traits) {
    if (traits.includes("Skilled Dribbler") || traits.includes("Ball Carrier")) {
        return "counter-attacking systems and transition play";
    } else if (traits.includes("Ball Winner") || traits.includes("Defensive Stopper")) {
        return "pressing systems that emphasize ball recovery";
    } else if (traits.includes("Playmaker") || traits.includes("Creative Provider")) {
        return "possession-based systems that prioritize chance creation";
    } else if (traits.includes("Clinical Finisher")) {
        return "systems that create high-quality scoring opportunities";
    } else if (traits.includes("Precise Passer")) {
        return "technical systems that value ball retention";
    } else {
        return "balanced tactical setups";
    }
}

// Helper functions
function getPrimaryTouchArea(def, mid, att) {
    if (att > mid && att > def) return "attacking third";
    if (mid > att && mid > def) return "middle third";
    return "defensive third";
}

function getRoleDescription(role) {
    const descriptions = {
        Poacher: "A penalty box predator who focuses primarily on finishing chances created by teammates.",
        "Complete Forward": "Combines goalscoring ability with link-up play and movement across the attacking line.",
        "False Nine": "Drops deep from a forward position to create space and link midfield to attack.",
        "Advanced Playmaker": "Creates chances in the final third through vision and passing ability.",
        "Defensive Midfielder": "Shields the defense and recycles possession to more creative teammates.",
        "Central Midfielder": "A balanced midfielder who contributes to both defensive and offensive phases of play.",
        "Wing Back": "Provides width and attacking support from a nominal defensive position.",
        "Full Back": "Defends the wide areas while providing support in attack when appropriate.",
        "Central Defender": "Focuses primarily on defensive responsibilities, protecting the central areas.",
        "Versatile Player": "Adaptable performer capable of fulfilling multiple roles within the team structure.",
    };

    return descriptions[role] || "A player who contributes to the team in various ways based on tactical requirements.";
}

function getRoleMetrics(role, stats) {
    let metricsHTML = "";

    // Define metrics based on role and available stats
    let metrics = [];

    if (role === "Poacher" || role === "Complete Forward" || role === "False Nine") {
        metrics = [
            { name: "Goals", value: stats.Performance_Gls || 0 },
            { name: "Touches in Box", value: stats["Touches_Att Pen"] || 0 },
            { name: "Shot Accuracy %", value: stats["Standard_SoT%"] || 0 },
        ];
    } else if (role === "Advanced Playmaker") {
        metrics = [
            { name: "Key Passes", value: stats["KP"] || 0 },
            { name: "Assists", value: stats.Performance_Ast || 0 },
            { name: "Carries", value: stats["Carries_Carries"] || 0 },
        ];
    } else if (role === "Defensive Midfielder" || role === "Central Midfielder") {
        metrics = [
            { name: "Pass Completion %", value: stats["Total_Cmp%"] || 0 },
            { name: "Interceptions", value: stats["Int"] || 0 },
            { name: "Defensive Third Touches", value: stats["Touches_Def 3rd"] || 0 },
        ];
    } else if (role === "Wing Back" || role === "Full Back") {
        metrics = [
            { name: "Blocks", value: stats["Blocks_Blocks"] || 0 },
            { name: "Attacking Third Touches", value: stats["Touches_Att 3rd"] || 0 },
            { name: "Pass Completion %", value: stats["Total_Cmp%"] || 0 },
        ];
    } else if (role === "Central Defender") {
        metrics = [
            { name: "Clearances", value: stats["Clr"] || 0 },
            { name: "Blocks", value: stats["Blocks_Blocks"] || 0 },
            { name: "Defensive Penalty Area Touches", value: stats["Touches_Def Pen"] || 0 },
        ];
    } else {
        // Default metrics for other roles
        metrics = [
            { name: "Pass Completion %", value: stats["Total_Cmp%"] || 0 },
            { name: "Goal Contributions", value: (stats.Performance_Gls || 0) + (stats.Performance_Ast || 0) },
            { name: "Dribbles Completed", value: stats["Take-Ons_Succ"] || 0 },
        ];
    }

    // Generate HTML for metrics
    metrics.forEach(metric => {
        metricsHTML += `
        <div class="metric-item">
          <div class="metric-name">${metric.name}</div>
          <div class="metric-value">${metric.value}${metric.name.includes("%") ? "%" : ""}</div>
        </div>
      `;
    });

    return metricsHTML;
}

function getSystemCompatibility(role, playingStyle) {
    // Define compatibility statements based on role and playing style
    if (role === "Poacher") {
        return "Thrives in systems with creative wingers and midfielders who can provide service in the box.";
    } else if (role === "Complete Forward") {
        return "Ideal for possession-based systems where the forward needs to link play and finish attacks.";
    } else if (role === "False Nine") {
        return "Best suited to fluid attacking systems that allow movement between the lines and creative freedom.";
    } else if (role === "Advanced Playmaker") {
        return "Flourishes in attacking systems that allow freedom to create and take risks in the final third.";
    } else if (role === "Defensive Midfielder") {
        return "Perfect for systems that prioritize defensive solidity and controlled possession.";
    } else if (role === "Central Midfielder") {
        return "Adaptable to various tactical systems due to balanced skill set and positional discipline.";
    } else if (role === "Wing Back") {
        return "Ideal for systems using three center-backs, allowing freedom to advance into attacking positions.";
    } else if (role === "Full Back") {
        return "Suited to traditional four-defender systems requiring defensive stability with measured attacking support.";
    } else if (role === "Central Defender") {
        if (playingStyle === "ball-playing defender") {
            return "Well-suited to possession-based systems that build attacks from the back.";
        } else {
            return "Ideal for teams that prioritize defensive solidity and direct play.";
        }
    }

    // Default compatibility
    return "This player's versatility allows them to adapt to different tactical systems based on team requirements.";
}

function generateFutureProjection(player, age, stats) {
    const firstName = player.player.split(" ")[0];
    const position = player.best_position || "";

    if (age < 21) {
        return `${firstName} is still in the early development phase of their career. With proper coaching and continued playing time, significant improvement across all aspects of their game can be expected over the next three years. By age ${age + 3}, they should be approaching their developmental peak.`;
    } else if (age < 24) {
        return `At age ${age}, ${firstName} is entering a critical development period. The next three years should see them transition from a developing talent to an established ${position} player, with performance metrics likely to improve by 15-20% with consistent playing time.`;
    } else if (age < 28) {
        return `${firstName} is currently in their prime years. Over the next three seasons, they should maintain peak performance levels with potential for further tactical and technical refinement. Physical attributes are likely to remain stable through age ${age + 3}.`;
    } else if (age < 32) {
        return `As an experienced player at age ${age}, ${firstName} may begin to see some decline in physical attributes over the next three years, but this could be offset by improved tactical intelligence and efficiency. Adaptation of their playing style may be necessary to maintain effectiveness.`;
    } else {
        return `At age ${age}, ${firstName} is in the veteran stage of their career. The next three years will likely see a gradual reduction in playing time and physical output, though their experience and leadership qualities will remain valuable /static to their team.`;
    }
}

function generateDevelopmentFocus(player, age, stats) {
    const position = player.best_position || "";
    const focusAreas = [];

    // Age-specific focus areas
    if (age < 23) {
        focusAreas.push("Continue physical development with targeted strength and conditioning program");
        focusAreas.push("Gain experience through consistent playing time at appropriate competitive level");
    } else if (age < 28) {
        focusAreas.push("Maintain peak physical condition through optimized training and recovery protocols");
        focusAreas.push("Develop leadership qualities and tactical understanding");
    } else {
        focusAreas.push("Adapt training regimen to focus on injury prevention and recovery");
        focusAreas.push("Leverage experience to mentor younger players and contribute to team culture");
    }

    // Position-specific focus areas
    if (position.includes("FW") || position.includes("ST")) {
        if (stats["Standard_SoT%"] < 40) {
            focusAreas.push("Improve shot selection and accuracy to increase conversion rate");
        }
        if (stats["Take-Ons_Succ"] < 1.0 && (position.includes("FW") || position.includes("MF"))) {
            focusAreas.push("Develop dribbling technique to beat defenders in one-on-one situations");
        }
        if (stats["Carries_Dis"] > 1.5 || stats["Carries_Mis"] > 2) {
            focusAreas.push("Improve ball control and retention in tight spaces");
        }
    } else if (position.includes("MF")) {
        if (stats["Total_Cmp%"] < 85) {
            focusAreas.push("Work on pass completion in high-pressure situations");
        }
        if (stats["KP"] < 1.5) {
            focusAreas.push("Develop creative passing and vision to increase chance creation");
        }
    } else if (position.includes("DF")) {
        if (stats["Challenges_Tkl%"] < 65) {
            focusAreas.push("Focus on defensive positioning and tackling technique");
        }
        if (stats["Int"] < 1.5) {
            focusAreas.push("Improve reading of the game to increase interception rate");
        }
    }

    return focusAreas;
}

// Helper functions for trend analysis and other utilities
function generateTrendAnalysis(playerFirstName, goalsChange, assistsChange, passAccuracyChange, shotAccuracyChange) {
    const positiveChanges = [
        goalsChange > 0 ? "goal scoring" : null,
        assistsChange > 0 ? "assist creation" : null,
        passAccuracyChange > 2 ? "passing accuracy" : null,
        shotAccuracyChange > 5 ? "shooting efficiency" : null,
    ].filter(Boolean);

    const negativeChanges = [
        goalsChange < -2 ? "goal scoring" : null,
        assistsChange < -2 ? "assist creation" : null,
        passAccuracyChange < -5 ? "passing accuracy" : null,
        shotAccuracyChange < -5 ? "shooting efficiency" : null,
    ].filter(Boolean);

    let analysis = "";

    if (positiveChanges.length > 0) {
        analysis += `${playerFirstName} has shown significant improvement in ${formatList(positiveChanges)}. `;
    }

    if (negativeChanges.length > 0) {
        analysis += `However, there has been a decline in ${formatList(negativeChanges)}. `;
    }

    if (positiveChanges.length === 0 && negativeChanges.length === 0) {
        analysis += `${playerFirstName} has maintained consistent performance levels compared to the previous season. `;
    }

    // Add overall trend assessment
    const overallTrend = goalsChange + assistsChange * 0.8 + passAccuracyChange * 0.2 + shotAccuracyChange * 0.1;

    if (overallTrend > 5) {
        analysis += `Overall, ${playerFirstName} is showing exceptional development and is on an upward trajectory.`;
    } else if (overallTrend > 2) {
        analysis += `Overall, ${playerFirstName} is showing positive development this season.`;
    } else if (overallTrend > -2) {
        analysis += `Overall, ${playerFirstName} is maintaining a stable performance level.`;
    } else {
        analysis += `Overall, ${playerFirstName} may need to address certain aspects of their game to return to previous performance levels.`;
    }

    return analysis;
}

// Helper function to format lists in natural language
function formatList(items) {
    if (items.length === 0) return "";
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;

    const lastItem = items.pop();
    return `${items.join(", ")}, and ${lastItem}`;
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Generate position-specific development recommendations
function generatePositionBasedRecommendations(stats, player, weaknesses) {
    const position = player.best_position || player.pos || player.All_Positions || "";
    const recommendations = [];

    // Position-specific recommendations
    if (
        position.includes("FW") ||
        position.includes("ST") ||
        position.includes("CF") ||
        position.includes("LW") ||
        position.includes("RW")
    ) {
        // Forward-specific recommendations
        if (stats["Standard_SoT%"] < 40) {
            recommendations.push("Focus on shooting accuracy and shot selection to improve conversion rate");
        }
        if (stats["Carries_Dis"] > 1.5 || stats["Carries_Mis"] > 2) {
            recommendations.push("Improve ball control and retention in tight spaces to reduce turnovers");
        }
        if (stats.Performance_Gls < stats.Expected_xG) {
            recommendations.push("Practice finishing drills to improve clinical nature in front of goal");
        }
        if (stats["KP"] < 1.5 && stats.Performance_Ast < 5) {
            recommendations.push("Develop creative passing and vision to increase assist contributions");
        }
        if (stats["Take-Ons_Succ%"] < 50) {
            recommendations.push("Improve dribbling technique and decision-making in 1v1 situations");
        }
    } else if (
        position.includes("MF") ||
        position.includes("CM") ||
        position.includes("CDM") ||
        position.includes("CAM") ||
        position.includes("LM") ||
        position.includes("RM")
    ) {
        // Midfielder-specific recommendations
        if (stats["Total_Cmp%"] < 80) {
            recommendations.push("Improve passing accuracy, especially under pressure situations");
        }
        if (stats["KP"] < 1.5) {
            recommendations.push("Develop creative passing and vision to increase chance creation");
        }
        if (stats["Challenges_Tkl%"] < 60) {
            recommendations.push("Work on defensive positioning and tackling technique");
        }
        if (stats["Progression_PrgP"] < 5 && stats["Progression_PrgC"] < 5) {
            recommendations.push("Focus on progressive passing and ball carrying to advance play more effectively");
        }
        if (stats["Take-Ons_Succ%"] < 60) {
            recommendations.push("Improve ball retention in tight spaces to maintain possession under pressure");
        }
    } else if (position.includes("DF") || position.includes("CB") || position.includes("LB") || position.includes("RB")) {
        // Defender-specific recommendations
        if (stats["Challenges_Tkl%"] < 65) {
            recommendations.push("Focus on defensive positioning and tackling technique");
        }
        if ((stats["Int"] || 0) + (stats["Blocks_Blocks"] || 0) + (stats["Clr"] || 0) < 4) {
            recommendations.push("Work on defensive positioning and reading of the game to increase defensive actions");
        }
        if (stats["Total_Cmp%"] < 75) {
            recommendations.push("Work on passing accuracy to aid in build-up play");
        }
        if (stats["Err"] > 0) {
            recommendations.push("Develop concentration and decision-making to reduce defensive errors");
        }
        if (position.includes("LB") || position.includes("RB")) {
            if (stats["Touches_Att 3rd"] < 15) {
                recommendations.push("Increase attacking contributions from wide areas");
            }
        }
    } else if (position.includes("GK")) {
        // Goalkeeper-specific recommendations
        if (stats["Total_Cmp%"] < 70) {
            recommendations.push("Improve distribution accuracy, particularly under pressure");
        }
        recommendations.push("Work on command of area and decision-making for crosses");
    }

    // Add general recommendations if specific ones are limited
    if (recommendations.length < 2) {
        const age = Number.parseInt(player.age) || 25;

        if (age < 23) {
            recommendations.push("Continue overall development with focus on technical skills and tactical understanding");
        } else if (age < 30) {
            recommendations.push("Maintain peak physical condition while developing leadership qualities");
        } else {
            recommendations.push("Focus on game intelligence and positional play to maximize effectiveness");
        }
    }

    // Add recommendations based on identified weaknesses
    weaknesses.forEach((weakness) => {
        if (weakness.name === "disciplinary issues" && !recommendations.some((rec) => rec.includes("disciplinary"))) {
            recommendations.push(
                "Work with coaching staff on timing of challenges and positional discipline to reduce card accumulation"
            );
        }
        if (weakness.name === "ball retention issues" && !recommendations.some((rec) => rec.includes("ball retention"))) {
            recommendations.push("Focus on ball protection techniques and decision-making to reduce turnovers");
        }
    });

    // Limit to 3-4 recommendations
    return recommendations.slice(0, 4);
}

function getPlayerAgeCategory(age) {
    age = Number.parseInt(age) || 25;
    if (age < 21) return "young, promising";
    if (age < 24) return "developing";
    if (age < 28) return "prime";
    if (age < 32) return "experienced";
    return "veteran";
}

function getPerformanceAdjective(goalsPerMatch, assistsPerMatch) {
    const totalContribution = Number.parseFloat(goalsPerMatch) + Number.parseFloat(assistsPerMatch);

    if (totalContribution > 1.0) return "world-class";
    if (totalContribution > 0.8) return "exceptional";
    if (totalContribution > 0.5) return "outstanding";
    if (totalContribution > 0.3) return "solid";
    if (totalContribution > 0.1) return "modest";
    return "limited";
}

function getValueAssessment(marketValue, age, goals, assists) {
    if (!marketValue || marketValue === "N/A") return "has an undisclosed market value.";

    // Convert marketValue to string if it's not already
    const marketValueStr = typeof marketValue === "string" ? marketValue : String(marketValue);

    // Now safely use replace on the string version
    const numericValue = Number.parseFloat(marketValueStr.replace(/[^0-9.]/g, "")) || 0;

    const ageNum = Number.parseInt(age) || 25;
    const contribution = (goals || 0) + (assists || 0);

    if (ageNum < 23 && numericValue > 30) return "is considered one of the most valuable young talents in world football.";
    if (ageNum < 23 && numericValue > 15) return "represents a significant investment in young talent.";
    if (ageNum < 28 && contribution > 15 && numericValue > 40)
        return "commands an elite market valuation befitting their top-tier production.";
    if (ageNum < 28 && contribution > 10) return "has a market value that reflects their consistent contribution.";
    if (ageNum > 30 && numericValue > 20) return "maintains a strong market value despite advancing in age.";
    if (ageNum > 30) return "has a market value typical for a player in the later stages of their career.";

    return "has a market value that aligns with their current performance level.";
}

function getPerformanceIndicator(value, high, medium, low, isInverse = false) {
    value = Number.parseFloat(value);
    let indicatorClass = "neutral";

    if (isInverse) {
        if (value < low) indicatorClass = "excellent";
        else if (value < medium) indicatorClass = "good";
        else if (value < high) indicatorClass = "average";
        else indicatorClass = "poor";
    } else {
        if (value > high) indicatorClass = "excellent";
        else if (value > medium) indicatorClass = "good";
        else if (value > low) indicatorClass = "average";
        else indicatorClass = "poor";
    }

    return `<div class="performance-indicator ${indicatorClass}"></div>`;
}

function getChangeArrow(change) {
    if (change > 0) return "→";
    if (change < 0) return "→";
    return "→";
}

function getChangeClass(change) {
    if (change > 0) return "positive";
    if (change < 0) return "negative";
    return "neutral";
}

function getChangeText(change, isPercentage = false) {
    if (change > 0) return `+${isPercentage ? change.toFixed(1) : change}`;
    if (change < 0) return `${isPercentage ? change.toFixed(1) : change}`;
    return `No change`;
}

// Mock implementations for UI functions
function showLoading() {
    console.log("Loading player report...");
}

function hideLoading() {
    console.log("Player report loaded");
}

document.addEventListener("DOMContentLoaded", loadPlayerDetails);
