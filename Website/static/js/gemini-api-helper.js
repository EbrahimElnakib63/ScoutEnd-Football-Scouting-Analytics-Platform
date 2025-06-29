// Helper functions for Gemini API integration

// Function to handle API errors and provide fallback
function handleGeminiApiError(error) {
    console.error("Gemini API Error:", error)
  
    // Log detailed error information for debugging
    if (error.response) {
      console.error("Response status:", error.response.status)
      console.error("Response data:", error.response.data)
    }
  
    // Return null to trigger fallback to standard analysis
    return null
  }
  
  // Function to validate player data before sending to API
  function validatePlayerData(playerData) {
    // Check for required fields
    const requiredFields = ["name", "position", "currentStats"]
    for (const field of requiredFields) {
      if (!playerData[field]) {
        console.warn(`Missing required field in player data: ${field}`)
        return false
      }
    }
  
    // Validate current stats
    if (!playerData.currentStats.appearances || playerData.currentStats.appearances === 0) {
      console.warn("Player has no appearances, data may be incomplete")
    }
  
    return true
  }
  
  // Function to format player data for better API consumption
  function formatPlayerDataForGemini(player, currentStats, prevStats) {
    // Calculate derived metrics that might be useful for analysis
    const goalsPerGame = currentStats["Playing Time_MP"]
      ? (currentStats.Performance_Gls / currentStats["Playing Time_MP"]).toFixed(2)
      : 0
  
    const assistsPerGame = currentStats["Playing Time_MP"]
      ? (currentStats.Performance_Ast / currentStats["Playing Time_MP"]).toFixed(2)
      : 0
  
    const dribbleSuccess = currentStats["Take-Ons_Succ"] || currentStats["Dribbles_Succ"] || 0
    const dribblesPerGame = currentStats["Playing Time_MP"]
      ? (dribbleSuccess / currentStats["Playing Time_MP"]).toFixed(2)
      : 0
  
    // Create a comprehensive player profile
    return {
      name: player.player,
      age: player.age,
      position: player.best_position || player.All_Positions,
      team: player.team,
      league: player.league,
      season: player.season,
      marketValue: player.market_value,
      currentStats: {
        appearances: currentStats["Playing Time_MP"] || 0,
        goals: currentStats.Performance_Gls || 0,
        goalsPerGame: goalsPerGame,
        assists: currentStats.Performance_Ast || 0,
        assistsPerGame: assistsPerGame,
        passAccuracy: currentStats["Total_Cmp%"] || 0,
        shotAccuracy: currentStats["Standard_SoT%"] || 0,
        successfulDribbles: dribbleSuccess,
        dribblesPerGame: dribblesPerGame,
        dribbleSuccessRate: currentStats["Take-Ons_Succ%"] || currentStats["Dribbles_Succ%"] || 0,
        keyPasses: currentStats["KP"] || 0,
        tackles: currentStats["Tackles_Tkl"] || 0,
        interceptions: currentStats["Int"] || 0,
        aerialWinRate: currentStats["Challenges_Tkl%"] || 0,
        xG: currentStats.Expected_xG || 0,
        xA: currentStats.Expected_xAG || 0,
        minutesPlayed: currentStats.Playing_Time_Min || 0,
        yellowCards: currentStats["Performance_CrdY"] || 0,
        redCards: currentStats["Performance_CrdR"] || 0,
      },
      previousStats: prevStats
        ? {
            season: prevStats.season,
            appearances: prevStats["Playing Time_MP"] || 0,
            goals: prevStats.Performance_Gls || 0,
            assists: prevStats.Performance_Ast || 0,
            passAccuracy: prevStats["Total_Cmp%"] || 0,
            shotAccuracy: prevStats["Standard_SoT%"] || 0,
          }
        : null,
    }
  }
  
  // Function to create a prompt for Gemini API
  function createGeminiPrompt(playerData) {
    return `
      You are an expert football/soccer analyst. Analyze this player's statistics and provide a detailed, accurate report.
      
      IMPORTANT: Make sure your recommendations are logical and consistent with the player's statistics. For example, if a player has high successful dribbles (>2 per game or >60% success rate), do NOT recommend they "develop dribbling skills" as that's already a strength.
      
      Player data: ${JSON.stringify(playerData, null, 2)}
      
      Please provide your analysis in JSON format with the following sections:
      1. overview: A paragraph summarizing the player's profile and performance
      2. trendAnalysis: Analysis of the player's development trend if previous season data exists
      3. strengthsWeaknesses: HTML for strengths and weaknesses section
      4. strengthWeaknessComparison: HTML for strength vs weakness comparison
      5. tacticalAnalysis: HTML for tactical analysis section
      6. futureOutlook: HTML for future outlook section
      7. coachRecommendation: HTML for coach's recommendation section
      
      For each section, provide accurate analysis based on the statistics. Ensure recommendations are logical - don't recommend improving areas that are already strengths.
      `
  }
  
  