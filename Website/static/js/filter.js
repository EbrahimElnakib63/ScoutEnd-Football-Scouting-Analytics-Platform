const headerLinks = document.querySelectorAll(".headerlink");
const filterBtn = document.getElementById("filterBtn");
const filterPanel = document.getElementById("filterPanel");
const closeFilter = document.getElementById("closeFilter");
const searchInput = document.getElementById("player-search");
const autoCompleteResults = document.getElementById("auto-complete-results");
const playersPerPage = 100;
let currentPage = 1;
let allPlayers = [];
let currentFilteredPlayers = [];
let countryMapping = {};
let allTraits = new Set();
let selectedTraits = new Set();

// Helper function to normalize trait names
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Set active link styling
headerLinks.forEach((link) => {
    link.addEventListener("click", function() {
        headerLinks.forEach((item) => item.classList.remove("activelink"));
        link.classList.add("activelink");
    });
});

// Filter panel show/hide
filterBtn.addEventListener("click", () => {
    filterPanel.classList.add("active");
});

closeFilter.addEventListener("click", () => {
    filterPanel.classList.remove("active");
});

/*****************************************************************************
                    Load-Read -> CsvFile
******************************************************************************/
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

// Parse CSV into player objects and collect traits
function parseCSV(data) {
    const rows = data.split("\n").map((row) => row.split(","));
    const headers = rows[0].map((header) => header.trim());
    const players = rows.slice(1).map((row) => {
        const playerData = {};
        headers.forEach((header, index) => {
            playerData[header] = row[index] ? row[index].trim() : null;
            
            // Collect unique traits
            if (header === 'traits' && row[index]) {
                const playerTraits = row[index].split(',');
                playerTraits.forEach(trait => {
                    let cleanTrait = toTitleCase(trait.trim());
                    // Remove any quotation marks from the beginning
                    if (cleanTrait.startsWith('"')) {
                        cleanTrait = cleanTrait.substring(1).trim();
                    }
                    // Only add if not empty and doesn't start with quote
                    if (cleanTrait && !cleanTrait.startsWith('"')) {
                        allTraits.add(cleanTrait);
                    }
                });
            }
        });
        return playerData;
    });
    return players;
}

// Load player data from CSV
async function loadPlayerDataFromCSV() {
    try {
        showLoading();
        await loadCountryMapping();
        const response = await fetch("/static/data/FBREF_FIFA_Merged.csv");
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.text();
        allPlayers = parseCSV(data);
        document.getElementById("rowNumber").textContent = allPlayers.length;
        initializeApp(allPlayers);
    } catch (error) {
        console.error("Error loading player data:", error);
        alert("Failed to load player data. Please try again later.");
    } finally {
        hideLoading();
    }
}

/*****************************************************************************
                    Traits Filter Implementation
******************************************************************************/
// Populate traits checkboxes with search functionality
function populateTraitsOptions() {
    const container = document.getElementById('traits-container');
    container.innerHTML = '';
    
    const searchTerm = document.getElementById('traits-search').value.toLowerCase();
    
    Array.from(allTraits)
        .filter(trait => !trait.startsWith('"')) // Filter out any malformed traits
        .sort()
        .forEach(trait => {
            if (searchTerm && !trait.toLowerCase().includes(searchTerm)) return;
            
            const div = document.createElement('div');
            div.className = 'trait-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `trait-${trait.replace(/\s+/g, '-').toLowerCase()}`;
            checkbox.value = trait;
            checkbox.checked = selectedTraits.has(trait);
            checkbox.className = 'trait-checkbox-input';
            
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    selectedTraits.add(this.value);
                } else {
                    selectedTraits.delete(this.value);
                }
                updateSelectedTraitsDisplay();
            });
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = trait;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            container.appendChild(div);
        });
}

// Update the selected traits display
function updateSelectedTraitsDisplay() {
    const container = document.getElementById('selected-traits');
    container.innerHTML = '';
    
    selectedTraits.forEach(trait => {
        const badge = document.createElement('div');
        badge.className = 'selected-trait';
        badge.innerHTML = `
            ${trait}
            <section class="remove-trait" onclick="removeTrait('${trait.replace(/'/g, "\\'")}')">×</section>
        `;
        container.appendChild(badge);
    });
}

// Remove a selected trait
function removeTrait(trait) {
    selectedTraits.delete(trait);
    document.querySelectorAll('.trait-checkbox-input').forEach(checkbox => {
        if (checkbox.value === trait) checkbox.checked = false;
    });
    updateSelectedTraitsDisplay();
}

// Set up traits search
function setupTraitsSearch() {
    document.getElementById('traits-search').addEventListener('input', function() {
        populateTraitsOptions();
    });
}

/*****************************************************************************
                    Filter-Panel
******************************************************************************/
function populateSelectOptions() {
    const nationalitySet = new Set();
    const teamSet = new Set();
    const leagueSet = new Set();
    const positionSet = new Set();
    const seasonSet = new Set();
    
    allPlayers.forEach(player => {
        if (player.nation) nationalitySet.add(player.nation);
        if (player.team) teamSet.add(player.team);
        if (player.league) leagueSet.add(player.league);
        if (player.season) seasonSet.add(player.season);
        if (player.best_position) positionSet.add(player.best_position.trim());
    });

    populateDropdown('nationality', nationalitySet);
    populateDropdown('team', teamSet);
    populateDropdown('league', leagueSet);
    populateDropdown('position', positionSet);
    populateSeasonDropdown(seasonSet);
}

function populateDropdown(id, values) {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">All ${id.charAt(0).toUpperCase() + id.slice(1)}</option>`;
    Array.from(values).sort().forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });
}

function populateSeasonDropdown(seasons) {
    const select = document.getElementById('season');
    select.innerHTML = '<option value="">All Seasons</option>';
    Array.from(seasons).sort().forEach(season => {
        const option = document.createElement('option');
        option.value = season;
        option.textContent = `${season.slice(0, 2)}/${season.slice(2)}`;
        select.appendChild(option);
    });
}

/*****************************************************************************
                    Filtering Functionality (UPDATED TRAIT FILTER)
******************************************************************************/
function filterPlayers() {
    const nationality = document.getElementById('nationality').value;
    const position = document.getElementById('position').value;
    const team = document.getElementById('team').value;
    const league = document.getElementById('league').value;
    const season = document.getElementById('season').value;
    const ageInterval = document.getElementById('ageInterval').value;
    const sortBy = document.getElementById('sortBy').value;
    const selectedTraitsArray = Array.from(selectedTraits);

    currentFilteredPlayers = allPlayers.filter(player => {
        const age = parseInt(player.age, 10);
        const ageMatch = !ageInterval || (
            (ageInterval === "18-25" && age >= 18 && age <= 25) ||
            (ageInterval === "26-30" && age >= 26 && age <= 30) ||
            (ageInterval === "31-35" && age >= 31 && age <= 35) ||
            (ageInterval === "36-40" && age >= 36 && age <= 40)
        );
        
        const nationalityMatch = !nationality || player.nation === nationality;
        const positionMatch = !position || player.best_position === position;
        const teamMatch = !team || player.team === team;
        const leagueMatch = !league || player.league === league;
        const seasonMatch = !season || player.season === season;
        
        let traitsMatch = true;
        if (selectedTraitsArray.length > 0) {
            if (!player.traits) {
                traitsMatch = false;
            } else {
                const playerTraits = player.traits.split(',').map(t => {
                    let cleanTrait = toTitleCase(t.trim());
                    if (cleanTrait.startsWith('"')) {
                        cleanTrait = cleanTrait.substring(1).trim();
                    }
                    return cleanTrait;
                });
                // UPDATED: Now uses .some() to match ANY selected trait (OR logic)
                traitsMatch = selectedTraitsArray.some(trait => 
                    playerTraits.includes(trait)
                );
            }
        }
        
        return nationalityMatch && positionMatch && teamMatch && ageMatch && 
               leagueMatch && seasonMatch && traitsMatch;
    });

    if (sortBy) {
        currentFilteredPlayers.sort((a, b) => {
            const valueA = parseFloat(a[sortBy] || 0);
            const valueB = parseFloat(b[sortBy] || 0);
            return valueB - valueA;
        });
    }
    
    currentPage = 1;
    displayPlayers(currentFilteredPlayers);
    updatePaginationButtons(currentFilteredPlayers);
    document.getElementById("rowNumber").textContent = currentFilteredPlayers.length;
}

/*****************************************************************************
                    Display Players Table
******************************************************************************/
function displayPlayers(filteredPlayers) {
    const playersBody = document.getElementById('players-body');
    playersBody.innerHTML = "";
    const startIndex = (currentPage - 1) * playersPerPage;
    const endIndex = startIndex + playersPerPage;
    
    const playersToDisplay = filteredPlayers.length > 0 ? filteredPlayers : allPlayers;
    
    playersToDisplay.slice(startIndex, endIndex).forEach((player, index) => {
        const row = document.createElement('tr');
        const teamLogoUrl = `/static/imgs/logos/${encodeURIComponent(player.team?.toLowerCase() || 'default')}.webp`;
        const leagueLogoUrl = `/static/imgs/leagues/${encodeURIComponent(player.league?.toLowerCase() || 'default')}.png`;
        const fullCountryName = countryMapping[player.nation] || player.nation;
        const flagUrl = `/static/imgs/Countries/${fullCountryName}.png`;
        const age = parseInt(player.age, 10) || 'N/A';
        
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td data-label="Player: " id="Player_Name"><img src="${player.player_img}" alt="${player.player}" style="width: 50px; height: 50px; border-radius: 50%; background-color: #fff;">${player.player}</td>
            <td data-label="Team: " id="team-logo-cell"><img src="${teamLogoUrl}" alt="${player.team}" this.parentElement.textContent='${player.team}';"></td>
            <td data-label="League: " id="league-logo-cell"><img src="${leagueLogoUrl}" alt="${player.league}" this.parentElement.textContent='${player.league}';"></td>
            <td data-label="Nationality: " id="flag-cell"><img src="${flagUrl}" alt="${fullCountryName}"></td>
            <td data-label="Season: ">${player.season}</td>
            <td data-label="Position: ">${player.best_position}</td>
            <td data-label="Age: ">${age}</td>
            <td data-label="Goals: ">${player.Performance_Gls || 0}</td>
            <td data-label="Assists: ">${player.Performance_Ast || 0}</td>
            <td data-label="Pace(km/h): ">${player.pace}</td>
            <td data-label="Minutes Played: ">${player.Playing_Time_Min || 0}</td>
            <td data-label="XG: ">${player.Expected_xG || 0}</td>
        `;
        row.style.cursor = 'pointer';
        row.onclick = () => showPlayerDetails(player);
        playersBody.appendChild(row);
    });
    document.getElementById("currentPage").innerText = currentPage;
}

/*****************************************************************************
                    Search Functionality
******************************************************************************/
function showPlayerDetails(player) {
    const url = `/player-details?player=${encodeURIComponent(player.player)}&season=${encodeURIComponent(player.season)}`;
    window.location.href = url;
}

document.getElementById("searchButton").addEventListener("click", function() {
    const query = searchInput.value.trim().toLowerCase();
    if (query) searchPlayer(query);
    else alert("Please enter a player name to search.");
});

function searchPlayer(query) {
    const filteredPlayers = allPlayers.filter(player => 
        player.player && typeof player.player === "string" &&
        player.player.toLowerCase() === query
    );
    if (filteredPlayers.length > 0) displayPlayers(filteredPlayers);
    else alert("No matching player found.");
}

searchInput.addEventListener("input", function() {
    const query = this.value.toLowerCase().trim();
    autoCompleteResults.innerHTML = "";
    if (query.length > 0) {
        const seenPlayers = new Set();
        const filteredPlayers = allPlayers.filter((player) => {
            if (player.player && typeof player.player === "string") {
                const isDuplicate = seenPlayers.has(player.player.toLowerCase());
                if (!isDuplicate && player.player.toLowerCase().includes(query)) {
                    seenPlayers.add(player.player.toLowerCase());
                    return true;
                }
            }
            return false;
        });
        filteredPlayers.forEach((player) => {
            const resultItem = document.createElement("div");
            resultItem.textContent = player.player;
            resultItem.addEventListener("click", () => {
                searchInput.value = player.player;
                autoCompleteResults.innerHTML = "";
            });
            autoCompleteResults.appendChild(resultItem);
        });
    }
});

/*****************************************************************************
                    Pagination Control
******************************************************************************/
function changePage(direction) {
    const playersToDisplay = currentFilteredPlayers.length ? currentFilteredPlayers : allPlayers;
    const totalPages = Math.ceil(playersToDisplay.length / playersPerPage);
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    displayPlayers(playersToDisplay);
    updatePaginationButtons(playersToDisplay);
}

document.getElementById("prevPage").addEventListener("click", () => changePage(-1));
document.getElementById("nextPage").addEventListener("click", () => changePage(1));

function updatePaginationButtons(playersToDisplay) {
    const totalPlayers = playersToDisplay.length;
    const totalPages = Math.ceil(totalPlayers / playersPerPage);
    document.getElementById("prevPage").disabled = (currentPage <= 1);
    document.getElementById("nextPage").disabled = (currentPage >= totalPages);
}

/*****************************************************************************
                    Clear Filters
******************************************************************************/
function clearFilters() {
    document.getElementById('nationality').value = '';
    document.getElementById('position').value = '';
    document.getElementById('team').value = '';
    document.getElementById('league').value = '';
    document.getElementById('ageInterval').value = '';
    document.getElementById('season').value = '';
    document.getElementById('sortBy').value = '';
    document.getElementById('traits-search').value = '';
    searchInput.value = '';
    
    selectedTraits.clear();
    document.getElementById('selected-traits').innerHTML = "";
    document.querySelectorAll('.trait-checkbox-input').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    currentFilteredPlayers = [];
    displayPlayers(allPlayers);
    updatePaginationButtons(allPlayers);
    document.getElementById("rowNumber").textContent = allPlayers.length;
}

/*****************************************************************************
                    Initialize App
******************************************************************************/
function initializeApp(parsedData) {
    allPlayers = parsedData;
    populateSelectOptions();
    populateTraitsOptions();
    setupTraitsSearch();
    displayPlayers(allPlayers);
    updatePaginationButtons(allPlayers);
}

// Loading functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

window.onload = loadPlayerDataFromCSV;