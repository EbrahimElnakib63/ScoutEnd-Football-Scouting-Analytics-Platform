document.addEventListener("DOMContentLoaded", function () {
    const seasonSelect = document.getElementById('season');
    const leagueSelect = document.getElementById('league');
    const clubList = document.getElementById('club-list');
    let allClubs = [];
    // Load CSV data
    async function loadCSVData() {
        try {
            showLoading();
            const response = await fetch('/static/data/FBREF_FIFA_Merged.csv');
            if (!response.ok) throw new Error("Failed to fetch CSV data");
            const csvData = await response.text();
            const parsedData = Papa.parse(csvData, {
                header: true,
                dynamicTyping: false, 
                skipEmptyLines: true
            }).data;
            allClubs = parsedData;
                populateSelectMenus(parsedData);
        } catch (error) {
            console.error('Error loading CSV data:', error);
                alert("Failed to load data. Please try again later.");
        } finally {
            hideLoading();
        }
    }
    // Populate season and league select menus
    function populateSelectMenus(data) {
        const seasons = [...new Set(data.map(club => club.season))];
        const leagues = [...new Set(data.map(club => club.league))];
        // Populate season select menu
        seasons.forEach(season => {
            const option = document.createElement('option');
            option.value = season;
            option.textContent = season;
            seasonSelect.appendChild(option);
        });
        // Set the default value of season select to the last option
        if (seasons.length > 0) {
            seasonSelect.selectedIndex = seasons.length - 1;
        }
        // Populate league select menu
        leagues.forEach(league => {
            const option = document.createElement('option');
            option.value = league;
            option.textContent = league;
            leagueSelect.appendChild(option);
        });
        // Set the default value of league select to the last option
        if (leagues.length > 0) {
            leagueSelect.selectedIndex = leagues.length - 1;
        }
        // Trigger filtering after setting default values
        filterClubs();
    }
    // Filter clubs based on selected season and league
    function filterClubs() {
        const selectedSeason = seasonSelect.value.trim().toLowerCase();
        const selectedLeague = leagueSelect.value.trim().toLowerCase();
        // Filter clubs based on both season and league
        const filteredClubs = allClubs.filter(club => {
            // Convert season and league to strings (if they are not already)
            const clubSeason = String(club.season || "").trim().toLowerCase();
            const clubLeague = String(club.league || "").trim().toLowerCase();
            console.log("Club Data:", club); // Debugging: Check each club's data
            return clubSeason === selectedSeason && clubLeague === selectedLeague;
        });
        console.log("Filtered Clubs:", filteredClubs); // Debugging: Check filtered clubs
        // Remove duplicates by team name
        const uniqueClubs = [...new Set(filteredClubs.map(club => club.team))];
        console.log("Unique Clubs:", uniqueClubs); // Debugging: Check unique clubs

        displayClubs(uniqueClubs);
    }
    // Display clubs in the club list
    function displayClubs(clubs) {
        clubList.innerHTML = ''; // Clear previous results
        if (clubs.length === 0) {
            clubList.innerHTML = '<p>No clubs found for the selected season and league.</p>';
            return;
        }
        // Display clubs as cards
        clubs.forEach(team => {
            const clubCard = document.createElement('div');
            clubCard.classList.add('club-card');
            // Generate logo path
            const teamLogoPath = `/static/imgs/logos/${encodeURIComponent(team.toLowerCase())}.webp`;
            // Club logo
            const clubLogo = document.createElement('img');
            clubLogo.classList.add('club-logo');
            clubLogo.src = teamLogoPath;
            clubLogo.alt = `${team} Logo`;
            clubLogo.onerror = function () {
                this.src = '/static/imgs/logos/placeholder.png'; // Fallback for missing logos
            };
            // Club name
            const clubName = document.createElement('div');
            clubName.classList.add('club-name');
            clubName.textContent = team;
            // Append logo and name to the card
            clubCard.appendChild(clubLogo);
            clubCard.appendChild(clubName);
            // Add click event to navigate to club details page
            clubCard.addEventListener('click', () => {
                const selectedSeason = seasonSelect.value;
                const selectedLeague = leagueSelect.value;
                const url = `/club-details?club=${encodeURIComponent(team)}&league=${encodeURIComponent(selectedLeague)}&season=${encodeURIComponent(selectedSeason)}`;
                window.location.href = url;
            });
            // Append card to the club list
            clubList.appendChild(clubCard);
        });
    }
    // Event listeners for select menus
    seasonSelect.addEventListener('change', filterClubs);
    leagueSelect.addEventListener('change', filterClubs);
    loadCSVData();
});